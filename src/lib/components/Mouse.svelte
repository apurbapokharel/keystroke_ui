<script lang="ts">
  import { state } from '../stores.svelte'
  import { formatDistance, toMiles } from '../format'
  import MouseChart from './MouseChart.svelte'

  const s = $derived(state.stats)
  const totalClicks = $derived(s.mouse.leftClick + s.mouse.rightClick + s.mouse.middleClick)
  const pct = (n: number) => (totalClicks > 0 ? (n / totalClicks) * 100 : 0)

  const cards = $derived([
    { label: 'Distance', value: formatDistance(s.mouse.inches), sub: `${toMiles(s.mouse.inches).toFixed(3)} miles` },
    { label: 'Total Clicks', value: totalClicks.toLocaleString(), sub: `${s.mouseSeries.length} active day${s.mouseSeries.length === 1 ? '' : 's'}` },
    { label: 'Left Clicks', value: s.mouse.leftClick.toLocaleString(), sub: `${pct(s.mouse.leftClick).toFixed(0)}% of clicks` },
    { label: 'Right Clicks', value: s.mouse.rightClick.toLocaleString(), sub: `${pct(s.mouse.rightClick).toFixed(0)}% of clicks` },
    { label: 'Middle Clicks', value: s.mouse.middleClick.toLocaleString(), sub: `${pct(s.mouse.middleClick).toFixed(0)}% of clicks` },
    { label: 'Scrolls', value: s.mouse.scrolls.toLocaleString(), sub: 'scroll ticks' },
  ])

  // L/R/M split bar segments.
  const split = $derived([
    { label: 'Left', v: s.mouse.leftClick, color: 'var(--accent)' },
    { label: 'Right', v: s.mouse.rightClick, color: '#1baf7a' },
    { label: 'Middle', v: s.mouse.middleClick, color: '#eda100' },
  ])
</script>

{#if !s.hasMouseData}
  <div class="card p-16 text-center">
    <p class="text-lg font-medium" style="color: var(--ink)">No mouse data in this range</p>
    <p class="mt-1 text-sm" style="color: var(--muted)">
      Mouse tracking is available from tracker v2 onward — pick a more recent range.
    </p>
  </div>
{:else}
  <div class="space-y-4">
    <!-- Lifetime / range cards -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {#each cards as c}
        <div class="card p-4">
          <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--muted)">{c.label}</p>
          <p class="mt-1 text-3xl font-bold" style="color: var(--ink)">{c.value}</p>
          {#if c.sub}<p class="mt-0.5 text-xs" style="color: var(--ink-2)">{c.sub}</p>{/if}
        </div>
      {/each}
    </div>

    <!-- Click-type split -->
    <div class="card p-5">
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Click Distribution</h3>
      {#if totalClicks === 0}
        <p class="py-3 text-center text-xs" style="color: var(--muted)">No clicks recorded.</p>
      {:else}
        <div class="flex h-6 w-full overflow-hidden rounded-md">
          {#each split as seg}
            {#if seg.v > 0}
              <div class="flex items-center justify-center text-xs font-semibold text-white"
                style="width: {pct(seg.v)}%; background: {seg.color}" title="{seg.label}: {seg.v.toLocaleString()}">
                {pct(seg.v) >= 8 ? `${pct(seg.v).toFixed(0)}%` : ''}
              </div>
            {/if}
          {/each}
        </div>
        <div class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs" style="color: var(--muted)">
          {#each split as seg}
            <span class="inline-flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full" style="background: {seg.color}"></span>
              {seg.label} · {seg.v.toLocaleString()}
            </span>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Clicks over time -->
    <div class="card p-5">
      <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Clicks Over Time</h3>
      <MouseChart metric="clicks" />
    </div>

    <!-- Distance over time -->
    <div class="card p-5">
      <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Travel Over Time</h3>
      <MouseChart metric="inches" />
    </div>
  </div>
{/if}
