// ── Raw on-disk shapes ──────────────────────────────────────────────
// The tracker has written two schemas over time. We normalize both at the
// fetch boundary (see api.ts `normalize`) so nothing downstream cares which
// version produced a file.
//
// v1: { version: 1, count_freq: { "14": { "KEY_A": 12 } } }
// v2: { version: 2, keyboard_state: {...}, mouse_state: {...}, display_state: {...} }
export interface RawMouseState {
  left_click?: number
  right_click?: number
  middle_click?: number
  mouse_inches?: number
  mouse_scrolls?: number
}
export interface RawFile {
  version?: number
  // v1 keyboard field
  count_freq?: Record<string, Record<string, number>>
  // v2 fields
  keyboard_state?: Record<string, Record<string, number>>
  mouse_state?: RawMouseState
  display_state?: Record<string, number> // hour -> active seconds
}

// Camel-cased mouse totals used everywhere in the UI.
export interface MouseTotals {
  leftClick: number
  rightClick: number
  middleClick: number
  inches: number
  scrolls: number
}

// Canonical shape after normalization — the only thing components see.
export interface NormalizedData {
  version: number
  // outer key = hour "0".."23", inner key = evdev code, value = press count
  keyboard: Record<string, Record<string, number>>
  mouse: MouseTotals | null              // null when the file predates mouse tracking (v1)
  active: Record<string, number> | null  // hour -> active seconds; null for v1
}

export interface KeystrokeFile {
  date: string      // YYYY-MM-DD
  hostname: string  // device name
  data: NormalizedData
}

// One (date, host) pair known to exist in the data repo.
export interface ManifestEntry {
  date: string
  host: string
}

export type Grain = 'hour' | 'day' | 'week' | 'month'
export type TimePreset = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export interface TimeRange {
  preset: TimePreset
  start: string   // YYYY-MM-DD inclusive
  end: string     // YYYY-MM-DD inclusive
  grain: Grain
}

export interface KeyStat {
  code: string
  label: string
  count: number
  percentage: number
}

export interface TimeBucket {
  label: string                      // axis label
  total: number                      // combined presses in the bucket
  byHost: Record<string, number>     // per-device presses in the bucket
  activeSeconds: number              // active screen-time in the bucket (0 if none)
}

// Mouse activity for one time bucket. Mouse data has no hour dimension (it's a
// per-file daily total), so these buckets are date-based (day / week / month).
export interface MouseBucket {
  label: string
  leftClick: number
  rightClick: number
  middleClick: number
  clicks: number   // left + right + middle
  inches: number
  scrolls: number
}

export interface DeviceStat {
  host: string
  total: number
  percentage: number
  topKey: KeyStat | null
}

export interface AggregatedStats {
  totalPresses: number
  mostUsed: KeyStat | null
  leastUsed: KeyStat | null           // least-pressed letter with count > 0
  uniqueKeys: number
  homeRowPercent: number
  correctionRate: number              // backspace+delete / total, %
  modifierPercent: number
  leftHandPercent: number             // of hand-assignable presses
  estWords: number                    // presses / 5 heuristic
  peakHour: number | null             // 0-23 hour-of-day with most presses
  activeDays: number
  topKeys: KeyStat[]
  bottomKeys: KeyStat[]
  keyCounts: Record<string, number>   // combined per-key totals
  timeSeries: TimeBucket[]
  hourly: number[]                    // 24-length activity-by-hour-of-day
  devices: DeviceStat[]               // per-device breakdown (selected hosts)
  categories: { name: string; count: number }[]

  // ── Active screen-time (from display_state; v2+ only) ──────────────
  hasActiveData: boolean              // any active-time samples in range
  totalActiveSeconds: number          // summed active screen-time
  activeHourly: number[]              // 24-length active seconds by hour-of-day
  // NB: active-per-bucket lives on TimeBucket.activeSeconds, aligned to timeSeries.

  // ── Mouse (from mouse_state; v2+ only) ─────────────────────────────
  hasMouseData: boolean               // any file in range carried mouse data
  mouse: MouseTotals                  // summed over range (all zero if none)
  mouseSeries: MouseBucket[]          // per date/grain bucket, ascending
}
