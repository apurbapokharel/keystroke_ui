import type { KeystrokeFile, TimePreset, TimeRange, Grain, AggregatedStats } from './types'
import { fetchManifest, fetchFiles, aggregate, addDays, parseDate, fmtDate, type Manifest } from './api'
import { deviceColor } from './palette'

type Theme = 'light' | 'dark'

let _manifest = $state<Manifest | null>(null)
let _files = $state<KeystrokeFile[]>([])
let _preset = $state<TimePreset>('hourly')
let _customStart = $state('')
let _customEnd = $state('')
let _selectedMachines = $state<Set<string>>(new Set())
let _loading = $state(false)
let _error = $state<string | null>(null)
let _theme = $state<Theme>('light')

function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000)
}

function computeRange(preset: TimePreset, m: Manifest): TimeRange {
  const latest = m.dates[m.dates.length - 1]
  const first = m.dates[0]
  switch (preset) {
    case 'hourly':
      return { preset, start: latest, end: latest, grain: 'hour' }
    case 'daily':
      return { preset, start: addDays(latest, -13), end: latest, grain: 'day' }
    case 'weekly':
      return { preset, start: addDays(latest, -83), end: latest, grain: 'week' }
    case 'monthly':
      return { preset, start: addDays(latest, -364), end: latest, grain: 'month' }
    case 'yearly':
      return { preset, start: first, end: latest, grain: 'month' }
    case 'custom': {
      const start = _customStart || latest
      const end = _customEnd || latest
      const [s, e] = start <= end ? [start, end] : [end, start]
      const span = daysBetween(s, e)
      const grain: Grain = span <= 2 ? 'hour' : span <= 45 ? 'day' : span <= 180 ? 'week' : 'month'
      return { preset, start: s, end: e, grain }
    }
  }
}

export const state = {
  get loading() { return _loading },
  get error() { return _error },
  get files() { return _files },
  get manifest() { return _manifest },
  get preset() { return _preset },
  get theme() { return _theme },
  get customStart() { return _customStart },
  set customStart(v: string) { _customStart = v },
  get customEnd() { return _customEnd },
  set customEnd(v: string) { _customEnd = v },
  get selectedMachines() { return _selectedMachines },

  get hasData() { return _files.length > 0 },
  get machineNames(): string[] {
    return [...new Set(_files.map((f) => f.hostname))].sort()
  },
  // Stable categorical color for a device, consistent across every chart.
  colorFor(host: string): string {
    const i = this.machineNames.indexOf(host)
    return deviceColor(i < 0 ? 0 : i, _theme)
  },
  get range(): TimeRange | null {
    return _manifest ? computeRange(_preset, _manifest) : null
  },
  get rangeLabel(): string {
    const r = this.range
    if (!r) return ''
    if (r.start === r.end) return prettyDate(r.start)
    return `${prettyDate(r.start)} — ${prettyDate(r.end)}`
  },
  get stats(): AggregatedStats {
    const empty = computeRange('hourly', _manifest ?? { entries: [], dates: [fmtDate(new Date(0))], hosts: [] })
    return aggregate(_files, _selectedMachines, _manifest ? computeRange(_preset, _manifest) : empty)
  },

  async init() {
    _loading = true
    _error = null
    _theme = (localStorage.getItem('theme') as Theme) || preferredTheme()
    applyTheme(_theme)
    try {
      _manifest = await fetchManifest()
      if (_manifest.dates.length === 0) { _error = 'No data found in the repository yet.'; return }
      await this.reload()
    } catch (e) {
      _error = e instanceof Error ? e.message : 'Failed to load data.'
    } finally {
      _loading = false
    }
  },

  async setPreset(p: TimePreset) {
    _preset = p
    if (p !== 'custom') await this.reload()
  },

  async reload() {
    if (!_manifest) return
    _loading = true
    _error = null
    try {
      const range = computeRange(_preset, _manifest)
      _files = await fetchFiles(_manifest, range)
      const names = [...new Set(_files.map((f) => f.hostname))]
      // Keep any still-present selections; default to all when nothing valid remains.
      const kept = new Set([..._selectedMachines].filter((h) => names.includes(h)))
      _selectedMachines = kept.size > 0 ? kept : new Set(names)
    } catch (e) {
      _error = e instanceof Error ? e.message : 'Failed to load data.'
    } finally {
      _loading = false
    }
  },

  toggleMachine(host: string) {
    const next = new Set(_selectedMachines)
    next.has(host) ? next.delete(host) : next.add(host)
    if (next.size === 0) return // never allow empty selection
    _selectedMachines = next
  },

  selectAllMachines() {
    _selectedMachines = new Set(this.machineNames)
  },

  toggleTheme() {
    _theme = _theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', _theme)
    applyTheme(_theme)
  },
}

function preferredTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  document.documentElement.dataset.theme = t
}
function prettyDate(s: string): string {
  const d = parseDate(s)
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${M[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}
