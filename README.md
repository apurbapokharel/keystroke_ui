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
- **Activity over time** — stacked bar chart broken down by device, with a
  **Keystrokes / Active time / Both** toggle. "Both" overlays active screen-time
  as a line on a second axis so you can see typing volume against time at the
  keyboard. Active time buckets on the same grain as keystrokes (hour → month).
- **Mouse** *(dedicated tab)* — lifetime travel distance (inches → miles), total
  clicks with a left / right / middle split, scroll ticks, plus clicks-over-time
  and travel-over-time charts. A compact mouse strip also appears on the Overview
  at day-and-up grains. (Mouse totals have no hour resolution — they're a per-day
  figure — so mouse charts only bucket per day / week / month.)
- **Active screen-time** — surfaced on the Overview: total awake-and-unlocked
  time and a keys-per-active-minute rate, alongside the toggle above.
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

### JSON format consumed (v1 and v2)

The tracker has written two on-disk schemas. Both are supported — every file is
run through `normalize()` (`src/lib/api.ts`) at the fetch boundary into one
canonical shape, so the rest of the app never branches on version.

**v1** — keyboard only:

```json
{ "version": 1, "count_freq": { "14": { "KEY_H": 32, "KEY_SPACE": 144 } } }
```

**v2** — keyboard renamed to `keyboard_state`, plus mouse and active screen-time:

```json
{
  "version": 2,
  "keyboard_state": { "14": { "KEY_H": 32, "KEY_SPACE": 144 } },
  "mouse_state": { "left_click": 812, "right_click": 96, "middle_click": 4,
                   "mouse_inches": 40312.5, "mouse_scrolls": 1503 },
  "display_state": { "14": 3600, "15": 2750 }
}
```

- **Keyboard** — `count_freq` (v1) and `keyboard_state` (v2) share the identical
  `{ hour: { evdev_code: count } }` inner shape; only the field name changed.
  Outer key = hour (`"0"`–`"23"`), inner key = evdev code, value = press count.
- **`mouse_state`** — one flat total per file (no hour dimension). Absent in v1.
- **`display_state`** — active screen-time as `{ hour: seconds }`. Absent in v1.

v1 files simply render with no mouse / active-time views; v2 files light them up.
The per-file `localStorage` cache is namespaced `ks:v2:` so upgrading never
serves a stale un-normalized entry.

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
The workflow runs `npm ci && npm run build` on the runner and publishes the
resulting `dist/` — it builds from source, so you never commit build output
(`dist` is gitignored). A push therefore deploys even without a local build, but
a **build-breaking** change fails the deploy job (the previous live site stays
up until it's fixed). Note the workflow runs `build` only, not `check`, and
`vite build` strips types without type-checking — so run `npm run check` locally
to catch type errors the deploy won't.
