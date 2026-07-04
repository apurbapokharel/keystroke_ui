import type { KeyMapEntry } from './types'

const K: Record<string, KeyMapEntry> = {
  KEY_GRAVE:        { row: 0, col: 0, w: 1, label: '`' },
  KEY_1:            { row: 0, col: 1, w: 1, label: '1' },
  KEY_2:            { row: 0, col: 2, w: 1, label: '2' },
  KEY_3:            { row: 0, col: 3, w: 1, label: '3' },
  KEY_4:            { row: 0, col: 4, w: 1, label: '4' },
  KEY_5:            { row: 0, col: 5, w: 1, label: '5' },
  KEY_6:            { row: 0, col: 6, w: 1, label: '6' },
  KEY_7:            { row: 0, col: 7, w: 1, label: '7' },
  KEY_8:            { row: 0, col: 8, w: 1, label: '8' },
  KEY_9:            { row: 0, col: 9, w: 1, label: '9' },
  KEY_0:            { row: 0, col: 10, w: 1, label: '0' },
  KEY_MINUS:        { row: 0, col: 11, w: 1, label: '-' },
  KEY_EQUAL:        { row: 0, col: 12, w: 1, label: '=' },

  KEY_Q:            { row: 1, col: 0, w: 1, label: 'Q' },
  KEY_W:            { row: 1, col: 1, w: 1, label: 'W' },
  KEY_E:            { row: 1, col: 2, w: 1, label: 'E' },
  KEY_R:            { row: 1, col: 3, w: 1, label: 'R' },
  KEY_T:            { row: 1, col: 4, w: 1, label: 'T' },
  KEY_Y:            { row: 1, col: 5, w: 1, label: 'Y' },
  KEY_U:            { row: 1, col: 6, w: 1, label: 'U' },
  KEY_I:            { row: 1, col: 7, w: 1, label: 'I' },
  KEY_O:            { row: 1, col: 8, w: 1, label: 'O' },
  KEY_P:            { row: 1, col: 9, w: 1, label: 'P' },
  KEY_LEFTBRACE:    { row: 1, col: 10, w: 1, label: '[' },
  KEY_RIGHTBRACE:   { row: 1, col: 11, w: 1, label: ']' },
  KEY_BACKSLASH:    { row: 1, col: 12, w: 1.5, label: '\\' },

  KEY_A:            { row: 2, col: 0, w: 1, label: 'A' },
  KEY_S:            { row: 2, col: 1, w: 1, label: 'S' },
  KEY_D:            { row: 2, col: 2, w: 1, label: 'D' },
  KEY_F:            { row: 2, col: 3, w: 1, label: 'F' },
  KEY_G:            { row: 2, col: 4, w: 1, label: 'G' },
  KEY_H:            { row: 2, col: 5, w: 1, label: 'H' },
  KEY_J:            { row: 2, col: 6, w: 1, label: 'J' },
  KEY_K:            { row: 2, col: 7, w: 1, label: 'K' },
  KEY_L:            { row: 2, col: 8, w: 1, label: 'L' },
  KEY_SEMICOLON:    { row: 2, col: 9, w: 1, label: ';' },
  KEY_APOSTROPHE:   { row: 2, col: 10, w: 1, label: "'" },

  KEY_Z:            { row: 3, col: 0, w: 1, label: 'Z' },
  KEY_X:            { row: 3, col: 1, w: 1, label: 'X' },
  KEY_C:            { row: 3, col: 2, w: 1, label: 'C' },
  KEY_V:            { row: 3, col: 3, w: 1, label: 'V' },
  KEY_B:            { row: 3, col: 4, w: 1, label: 'B' },
  KEY_N:            { row: 3, col: 5, w: 1, label: 'N' },
  KEY_M:            { row: 3, col: 6, w: 1, label: 'M' },
  KEY_COMMA:        { row: 3, col: 7, w: 1, label: ',' },
  KEY_DOT:          { row: 3, col: 8, w: 1, label: '.' },
  KEY_SLASH:        { row: 3, col: 9, w: 1, label: '/' },

  KEY_SPACE:        { row: 4, col: 0, w: 6.25, label: '' },
}

export const KEY_ORDER = Object.keys(K)
export const KEY_MAP = K

export function getColor(count: number, maxCount: number): string {
  if (count === 0) return '#e5e7eb'
  const ratio = count / maxCount
  const r = Math.round(55 + 200 * ratio)
  const g = Math.round(55 + 200 * (1 - ratio))
  const b = Math.round(200 + 55 * (1 - ratio))
  return `rgb(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)})`
}

export const SVG_CONFIG = {
  keyW: 52,
  keyH: 52,
  gap: 4,
  rx: 6,
  fontSize: 13,
  get rowH() { return this.keyH + this.gap },
  get colW() { return this.keyW + this.gap },
}
