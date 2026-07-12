// Finger assignment + keyboard-layout scoring.
//
// Two distinct concerns live here:
//  1. FINGER_BY_CODE — which finger physically presses each evdev key. Used by
//     the Finger Load view. Independent of logical layout (a physical key is a
//     physical key), so it's valid regardless of QWERTY/Colemak/etc.
//  2. LAYOUTS + scoreLayouts — takes your *letter* frequencies and asks "if
//     these letters lived on QWERTY vs Colemak vs Dvorak, how much would land on
//     the home row, and what would total finger effort be?"
//
// Assumption for (2): your counts are physical evdev codes typed on a QWERTY OS
// layout, so KEY_A == the letter 'a'. Configurable later if you remap in the OS.

export type Finger = 'LP' | 'LR' | 'LM' | 'LI' | 'RI' | 'RM' | 'RR' | 'RP' | 'thumb'

export const FINGER_ORDER: Finger[] = ['LP', 'LR', 'LM', 'LI', 'RI', 'RM', 'RR', 'RP']

export const FINGER_LABEL: Record<Finger, string> = {
  LP: 'L pinky', LR: 'L ring', LM: 'L middle', LI: 'L index',
  RI: 'R index', RM: 'R middle', RR: 'R ring', RP: 'R pinky', thumb: 'Thumbs',
}

export function handOf(f: Finger): 'left' | 'right' | 'thumb' {
  if (f === 'thumb') return 'thumb'
  return f[0] === 'L' ? 'left' : 'right'
}

// ── Physical finger per evdev code (touch-typing convention) ─────────
const FINGER_GROUPS: [Finger, string[]][] = [
  ['LP', ['KEY_ESC', 'KEY_GRAVE', 'KEY_1', 'KEY_Q', 'KEY_A', 'KEY_Z',
          'KEY_TAB', 'KEY_CAPSLOCK', 'KEY_LEFTSHIFT', 'KEY_LEFTCTRL', 'KEY_LEFTMETA']],
  ['LR', ['KEY_2', 'KEY_W', 'KEY_S', 'KEY_X']],
  ['LM', ['KEY_3', 'KEY_E', 'KEY_D', 'KEY_C']],
  ['LI', ['KEY_4', 'KEY_5', 'KEY_R', 'KEY_T', 'KEY_F', 'KEY_G', 'KEY_V', 'KEY_B']],
  ['RI', ['KEY_6', 'KEY_7', 'KEY_Y', 'KEY_U', 'KEY_H', 'KEY_J', 'KEY_N', 'KEY_M']],
  ['RM', ['KEY_8', 'KEY_I', 'KEY_K', 'KEY_COMMA']],
  ['RR', ['KEY_9', 'KEY_O', 'KEY_L', 'KEY_DOT']],
  ['RP', ['KEY_0', 'KEY_MINUS', 'KEY_EQUAL', 'KEY_P', 'KEY_LEFTBRACE', 'KEY_RIGHTBRACE',
          'KEY_BACKSLASH', 'KEY_SEMICOLON', 'KEY_APOSTROPHE', 'KEY_SLASH', 'KEY_ENTER',
          'KEY_RIGHTSHIFT', 'KEY_BACKSPACE', 'KEY_RIGHTCTRL', 'KEY_RIGHTMETA', 'KEY_LEFTALT']],
  ['thumb', ['KEY_SPACE']],
]

const STANDARD_MAP: Record<string, Finger> = Object.fromEntries(
  FINGER_GROUPS.flatMap(([finger, codes]) => codes.map((c) => [c, finger])),
)

// ── Finger profiles ──────────────────────────────────────────────────
// Ergonomic/columnar boards (Corne etc.) move keys off the pinky onto thumb
// clusters and reassign the inner keys. Non-Corne users keep the standard map.
export type FingerProfile = 'standard' | 'corne'

export const FINGER_PROFILES: { id: FingerProfile; label: string }[] = [
  { id: 'corne', label: 'Corne / split' },
  { id: 'standard', label: 'Standard' },
]

// Corne overrides on top of the standard map. Tuned to this setup:
//   thumb cluster = Space, Enter, Meta (windows), Ctrl
//   right index   = Backspace + Shift        (personal quirk)
//   left index    = Tab + Alt                (personal quirk)
// Number row & F row are unchanged (layered onto the letter positions).
const CORNE_OVERRIDES: Record<string, Finger> = {
  KEY_SPACE: 'thumb',
  KEY_ENTER: 'thumb',
  KEY_LEFTMETA: 'thumb', KEY_RIGHTMETA: 'thumb',
  KEY_LEFTCTRL: 'thumb', KEY_RIGHTCTRL: 'thumb',
  KEY_BACKSPACE: 'RI',
  KEY_RIGHTSHIFT: 'RI',
  KEY_TAB: 'LI',
  KEY_LEFTALT: 'LI',
}

const MAPS: Record<FingerProfile, Record<string, Finger>> = {
  standard: STANDARD_MAP,
  corne: { ...STANDARD_MAP, ...CORNE_OVERRIDES },
}

// Kept for callers that only need the default (standard) physical map.
export const FINGER_BY_CODE: Record<string, Finger> = STANDARD_MAP

export function fingerOf(code: string, profile: FingerProfile = 'standard'): Finger | null {
  return MAPS[profile][code] ?? null
}

// Sum presses onto each finger from a per-code count map, for a given profile.
export function fingerLoad(
  keyCounts: Record<string, number>,
  profile: FingerProfile = 'standard',
): Record<Finger, number> {
  const map = MAPS[profile]
  const out: Record<Finger, number> = { LP: 0, LR: 0, LM: 0, LI: 0, RI: 0, RM: 0, RR: 0, RP: 0, thumb: 0 }
  for (const [code, count] of Object.entries(keyCounts)) {
    const f = map[code]
    if (f) out[f] += count
  }
  return out
}

// ── Layout scoring ───────────────────────────────────────────────────
// Each layout is three rows of 10 columns (top / home / bottom). Column index
// maps to a finger; row index maps to a reach cost. Effort = row × finger weight.

export type LayoutName = 'QWERTY' | 'Colemak' | 'Dvorak'

const LAYOUT_ROWS: Record<LayoutName, [string, string, string]> = {
  QWERTY:  ['qwertyuiop', 'asdfghjkl;', 'zxcvbnm,./'],
  Colemak: ['qwfpgjluy;', 'arstdhneio', 'zxcvbkm,./'],
  Dvorak:  ["',.pyfgcrl", 'aoeuidhtns', ';qjkxbmwvz'],
}

// Column → finger for a 10-wide letter grid.
const COL_FINGER: Finger[] = ['LP', 'LR', 'LM', 'LI', 'LI', 'RI', 'RI', 'RM', 'RR', 'RP']

// Reach cost per row. Home row is cheapest. Corne's columnar (ortho) layout
// removes the row-stagger lateral reach, so rows are cheaper and the index
// columns don't over-stretch — hence a gentler model.
type EffortModel = 'staggered' | 'columnar'
const ROW_WEIGHT: Record<EffortModel, [number, number, number]> = {
  staggered: [1.6, 1.0, 1.9], // top, home, bottom
  columnar:  [1.3, 1.0, 1.5],
}
// Per-finger strength penalty (pinky weakest).
const FINGER_WEIGHT: Record<Finger, number> = {
  LP: 1.4, LR: 1.2, LM: 1.05, LI: 1.0, RI: 1.0, RM: 1.05, RR: 1.2, RP: 1.4, thumb: 1.0,
}

interface Slot { row: number; finger: Finger; effort: number }

function buildLayout(name: LayoutName, model: EffortModel): Record<string, Slot> {
  const rows = LAYOUT_ROWS[name]
  const rw = ROW_WEIGHT[model]
  const map: Record<string, Slot> = {}
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]
      const finger = COL_FINGER[c]
      map[ch] = { row: r, finger, effort: rw[r] * FINGER_WEIGHT[finger] }
    }
  })
  return map
}

// evdev code → the letter it produces under a QWERTY OS layout.
export function letterOf(code: string): string | null {
  const m = /^KEY_([A-Z])$/.exec(code)
  return m ? m[1].toLowerCase() : null
}

export interface LayoutScore {
  name: LayoutName
  homeRowPercent: number            // % of letter presses on the home row
  effort: number                    // avg reach-cost per letter press (lower = better)
  perFinger: Record<Finger, number> // letter presses per finger under this layout
  total: number                     // total letter presses scored
}

// Score every layout against your letter-frequency distribution.
export function scoreLayouts(keyCounts: Record<string, number>, model: EffortModel): LayoutScore[] {
  // Collapse to letter → frequency (only the 26 letters participate).
  const freq: Record<string, number> = {}
  for (const [code, count] of Object.entries(keyCounts)) {
    const ch = letterOf(code)
    if (ch) freq[ch] = (freq[ch] || 0) + count
  }
  const total = Object.values(freq).reduce((a, b) => a + b, 0)

  const names: LayoutName[] = ['QWERTY', 'Colemak', 'Dvorak']
  return names.map((name) => {
    const slots = buildLayout(name, model)
    let homeRow = 0
    let effortSum = 0
    const perFinger: Record<Finger, number> = { LP: 0, LR: 0, LM: 0, LI: 0, RI: 0, RM: 0, RR: 0, RP: 0, thumb: 0 }
    for (const [ch, count] of Object.entries(freq)) {
      const s = slots[ch]
      if (!s) continue
      if (s.row === 1) homeRow += count
      effortSum += s.effort * count
      perFinger[s.finger] += count
    }
    return {
      name,
      homeRowPercent: total > 0 ? (homeRow / total) * 100 : 0,
      effort: total > 0 ? effortSum / total : 0,
      perFinger,
      total,
    }
  })
}

export type { EffortModel }
