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

// Human-readable label for any evdev code (used in lists / tooltips).
const LABEL_BY_CODE: Record<string, string> = Object.fromEntries(
  KEYBOARD.map((k) => [k.code, k.label || 'Space']),
)

export function keyLabel(code: string): string {
  if (LABEL_BY_CODE[code]) return LABEL_BY_CODE[code]
  return code.replace(/^KEY_/, '').replace(/^KP/, 'Num ')
}
