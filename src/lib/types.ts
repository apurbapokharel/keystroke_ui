export interface KeystrokeData {
  version: number
  // outer key = hour "0".."23", inner key = evdev code, value = press count
  count_freq: Record<string, Record<string, number>>
}

export interface KeystrokeFile {
  date: string      // YYYY-MM-DD
  hostname: string  // device name
  data: KeystrokeData
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
}
