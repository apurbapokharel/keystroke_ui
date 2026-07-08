export const CONFIG = {
  repoOwner: 'apurbapokharel',
  repoName: 'keystroke_data',
  dataBranch: 'main',
  get rawBaseUrl() {
    return `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/${this.dataBranch}/data`
  },
  get treeUrl() {
    return `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/git/trees/${this.dataBranch}?recursive=1`
  },
  topN: 12,
  cacheTtlMs: 5 * 60 * 1000, // localStorage cache TTL for fetched day/host files
}

const set = (...ks: string[]) => new Set(ks)

export const LETTER_KEYS = set(
  'KEY_A', 'KEY_B', 'KEY_C', 'KEY_D', 'KEY_E', 'KEY_F', 'KEY_G', 'KEY_H', 'KEY_I',
  'KEY_J', 'KEY_K', 'KEY_L', 'KEY_M', 'KEY_N', 'KEY_O', 'KEY_P', 'KEY_Q', 'KEY_R',
  'KEY_S', 'KEY_T', 'KEY_U', 'KEY_V', 'KEY_W', 'KEY_X', 'KEY_Y', 'KEY_Z',
)

export const HOME_ROW_KEYS = set(
  'KEY_A', 'KEY_S', 'KEY_D', 'KEY_F', 'KEY_G',
  'KEY_H', 'KEY_J', 'KEY_K', 'KEY_L', 'KEY_SEMICOLON', 'KEY_APOSTROPHE',
)

const DIGIT_KEYS = set('KEY_1', 'KEY_2', 'KEY_3', 'KEY_4', 'KEY_5', 'KEY_6', 'KEY_7', 'KEY_8', 'KEY_9', 'KEY_0')

const MODIFIER_KEYS = set(
  'KEY_LEFTSHIFT', 'KEY_RIGHTSHIFT', 'KEY_LEFTCTRL', 'KEY_RIGHTCTRL',
  'KEY_LEFTALT', 'KEY_RIGHTALT', 'KEY_LEFTMETA', 'KEY_RIGHTMETA', 'KEY_CAPSLOCK',
)

const NAV_KEYS = set(
  'KEY_UP', 'KEY_DOWN', 'KEY_LEFT', 'KEY_RIGHT',
  'KEY_HOME', 'KEY_END', 'KEY_PAGEUP', 'KEY_PAGEDOWN', 'KEY_INSERT', 'KEY_DELETE',
)

const FUNCTION_KEYS = set(
  'KEY_F1', 'KEY_F2', 'KEY_F3', 'KEY_F4', 'KEY_F5', 'KEY_F6',
  'KEY_F7', 'KEY_F8', 'KEY_F9', 'KEY_F10', 'KEY_F11', 'KEY_F12',
)

const WHITESPACE_KEYS = set('KEY_SPACE', 'KEY_TAB', 'KEY_ENTER', 'KEY_KPENTER')
const EDIT_KEYS = set('KEY_BACKSPACE', 'KEY_DELETE')

// Left/right hand split by physical key (touch-typing convention).
const LEFT_HAND = set(
  'KEY_GRAVE', 'KEY_1', 'KEY_2', 'KEY_3', 'KEY_4', 'KEY_5',
  'KEY_Q', 'KEY_W', 'KEY_E', 'KEY_R', 'KEY_T',
  'KEY_A', 'KEY_S', 'KEY_D', 'KEY_F', 'KEY_G',
  'KEY_Z', 'KEY_X', 'KEY_C', 'KEY_V', 'KEY_B',
)
const RIGHT_HAND = set(
  'KEY_6', 'KEY_7', 'KEY_8', 'KEY_9', 'KEY_0', 'KEY_MINUS', 'KEY_EQUAL',
  'KEY_Y', 'KEY_U', 'KEY_I', 'KEY_O', 'KEY_P', 'KEY_LEFTBRACE', 'KEY_RIGHTBRACE', 'KEY_BACKSLASH',
  'KEY_H', 'KEY_J', 'KEY_K', 'KEY_L', 'KEY_SEMICOLON', 'KEY_APOSTROPHE',
  'KEY_N', 'KEY_M', 'KEY_COMMA', 'KEY_DOT', 'KEY_SLASH',
)

export type Category = 'letters' | 'digits' | 'whitespace' | 'punctuation' | 'modifiers' | 'navigation' | 'function' | 'editing' | 'other'

const PUNCT_KEYS = set(
  'KEY_MINUS', 'KEY_EQUAL', 'KEY_LEFTBRACE', 'KEY_RIGHTBRACE', 'KEY_BACKSLASH',
  'KEY_SEMICOLON', 'KEY_APOSTROPHE', 'KEY_GRAVE', 'KEY_COMMA', 'KEY_DOT', 'KEY_SLASH',
)

export function categoryOf(code: string): Category {
  if (LETTER_KEYS.has(code)) return 'letters'
  if (DIGIT_KEYS.has(code)) return 'digits'
  if (EDIT_KEYS.has(code)) return 'editing'
  if (WHITESPACE_KEYS.has(code)) return 'whitespace'
  if (MODIFIER_KEYS.has(code)) return 'modifiers'
  if (NAV_KEYS.has(code)) return 'navigation'
  if (FUNCTION_KEYS.has(code)) return 'function'
  if (PUNCT_KEYS.has(code)) return 'punctuation'
  return 'other'
}

export const KEY_SETS = {
  letters: LETTER_KEYS,
  homeRow: HOME_ROW_KEYS,
  modifiers: MODIFIER_KEYS,
  leftHand: LEFT_HAND,
  rightHand: RIGHT_HAND,
}
