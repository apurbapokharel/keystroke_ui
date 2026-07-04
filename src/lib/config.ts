export const CONFIG = {
  repoOwner: 'apurbapokharel',
  repoName: 'keystroke_data',
  dataBranch: 'main',
  get rawBaseUrl() {
    return `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/${this.dataBranch}/data`
  },
  topN: 10,
  homeRowKeys: new Set([
    'KEY_A', 'KEY_S', 'KEY_D', 'KEY_F', 'KEY_G',
    'KEY_H', 'KEY_J', 'KEY_K', 'KEY_L',
    'KEY_SEMICOLON', 'KEY_APOSTROPHE',
  ]),
  letterKeys: new Set([
    'KEY_A','KEY_B','KEY_C','KEY_D','KEY_E','KEY_F','KEY_G',
    'KEY_H','KEY_I','KEY_J','KEY_K','KEY_L','KEY_M','KEY_N',
    'KEY_O','KEY_P','KEY_Q','KEY_R','KEY_S','KEY_T','KEY_U',
    'KEY_V','KEY_W','KEY_X','KEY_Y','KEY_Z',
  ]),
}
