# Keystroke Analytics

A sleek, static single-page dashboard that visualizes keystroke data collected by
the keystroke tracker daemon. Data lives in a separate public repo
([keystroke_data](https://github.com/apurbapokharel/keystroke_data)); this UI
fetches it at runtime and renders everything client-side. No backend.

## Features

- **Auto-loads the most recent day** with data (falls back to the latest available
  date — never a blank "today").
- **Time ranges** — Hourly, Daily, Weekly, Monthly, Yearly, and a Custom date
  range. Each range picks a sensible bucket grain (hour / day / week / month).
- **Multi-device aware** — every device that pushed a `keystrokes.json` for a day
  is discovered automatically. Totals combine all selected devices; each device
  keeps a stable color across every chart.
- **Key heatmap** — full physical keyboard (keybr-style) including the **F1–F12
  function row**, modifiers, and a navigation cluster, colored by press frequency
  with a perceptual sequential ramp and hover tooltips.
- **Keystrokes over time** — stacked bar chart broken down by device.
- **Device breakdown** — donut + per-device counts, share %, and each device's
  top key, plus a combined 100% share bar.
- **Top / least-used keys** ranked lists.
- **Extra metrics** — key-category composition (letters / whitespace / modifiers /
  navigation / …), left-vs-right hand balance, activity-by-hour-of-day, correction
  rate (backspace + delete), home-row %, estimated words typed, peak hour, and more.
- **Light / dark theme** toggle (remembers your choice).

## How data is loaded

1. One recursive GitHub tree API call builds a manifest of every `(date, host)`
   pair — no per-day requests, so it stays well under the API rate limit.
2. For the selected range, each `data/{date}/{host}/keystrokes.json` is fetched
   from `raw.githubusercontent.com` (no CORS, no rate limit) and cached in
   `localStorage` with a short TTL.
3. Files are merged and aggregated client-side into per-key, per-device, and
   per-time-bucket stats.

### JSON format consumed

```json
{ "version": 1, "count_freq": { "14": { "KEY_H": 32, "KEY_SPACE": 144 } } }
```

Outer key = hour (`"0"`–`"23"`), inner key = evdev code, value = press count.

## Configuration

Point at a different data repo in `src/lib/config.ts` (`repoOwner`, `repoName`,
`dataBranch`).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/keystroke_ui/
npm run build    # static output in dist/
npm run check    # type-check
```

Deployed to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.
