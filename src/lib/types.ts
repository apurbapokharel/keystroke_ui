export interface KeystrokeFile {
  date: string
  hostname: string
  data: KeystrokeData
}

export interface KeystrokeData {
  version: number
  count_freq: Record<string, Record<string, number>>
}

export type TimePreset = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'

export interface TimeRange {
  preset: TimePreset
  start: Date
  end: Date
}

export interface KeyMapEntry {
  row: number
  col: number
  w: number
  label: string
}

export interface KeyStats {
  name: string
  label: string
  count: number
  percentage: number
}

export interface AggregatedStats {
  totalPresses: number
  mostUsed: KeyStats | null
  leastUsed: KeyStats | null
  homeRowPercent: number
  topKeys: KeyStats[]
  bottomKeys: KeyStats[]
  timeSeries: { label: string; count: number }[]
  keyCounts: Record<string, number>
}
