// Full physical-keyboard layout (keybr-style) with a function-key row, modifiers
// and a navigation cluster. Positions are in "key units"; the renderer scales
// them. Each entry maps an evdev key code to a slot.

export interface KeyDef {
  code: string   // evdev name, e.g. KEY_A
  x: number      // left edge, in key units
  y: number      // row index (0 = function row)
  w: number      // width in key units
  label: string  // primary glyph
  small?: boolean // render label at a smaller size (multi-char / modifier keys)
}

const U = 1

// Build a contiguous run of single-width keys starting at x0.
function run(y: number, x0: number, defs: [string, string][], w = U): KeyDef[] {
  return defs.map(([code, label], i) => ({ code, label, x: x0 + i * w, y, w }))
}

// ── Function row (y=0) ──────────────────────────────────────────────
const fRow: KeyDef[] = [
  { code: 'KEY_ESC', x: 0, y: 0, w: 1, label: 'Esc', small: true },
  ...run(0, 1.5, [['KEY_F1', 'F1'], ['KEY_F2', 'F2'], ['KEY_F3', 'F3'], ['KEY_F4', 'F4']]).map(k => ({ ...k, small: true })),
  ...run(0, 6, [['KEY_F5', 'F5'], ['KEY_F6', 'F6'], ['KEY_F7', 'F7'], ['KEY_F8', 'F8']]).map(k => ({ ...k, small: true })),
  ...run(0, 10.5, [['KEY_F9', 'F9'], ['KEY_F10', 'F10'], ['KEY_F11', 'F11'], ['KEY_F12', 'F12']]).map(k => ({ ...k, small: true })),
]

// ── Number row (y=1) ────────────────────────────────────────────────
const numRow: KeyDef[] = [
  ...run(1, 0, [
    ['KEY_GRAVE', '`'], ['KEY_1', '1'], ['KEY_2', '2'], ['KEY_3', '3'], ['KEY_4', '4'],
    ['KEY_5', '5'], ['KEY_6', '6'], ['KEY_7', '7'], ['KEY_8', '8'], ['KEY_9', '9'],
    ['KEY_0', '0'], ['KEY_MINUS', '-'], ['KEY_EQUAL', '='],
  ]),
  { code: 'KEY_BACKSPACE', x: 13, y: 1, w: 2, label: 'Bksp', small: true },
]

// ── QWERTY top row (y=2) ────────────────────────────────────────────
const topRow: KeyDef[] = [
  { code: 'KEY_TAB', x: 0, y: 2, w: 1.5, label: 'Tab', small: true },
  ...run(2, 1.5, [
    ['KEY_Q', 'Q'], ['KEY_W', 'W'], ['KEY_E', 'E'], ['KEY_R', 'R'], ['KEY_T', 'T'],
    ['KEY_Y', 'Y'], ['KEY_U', 'U'], ['KEY_I', 'I'], ['KEY_O', 'O'], ['KEY_P', 'P'],
    ['KEY_LEFTBRACE', '['], ['KEY_RIGHTBRACE', ']'],
  ]),
  { code: 'KEY_BACKSLASH', x: 13.5, y: 2, w: 1.5, label: '\\' },
]

// ── Home row (y=3) ──────────────────────────────────────────────────
const homeRow: KeyDef[] = [
  { code: 'KEY_CAPSLOCK', x: 0, y: 3, w: 1.75, label: 'Caps', small: true },
  ...run(3, 1.75, [
    ['KEY_A', 'A'], ['KEY_S', 'S'], ['KEY_D', 'D'], ['KEY_F', 'F'], ['KEY_G', 'G'],
    ['KEY_H', 'H'], ['KEY_J', 'J'], ['KEY_K', 'K'], ['KEY_L', 'L'],
    ['KEY_SEMICOLON', ';'], ['KEY_APOSTROPHE', "'"],
  ]),
  { code: 'KEY_ENTER', x: 12.75, y: 3, w: 2.25, label: 'Enter', small: true },
]

// ── Bottom row (y=4) ────────────────────────────────────────────────
const bottomRow: KeyDef[] = [
  { code: 'KEY_LEFTSHIFT', x: 0, y: 4, w: 2.25, label: 'Shift', small: true },
  ...run(4, 2.25, [
    ['KEY_Z', 'Z'], ['KEY_X', 'X'], ['KEY_C', 'C'], ['KEY_V', 'V'], ['KEY_B', 'B'],
    ['KEY_N', 'N'], ['KEY_M', 'M'], ['KEY_COMMA', ','], ['KEY_DOT', '.'], ['KEY_SLASH', '/'],
  ]),
  { code: 'KEY_RIGHTSHIFT', x: 12.25, y: 4, w: 2.75, label: 'Shift', small: true },
]

// ── Modifier row (y=5) ──────────────────────────────────────────────
const modRow: KeyDef[] = [
  { code: 'KEY_LEFTCTRL', x: 0, y: 5, w: 1.25, label: 'Ctrl', small: true },
  { code: 'KEY_LEFTMETA', x: 1.25, y: 5, w: 1.25, label: 'Meta', small: true },
  { code: 'KEY_LEFTALT', x: 2.5, y: 5, w: 1.25, label: 'Alt', small: true },
  { code: 'KEY_SPACE', x: 3.75, y: 5, w: 6.25, label: '' },
  { code: 'KEY_RIGHTALT', x: 10, y: 5, w: 1.25, label: 'Alt', small: true },
  { code: 'KEY_RIGHTMETA', x: 11.25, y: 5, w: 1.25, label: 'Meta', small: true },
  { code: 'KEY_COMPOSE', x: 12.5, y: 5, w: 1.25, label: 'Menu', small: true },
  { code: 'KEY_RIGHTCTRL', x: 13.75, y: 5, w: 1.25, label: 'Ctrl', small: true },
]

// ── Navigation cluster (right of the main block) ────────────────────
const NAV_X = 15.5
const navCluster: KeyDef[] = [
  { code: 'KEY_INSERT', x: NAV_X, y: 1, w: 1, label: 'Ins', small: true },
  { code: 'KEY_HOME', x: NAV_X + 1, y: 1, w: 1, label: 'Home', small: true },
  { code: 'KEY_PAGEUP', x: NAV_X + 2, y: 1, w: 1, label: 'PgUp', small: true },
  { code: 'KEY_DELETE', x: NAV_X, y: 2, w: 1, label: 'Del', small: true },
  { code: 'KEY_END', x: NAV_X + 1, y: 2, w: 1, label: 'End', small: true },
  { code: 'KEY_PAGEDOWN', x: NAV_X + 2, y: 2, w: 1, label: 'PgDn', small: true },
  { code: 'KEY_UP', x: NAV_X + 1, y: 4, w: 1, label: '↑' },
  { code: 'KEY_LEFT', x: NAV_X, y: 5, w: 1, label: '←' },
  { code: 'KEY_DOWN', x: NAV_X + 1, y: 5, w: 1, label: '↓' },
  { code: 'KEY_RIGHT', x: NAV_X + 2, y: 5, w: 1, label: '→' },
]

export const KEYBOARD: KeyDef[] = [
  ...fRow, ...numRow, ...topRow, ...homeRow, ...bottomRow, ...modRow, ...navCluster,
]

export const KEYBOARD_UNITS_W = NAV_X + 3 // total width in key units
export const KEYBOARD_ROWS = 6

// ── Split columnar (Corne-style) layout ─────────────────────────────
// Straight ortholinear grid, two halves with a center gap. Rows: F, number,
// top, home, bottom (+ thumb). evdev codes match the physical keys. Layer keys
// carry a LAYER* code (no data) and render greyed.
function k(code: string, x: number, y: number, label: string, small = false, w = U): KeyDef {
  return { code, x, y, w, label, small }
}

// Left columns 0..6, gap, right columns 8..14. Rows: F=0, num=1, top=2, home=3, bottom=4, thumb=5.
const LO = 0, LC1 = 1, LC5 = 5, LI = 6
const RI = 8, RC1 = 9, RC5 = 13, RO = 14

const splitLeft: KeyDef[] = [
  // F row: F11 on the outer column, F1–F5 on the finger columns
  k('KEY_F11', LO, 0, 'F11', true),
  ...run(0, LC1, [['KEY_F1', 'F1'], ['KEY_F2', 'F2'], ['KEY_F3', 'F3'], ['KEY_F4', 'F4'], ['KEY_F5', 'F5']]).map((d) => ({ ...d, small: true })),
  // Number row
  ...run(1, LC1, [['KEY_1', '1'], ['KEY_2', '2'], ['KEY_3', '3'], ['KEY_4', '4'], ['KEY_5', '5']]),
  // Top / home / bottom letter rows, with outer + inner extras
  k('KEY_ESC', LO, 2, 'Esc', true),
  ...run(2, LC1, [['KEY_Q', 'Q'], ['KEY_W', 'W'], ['KEY_E', 'E'], ['KEY_R', 'R'], ['KEY_T', 'T']]),
  k('KEY_LEFTALT', LI, 2, 'Alt', true),
  k('KEY_CAPSLOCK', LO, 3, 'Caps', true),
  ...run(3, LC1, [['KEY_A', 'A'], ['KEY_S', 'S'], ['KEY_D', 'D'], ['KEY_F', 'F'], ['KEY_G', 'G']]),
  k('KEY_TAB', LI, 3, 'Tab', true),
  k('KEY_LEFTSHIFT', LO, 4, 'Shift', true),
  ...run(4, LC1, [['KEY_Z', 'Z'], ['KEY_X', 'X'], ['KEY_C', 'C'], ['KEY_V', 'V'], ['KEY_B', 'B']]),
  // Thumb cluster
  k('KEY_LEFTCTRL', 4, 5, 'Ctrl', true),
  k('LAYER1', 5, 5, 'L1', true),
  k('KEY_SPACE', LI, 5, 'Space', true),
]

const splitRight: KeyDef[] = [
  // F row: F6–F10 on finger columns, F12 on the outer column
  ...run(0, RC1, [['KEY_F6', 'F6'], ['KEY_F7', 'F7'], ['KEY_F8', 'F8'], ['KEY_F9', 'F9'], ['KEY_F10', 'F10']]).map((d) => ({ ...d, small: true })),
  k('KEY_F12', RO, 0, 'F12', true),
  // Number row
  ...run(1, RC1, [['KEY_6', '6'], ['KEY_7', '7'], ['KEY_8', '8'], ['KEY_9', '9'], ['KEY_0', '0']]),
  // Letter rows, inner extras (Bksp/Shift) + outer extras (Alt/"/Del)
  k('KEY_BACKSPACE', RI, 2, 'Bksp', true),
  ...run(2, RC1, [['KEY_Y', 'Y'], ['KEY_U', 'U'], ['KEY_I', 'I'], ['KEY_O', 'O'], ['KEY_P', 'P']]),
  k('KEY_RIGHTALT', RO, 2, 'Alt', true),
  k('KEY_RIGHTSHIFT', RI, 3, 'Shift', true),
  ...run(3, RC1, [['KEY_H', 'H'], ['KEY_J', 'J'], ['KEY_K', 'K'], ['KEY_L', 'L'], ['KEY_SEMICOLON', ';']]),
  k('KEY_APOSTROPHE', RO, 3, "'"),
  ...run(4, RC1, [['KEY_N', 'N'], ['KEY_M', 'M'], ['KEY_COMMA', ','], ['KEY_DOT', '.'], ['KEY_SLASH', '/']]),
  k('KEY_DELETE', RO, 4, 'Del', true),
  // Thumb cluster
  k('KEY_ENTER', RI, 5, 'Enter', true),
  k('LAYER2', RC1, 5, 'L1', true),
  k('KEY_RIGHTMETA', 10, 5, 'Win', true),
]

export const KEYBOARD_SPLIT: KeyDef[] = [...splitLeft, ...splitRight]
export const KEYBOARD_SPLIT_UNITS_W = RO + 1
export const KEYBOARD_SPLIT_ROWS = 6

// Layer keys carry no keystroke data — render them as inert placeholders.
export function isLayerKey(code: string): boolean {
  return code.startsWith('LAYER')
}

// Human-readable label for any evdev code (used in lists / tooltips).
const LABEL_BY_CODE: Record<string, string> = Object.fromEntries(
  KEYBOARD.map((k) => [k.code, k.label || 'Space']),
)

export function keyLabel(code: string): string {
  if (isLayerKey(code)) return 'Layer'
  if (LABEL_BY_CODE[code]) return LABEL_BY_CODE[code]
  return code.replace(/^KEY_/, '').replace(/^KP/, 'Num ')
}
