<script lang="ts">
  import { state as app } from '../stores.svelte'
  import {
    KEYBOARD, KEYBOARD_UNITS_W, KEYBOARD_ROWS,
    KEYBOARD_SPLIT, KEYBOARD_SPLIT_UNITS_W, KEYBOARD_SPLIT_ROWS,
    isLayerKey, keyLabel,
  } from '../keymap'
  import { sequential } from '../palette'

  type Layout = 'chorne' | 'standard'
  const LAYOUTS: { id: Layout; label: string }[] = [
    { id: 'chorne', label: 'Chorne (split)' },
    { id: 'standard', label: 'Standard' },
  ]
  const savedLayout = (typeof localStorage !== 'undefined' && localStorage.getItem('kbLayout')) as Layout | null
  let layout = $state<Layout>(savedLayout ?? 'chorne')
  function setLayout(l: Layout) {
    layout = l
    try { localStorage.setItem('kbLayout', l) } catch { /* ignore */ }
  }

  const UNIT = 46
  const GAP = 4
  const active = $derived(layout === 'chorne' ? KEYBOARD_SPLIT : KEYBOARD)
  const svgW = $derived((layout === 'chorne' ? KEYBOARD_SPLIT_UNITS_W : KEYBOARD_UNITS_W) * UNIT)
  const svgH = $derived((layout === 'chorne' ? KEYBOARD_SPLIT_ROWS : KEYBOARD_ROWS) * UNIT)

  const s = $derived(app.stats)
  const mode = $derived(app.theme)
  const maxCount = $derived(Math.max(...Object.values(s.keyCounts), 1))

  // Perceptual spread: low counts are lifted so they stay visible.
  function ratio(count: number): number {
    return count <= 0 ? 0 : Math.sqrt(count / maxCount)
  }

  const keys = $derived(
    active.map((k) => {
      const layer = isLayerKey(k.code)
      const count = layer ? 0 : (s.keyCounts[k.code] || 0)
      const r = ratio(count)
      return {
        ...k,
        layer,
        count,
        fill: layer ? 'var(--surface-2)' : count > 0 ? sequential(r, mode) : 'var(--zero)',
        textFill: layer ? 'var(--muted)' : count > 0 ? (r > 0.5 ? '#fff' : 'var(--ink)') : 'var(--muted)',
        pct: s.totalPresses > 0 ? (count / s.totalPresses) * 100 : 0,
      }
    }),
  )

  let hovered = $state<{ label: string; count: number; pct: number } | null>(null)
  let tip = $state({ x: 0, y: 0 })
  let wrap: HTMLDivElement

  function onMove(e: MouseEvent) {
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    tip = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
</script>

<div class="card p-5">
  <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
    <h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Key Heatmap</h2>
    <div class="flex items-center gap-3">
      <!-- Layout toggle -->
      <div class="flex rounded-lg p-0.5 text-xs" style="background: var(--surface-2)">
        {#each LAYOUTS as l}
          <button onclick={() => setLayout(l.id)}
            class="rounded-md px-2.5 py-1 transition"
            style="{layout === l.id ? 'background: var(--accent); color: white' : 'color: var(--ink-2)'}">
            {l.label}
          </button>
        {/each}
      </div>
      <!-- Sequential legend -->
      <div class="flex items-center gap-2 text-xs" style="color: var(--muted)">
        <span>0</span>
        <div class="h-2.5 w-24 rounded-full"
          style="background: linear-gradient(90deg, var(--zero), {sequential(0.35, mode)}, {sequential(0.7, mode)}, {sequential(1, mode)})">
        </div>
        <span class="tabular-nums">{maxCount.toLocaleString()}</span>
      </div>
    </div>
  </div>

  <div bind:this={wrap} class="relative overflow-x-auto" role="img" aria-label="Keyboard heatmap"
       onmousemove={onMove} onmouseleave={() => (hovered = null)}>
    <svg viewBox="0 0 {svgW} {svgH}" width={svgW} height={svgH} class="min-w-[760px] max-w-full h-auto">
      {#each keys as k (k.code)}
        <g role="presentation"
           onmouseenter={() => (hovered = { label: keyLabel(k.code), count: k.count, pct: k.pct })}>
          <rect
            x={k.x * UNIT + GAP / 2}
            y={k.y * UNIT + GAP / 2}
            width={k.w * UNIT - GAP}
            height={UNIT - GAP}
            rx="7"
            fill={k.fill}
            stroke="var(--border)"
            stroke-width="1"
            class="cursor-default transition-[fill] duration-200"
          />
          <text
            x={k.x * UNIT + (k.w * UNIT) / 2}
            y={k.y * UNIT + UNIT / 2}
            text-anchor="middle"
            dominant-baseline="central"
            font-size={k.small ? 10 : 14}
            font-weight="600"
            fill={k.textFill}
            font-family="system-ui, sans-serif"
            pointer-events="none"
          >{k.label}</text>
        </g>
      {/each}
    </svg>

    {#if hovered}
      <div class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg px-2.5 py-1.5 text-xs shadow-lg"
        style="left: {tip.x}px; top: {tip.y - 8}px; background: var(--ink); color: var(--surface)">
        <span class="font-semibold">{hovered.label}</span>
        {#if hovered.count > 0}
          · {hovered.count.toLocaleString()} · {hovered.pct.toFixed(1)}%
        {:else}
          · no presses
        {/if}
      </div>
    {/if}
  </div>
</div>
