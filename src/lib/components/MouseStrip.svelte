<script lang="ts">
  import { state } from '../stores.svelte'
  import { formatDistance } from '../format'
  import MouseChart from './MouseChart.svelte'

  const s = $derived(state.stats)
  const totalClicks = $derived(s.mouse.leftClick + s.mouse.rightClick + s.mouse.middleClick)
</script>

<div class="card p-5">
  <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
    <h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Mouse</h2>
    <div class="flex gap-4 text-xs" style="color: var(--muted)">
      <span><span class="font-semibold" style="color: var(--ink)">{formatDistance(s.mouse.inches)}</span> traveled</span>
      <span><span class="font-semibold" style="color: var(--ink)">{totalClicks.toLocaleString()}</span> clicks</span>
      <span><span class="font-semibold" style="color: var(--ink)">{s.mouse.scrolls.toLocaleString()}</span> scrolls</span>
    </div>
  </div>
  <MouseChart metric="both" />
</div>
