import { CONFIG, LETTER_KEYS, HOME_ROW_KEYS, KEY_SETS, categoryOf } from './config'
import type {
  KeystrokeData, KeystrokeFile, ManifestEntry, TimeRange, Grain,
  AggregatedStats, KeyStat, TimeBucket, DeviceStat,
} from './types'
import { keyLabel } from './keymap'

// ── Date helpers (UTC, string-based to dodge timezone drift) ────────
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
export function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
export function addDays(s: string, n: number): string {
  const d = parseDate(s)
  d.setUTCDate(d.getUTCDate() + n)
  return fmtDate(d)
}
function mondayOf(s: string): string {
  const d = parseDate(s)
  const dow = (d.getUTCDay() + 6) % 7 // 0 = Monday
  d.setUTCDate(d.getUTCDate() - dow)
  return fmtDate(d)
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function shortDay(s: string): string {
  const d = parseDate(s)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}

// ── Manifest discovery (one recursive tree call, no per-day requests) ─
export interface Manifest {
  entries: ManifestEntry[]
  dates: string[]  // sorted ascending
  hosts: string[]  // sorted
}

export async function fetchManifest(): Promise<Manifest> {
  const res = await fetch(CONFIG.treeUrl, { headers: { Accept: 'application/vnd.github.v3+json' } })
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`)
  const json: { tree?: { path: string; type: string }[] } = await res.json()
  const entries: ManifestEntry[] = []
  const re = /^data\/(\d{4}-\d{2}-\d{2})\/([^/]+)\/keystrokes\.json$/
  for (const node of json.tree ?? []) {
    const m = node.path.match(re)
    if (m) entries.push({ date: m[1], host: m[2] })
  }
  const dates = [...new Set(entries.map((e) => e.date))].sort()
  const hosts = [...new Set(entries.map((e) => e.host))].sort()
  return { entries, dates, hosts }
}

// ── File fetch with a small localStorage cache ──────────────────────
async function fetchFile(date: string, host: string): Promise<KeystrokeFile | null> {
  const cacheKey = `ks:${date}:${host}`
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { t, data } = JSON.parse(cached)
      if (Date.now() - t < CONFIG.cacheTtlMs) return { date, hostname: host, data }
    }
  } catch { /* ignore cache errors */ }

  const url = `${CONFIG.rawBaseUrl}/${date}/${host}/keystrokes.json`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data: KeystrokeData = await res.json()
    try { localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data })) } catch { /* quota */ }
    return { date, hostname: host, data }
  } catch {
    return null
  }
}

// Fetch every (date, host) file whose date falls inside the range.
export async function fetchFiles(manifest: Manifest, range: TimeRange): Promise<KeystrokeFile[]> {
  const wanted = manifest.entries.filter((e) => e.date >= range.start && e.date <= range.end)
  const results = await Promise.all(wanted.map((e) => fetchFile(e.date, e.host)))
  return results.filter((f): f is KeystrokeFile => f !== null)
}

// ── Aggregation ─────────────────────────────────────────────────────
interface Cell { date: string; hour: number; host: string; count: number; keys: Record<string, number> }

function bucketKeyAndLabel(date: string, hour: number, grain: Grain, singleDay: boolean): [string, string] {
  switch (grain) {
    case 'hour': {
      const hh = `${String(hour).padStart(2, '0')}:00`
      const key = `${date} ${String(hour).padStart(2, '0')}` // padded so string sort is chronological
      return singleDay ? [key, hh] : [key, `${shortDay(date)} ${hh}`]
    }
    case 'day':
      return [date, shortDay(date)]
    case 'week': {
      const wk = mondayOf(date)
      return [wk, `Wk ${shortDay(wk)}`]
    }
    case 'month': {
      const ym = date.slice(0, 7)
      const d = parseDate(date)
      return [ym, `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`]
    }
  }
}

function ratioStat(code: string, count: number, total: number): KeyStat {
  return { code, label: keyLabel(code), count, percentage: total > 0 ? (count / total) * 100 : 0 }
}

export function aggregate(files: KeystrokeFile[], selectedHosts: Set<string>, range: TimeRange): AggregatedStats {
  const active = files.filter((f) => selectedHosts.size === 0 || selectedHosts.has(f.hostname))

  const perKey: Record<string, number> = {}
  const perHostTotal: Record<string, number> = {}
  const perHostKeys: Record<string, Record<string, number>> = {}
  const hourly = new Array(24).fill(0)
  const cells: Cell[] = []
  const activeDates = new Set<string>()

  for (const file of active) {
    activeDates.add(file.date)
    for (const [hourStr, keys] of Object.entries(file.data.count_freq)) {
      const hour = Number(hourStr)
      let cellTotal = 0
      for (const [code, count] of Object.entries(keys)) {
        perKey[code] = (perKey[code] || 0) + count
        perHostTotal[file.hostname] = (perHostTotal[file.hostname] || 0) + count
        ;(perHostKeys[file.hostname] ??= {})[code] = (perHostKeys[file.hostname]?.[code] || 0) + count
        hourly[hour] += count
        cellTotal += count
      }
      cells.push({ date: file.date, hour, host: file.hostname, count: cellTotal, keys })
    }
  }

  const totalPresses = Object.values(perKey).reduce((a, b) => a + b, 0)

  // Time-series buckets (per grain), retaining per-host breakdown.
  const singleDay = activeDates.size <= 1
  const bucketMap = new Map<string, { label: string; total: number; byHost: Record<string, number> }>()
  for (const c of cells) {
    const [key, label] = bucketKeyAndLabel(c.date, c.hour, range.grain, singleDay)
    let b = bucketMap.get(key)
    if (!b) { b = { label, total: 0, byHost: {} }; bucketMap.set(key, b) }
    b.total += c.count
    b.byHost[c.host] = (b.byHost[c.host] || 0) + c.count
  }
  const timeSeries: TimeBucket[] = [...bucketMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([, v]) => v)

  // Ranked keys.
  const sorted = Object.entries(perKey).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
  const topKeys = sorted.slice(0, CONFIG.topN).map(([code, count]) => ratioStat(code, count, totalPresses))
  const letterSorted = sorted.filter(([code]) => LETTER_KEYS.has(code))
  const bottomKeys = letterSorted.slice(-CONFIG.topN).map(([code, count]) => ratioStat(code, count, totalPresses)).reverse()

  // Derived metrics.
  const sumOf = (pred: (code: string) => boolean) =>
    Object.entries(perKey).reduce((a, [k, c]) => a + (pred(k) ? c : 0), 0)
  const totalLetters = sumOf((k) => LETTER_KEYS.has(k))
  const homeRowCount = sumOf((k) => HOME_ROW_KEYS.has(k))
  const corrections = (perKey['KEY_BACKSPACE'] || 0) + (perKey['KEY_DELETE'] || 0)
  const modifiers = sumOf((k) => KEY_SETS.modifiers.has(k))
  const leftHand = sumOf((k) => KEY_SETS.leftHand.has(k))
  const rightHand = sumOf((k) => KEY_SETS.rightHand.has(k))
  const handTotal = leftHand + rightHand

  const peakHour = hourly.some((v) => v > 0) ? hourly.indexOf(Math.max(...hourly)) : null

  // Per-device breakdown with each device's own top key.
  const devices: DeviceStat[] = Object.entries(perHostTotal)
    .sort((a, b) => b[1] - a[1])
    .map(([host, total]) => {
      const kv = Object.entries(perHostKeys[host] || {}).sort((a, b) => b[1] - a[1])[0]
      return {
        host,
        total,
        percentage: totalPresses > 0 ? (total / totalPresses) * 100 : 0,
        topKey: kv ? ratioStat(kv[0], kv[1], total) : null,
      }
    })

  // Category composition.
  const catMap: Record<string, number> = {}
  for (const [code, count] of Object.entries(perKey)) {
    const cat = categoryOf(code)
    catMap[cat] = (catMap[cat] || 0) + count
  }
  const categories = Object.entries(catMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalPresses,
    mostUsed: topKeys[0] || null,
    leastUsed: bottomKeys[bottomKeys.length - 1] || null,
    uniqueKeys: Object.keys(perKey).length,
    homeRowPercent: totalLetters > 0 ? (homeRowCount / totalLetters) * 100 : 0,
    correctionRate: totalPresses > 0 ? (corrections / totalPresses) * 100 : 0,
    modifierPercent: totalPresses > 0 ? (modifiers / totalPresses) * 100 : 0,
    leftHandPercent: handTotal > 0 ? (leftHand / handTotal) * 100 : 0,
    estWords: Math.round(totalLetters / 5),
    peakHour,
    activeDays: activeDates.size,
    topKeys,
    bottomKeys,
    keyCounts: perKey,
    timeSeries,
    hourly,
    devices,
    categories,
  }
}
