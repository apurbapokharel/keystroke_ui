# tracker_ui — Keystroke Visualization Dashboard

## Overview

A static SPA hosted on GitHub Pages that visualizes keystroke data collected by
[keystroke_tracker](https://github.com/anomalyco/keystroke_tracker). The data
lives in a separate GitHub repository (`tracker_data`) and is pushed there by
the tracker daemon. This UI fetches the raw JSON files and renders interactive
charts and a heatmap keyboard.

---

## Architecture

```
GitHub (tracker_data repo)          GitHub Pages (tracker_ui)
        │                                    │
        │ raw.githubusercontent.com          │
        │   ┌──────────────┐                │
        └──►│  SvelteKit   │◄───────────────┘
            │  (static)    │
            │              │
            │  Fetch JSON  │
            │  Merge data  │
            │  Render viz  │
            └──────────────┘
```

- No backend. The SvelteKit app is built as a static site and deployed to
  GitHub Pages.
- Data is fetched at runtime from `raw.githubusercontent.com` on the
  `tracker_data` repo.
- All aggregation / merging happens client-side.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **SvelteKit** | Reactive, tiny bundles, static adapter, great DX |
| Styling | **Tailwind CSS** | Utility-first, rapid iteration, consistent look |
| Charts | **Chart.js** | Simple bar/line charts for time-series data |
| Deployment | **GitHub Actions → `gh-pages`** | Automatic deploy on push |
| Data source | **`raw.githubusercontent.com`** | No CORS issues for public repos |

---

## Data Flow

1. App loads → discovers available date folders in the `data/` directory of the
   `tracker_data` repo (by fetching a list of known URL patterns or a manifest).
2. User selects a time range (hourly / daily / weekly / monthly / custom).
3. App fetches all `data/{YYYY-MM-DD}/{hostname}/keystrokes.json` files within
   the range.
4. JSON files are merged by summing `count_freq` maps:
   - Same hour → sum key counts
   - Same key → sum counts across hours if displaying at daily/weekly grain
5. Computed stats are passed to visualization components.
6. Results are cached in `localStorage` with a TTL to avoid redundant fetches.

### JSON Format (consumed by UI)

```json
{
  "version": 1,
  "count_freq": {
    "14": { "KEY_H": 32, "KEY_SPACE": 144, "KEY_A": 12 },
    "15": { "KEY_H": 8,  "KEY_E": 20 }
  }
}
```

Outer key   = hour (0–23 as string)
Inner key   = evdev key name (e.g., `"KEY_A"`, `"KEY_SPACE"`)
Inner value = press count

---

## Component Tree

```
App.svelte
├── StatsBar.svelte
│   ├── Total presses
│   ├── Most used key
│   ├── Least used key (alphanumeric only)
│   └── Home row %
├── TimeRangePicker.svelte
│   ├── Preset buttons (Hourly / Daily / Weekly / Monthly)
│   └── Custom date range (start / end input)
├── MachineFilter.svelte
│   └── Checkboxes per hostname + "All"/"Combined"
├── Keyboard.svelte
│   └── SVG heatmap keyboard (standard QWERTY, like keybr.com)
├── TopKeys.svelte
│   ├── Top N most pressed (N configurable, default 10)
│   └── Bottom N least pressed (N configurable, default 10)
└── TimeChart.svelte
    └── Bar/line chart over the selected grain (Chart.js)
```

### Component Details

#### StatsBar

- **Total presses**: sum of all `u32` counts across the selected range/machine.
- **Most used key**: key with highest total count.
- **Least used key**: key with lowest non-zero count (letters only).
- **Home row %**: percentage of letter-key presses that fall on the QWERTY home
  row: `A S D F G H J K L ; '` (plus lowercase equivalents `KEY_A` .. `KEY_APOSTROPHE`).
  Formula: `home_row_count / total_letter_count * 100`.

#### TimeRangePicker

Presets define the fetch scope and the x-axis grain:

| Preset | Fetches | Chart grain |
|---|---|---|
| Hourly | Current day only | Hour (0–23) |
| Daily | Current day only | Hours within that day |
| Weekly | Last 7 days | Day |
| Monthly | Last 30 days | Day |
| Custom | User-specified range | Determined by span (≤1 day = hour, ≤31 days = day, else week) |

#### MachineFilter

- Reads hostname from fetched file paths.
- Checkboxes: each hostname + "All" (default).
- Selecting "All" merges data from all machines.
- Selecting a single machine filters to that hostname's files only.

#### Keyboard SVG

A simplified standard QWERTY keyboard drawn in SVG, similar to the visual
keyboard on keybr.com.

**Key set shown** (alphanumeric + common punctuation / modifiers):

```
Row 1: `  1  2  3  4  5  6  7  8  9  0  -  =
Row 2: Tab  Q  W  E  R  T  Y  U  I  O  P  [  ]  \
Row 3: Caps  A  S  D  F  G  H  J  K  L  ;  '  Enter
Row 4: Shift  Z  X  C  V  B  N  M  ,  .  /  Shift
Row 5: Ctrl  Super  Alt        Space        Alt  Super  Ctrl
```

- Each key is a `<rect>` with `<text>` label.
- Fill color is mapped from press frequency using a perceptually-uniform
  colormap (viridis / plasma) — zero-pressed keys are gray.
- Keys not represented in the `count_freq` data appear as light gray.
- Hovering a key shows a tooltip with the key name and press count / percentage.

**Data → position mapping**: A static JSON object maps evdev key names to SVG
coordinates (column, row, width). For example:
```js
{
  "KEY_A":       { col: 1, row: 2, w: 1 },
  "KEY_B":       { col: 4, row: 3, w: 1 },
  "KEY_SPACE":   { col: 2, row: 4, w: 6 },
  "KEY_LEFTSHIFT": { col: 0, row: 3, w: 1.5 },
}
```

#### TopKeys

- Two sorted lists: most-pressed (descending) and least-pressed (ascending,
  filtered to keys with count > 0).
- Configurable N (default 10).
- Each row: rank, key name, count, bar progress indicator.

#### TimeChart

- Chart.js bar chart.
- X-axis: time buckets (hours or days depending on grain).
- Y-axis: total keystrokes.
- Optional: stacked by machine if multiple machines selected.

---

## Deployment

1. Build with `npm run build` (SvelteKit static adapter outputs to `build/`).
2. Deploy to GitHub Pages via GitHub Actions workflow:

```yaml
on: push
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

3. Configure GitHub Pages to serve from the `gh-pages` branch.

---

## Data Repository URL

The `tracker_data` repo URL is requested during install and stored in `.env`.
For the frontend, it will be hard-coded in a config file (since this is a
separate project). The raw URL base will be:

```
https://raw.githubusercontent.com/<user>/<tracker_data_repo>/main/data/
```

---

## Future Enhancements

- Dark / light theme toggle.
- Corne (columnar) keyboard layout as an alternative to standard.
- Shareable snapshot URL with date/machine params.
- Typing speed estimate (keystrokes / active time).
- Per-key timing data if the tracker is enhanced to record timestamps.
