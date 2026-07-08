<script lang="ts">
  import { state } from '../stores.svelte'

  const s = $derived(state.stats)

  // Donut geometry (stroke-dasharray technique).
  const R = 58
  const CIRC = 2 * Math.PI * R
  const GAP = 2 // px surface gap between segments

  const segments = $derived.by(() => {
    let offset = 0
    return s.devices.map((d) => {
      const frac = d.percentage / 100
      const len = Math.max(frac * CIRC - GAP, 0)
      const seg = { host: d.host, color: state.colorFor(d.host), len, gap: CIRC - len, offset }
      offset -= frac * CIRC
      return seg
    })
  })
</script>

<div class="card p-5">
  <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Device Breakdown</h2>

  <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
    <!-- Donut -->
    <div class="relative shrink-0" style="width: 150px; height: 150px">
      <svg viewBox="0 0 150 150" class="-rotate-90">
        <circle cx="75" cy="75" r={R} fill="none" stroke="var(--surface-2)" stroke-width="18" />
        {#each segments as seg (seg.host)}
          <circle cx="75" cy="75" r={R} fill="none" stroke={seg.color} stroke-width="18"
            stroke-dasharray="{seg.len} {seg.gap}" stroke-dashoffset={seg.offset} stroke-linecap="butt" />
        {/each}
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-bold tabular-nums" style="color: var(--ink)">{s.totalPresses.toLocaleString()}</span>
        <span class="text-xs" style="color: var(--muted)">total presses</span>
      </div>
    </div>

    <!-- Per-device legend -->
    <div class="w-full flex-1 space-y-2.5">
      {#each s.devices as d (d.host)}
        <div class="flex items-center gap-3">
          <span class="h-3 w-3 shrink-0 rounded-full" style="background: {state.colorFor(d.host)}"></span>
          <span class="min-w-0 flex-1 truncate text-sm font-medium" style="color: var(--ink)">{d.host}</span>
          {#if d.topKey}
            <span class="hidden text-xs sm:inline" style="color: var(--muted)">top: {d.topKey.label}</span>
          {/if}
          <span class="w-16 text-right text-sm tabular-nums" style="color: var(--ink-2)">{d.total.toLocaleString()}</span>
          <span class="w-12 text-right text-sm font-semibold tabular-nums" style="color: var(--ink)">{d.percentage.toFixed(0)}%</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Combined 100% share bar -->
  <div class="mt-5 flex h-3 w-full overflow-hidden rounded-full" style="background: var(--surface-2)">
    {#each s.devices as d (d.host)}
      <div style="width: {d.percentage}%; background: {state.colorFor(d.host)}"
        title="{d.host}: {d.percentage.toFixed(1)}%"></div>
    {/each}
  </div>
</div>
