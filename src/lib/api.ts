import { CONFIG } from './config'
import type { KeystrokeFile, KeystrokeData, TimeRange, AggregatedStats, KeyStats } from './types'
import { KEY_MAP, KEY_ORDER } from './keymap'

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function fetchJson(url: string): Promise<KeystrokeData | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchData(range: TimeRange): Promise<KeystrokeFile[]> {
  const files: KeystrokeFile[] = []
  const start = new Date(range.start)
  const end = new Date(range.end)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = dateStr(d)

    const hosts = await discoverHosts(day)
    for (const host of hosts) {
      const url = `${CONFIG.rawBaseUrl}/${day}/${host}/keystrokes.json`
      const data = await fetchJson(url)
      if (data) {
        files.push({ date: day, hostname: host, data })
      }
    }
  }

  return files
}

async function discoverHosts(day: string): Promise<string[]> {
  const url = `${CONFIG.rawBaseUrl}/${day}/`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const text = await res.text()
    const hosts: string[] = []
    const regex = /href="([^"/]+)\/"/g
    let match
    while ((match = regex.exec(text)) !== null) {
      if (match[1] !== '..' && match[1] !== '.') {
        hosts.push(match[1])
      }
    }
    return hosts
  } catch {
    return []
  }
}

export function aggregateData(files: KeystrokeFile[], selectedHosts: Set<string>): AggregatedStats {
  const merged: Record<string, Record<string, number>> = {}

  for (const file of files) {
    if (selectedHosts.size > 0 && !selectedHosts.has(file.hostname)) continue

    for (const [hourStr, keys] of Object.entries(file.data.count_freq)) {
      if (!merged[hourStr]) merged[hourStr] = {}
      for (const [key, count] of Object.entries(keys)) {
        merged[hourStr][key] = (merged[hourStr][key] || 0) + count
      }
    }
  }

  return computeStats(merged)
}

function computeStats(countFreq: Record<string, Record<string, number>>): AggregatedStats {
  const perKey: Record<string, number> = {}

  for (const keys of Object.values(countFreq)) {
    for (const [key, count] of Object.entries(keys)) {
      perKey[key] = (perKey[key] || 0) + count
    }
  }

  const totalPresses = Object.values(perKey).reduce((a, b) => a + b, 0)
  const totalLetters = Object.entries(perKey)
    .filter(([k]) => CONFIG.letterKeys.has(k))
    .reduce((a, [, c]) => a + c, 0)
  const homeRowCount = Object.entries(perKey)
    .filter(([k]) => CONFIG.homeRowKeys.has(k))
    .reduce((a, [, c]) => a + c, 0)

  const sorted = Object.entries(perKey)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])

  const topKeys: KeyStats[] = sorted.slice(0, CONFIG.topN).map(([name, count]) => ({
    name,
    label: KEY_MAP[name]?.label || name.replace('KEY_', ''),
    count,
    percentage: totalPresses > 0 ? (count / totalPresses) * 100 : 0,
  }))

  const bottomKeys: KeyStats[] = sorted
    .filter(([k]) => CONFIG.letterKeys.has(k))
    .slice(-CONFIG.topN)
    .map(([name, count]) => ({
      name,
      label: KEY_MAP[name]?.label || name.replace('KEY_', ''),
      count,
      percentage: totalPresses > 0 ? (count / totalPresses) * 100 : 0,
    }))
    .reverse()

  const timeSeries = Object.entries(countFreq)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([hour, keys]) => ({
      label: `${hour}:00`,
      count: Object.values(keys).reduce((a, b) => a + b, 0),
    }))

  return {
    totalPresses,
    mostUsed: topKeys[0] || null,
    leastUsed: bottomKeys[bottomKeys.length - 1] || null,
    homeRowPercent: totalLetters > 0 ? (homeRowCount / totalLetters) * 100 : 0,
    topKeys,
    bottomKeys,
    timeSeries,
    keyCounts: perKey,
  }
}

export function getMachineNames(files: KeystrokeFile[]): string[] {
  return [...new Set(files.map((f) => f.hostname))]
}
