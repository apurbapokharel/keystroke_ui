import type { KeystrokeFile, TimePreset, AggregatedStats } from './types'
import { fetchData, aggregateData, getMachineNames } from './api'

let _timePreset = $state<TimePreset>('daily')
let _customStart = $state('')
let _customEnd = $state('')
let _selectedMachines = $state<Set<string>>(new Set())
let _files = $state<KeystrokeFile[]>([])
let _loading = $state(false)

export const state = {
  get timePreset() { return _timePreset },
  set timePreset(v: TimePreset) { _timePreset = v },
  get customStart() { return _customStart },
  set customStart(v: string) { _customStart = v },
  get customEnd() { return _customEnd },
  set customEnd(v: string) { _customEnd = v },
  get selectedMachines() { return _selectedMachines },
  set selectedMachines(v: Set<string>) { _selectedMachines = v },
  get files() { return _files },
  set files(v: KeystrokeFile[]) { _files = v },
  get loading() { return _loading },
  set loading(v: boolean) { _loading = v },

  get machineNames() {
    return getMachineNames(_files)
  },

  get stats(): AggregatedStats {
    return aggregateData(_files, _selectedMachines)
  },

  async load() {
    _loading = true
    const range = computeRange(_timePreset, _customStart, _customEnd)
    try {
      _files = await fetchData(range)
      if (_selectedMachines.size === 0 && getMachineNames(_files).length > 0) {
        _selectedMachines = new Set(getMachineNames(_files))
      }
    } finally {
      _loading = false
    }
  },

  toggleMachine(hostname: string) {
    const next = new Set(_selectedMachines)
    if (next.has(hostname)) {
      next.delete(hostname)
    } else {
      next.add(hostname)
    }
    _selectedMachines = next
  },
}

function computeRange(preset: TimePreset, start: string, end: string) {
  const now = new Date()
  switch (preset) {
    case 'hourly':
    case 'daily':
      return { preset, start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: now }
    case 'weekly': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return { preset, start: d, end: now }
    }
    case 'monthly': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      return { preset, start: d, end: now }
    }
    case 'custom':
      return { preset, start: new Date(start || now), end: end ? new Date(end) : now }
  }
}
