<script lang="ts">
  import { state } from '../stores.svelte'

  const s = $derived(state.stats)
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div class="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
    <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Total Presses</p>
    <p class="mt-1 text-3xl font-bold text-gray-900 tabular-nums">{s.totalPresses.toLocaleString()}</p>
  </div>

  <div class="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
    <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Most Used</p>
    <p class="mt-1 text-3xl font-bold text-gray-900">
      {#if s.mostUsed}
        {s.mostUsed.label}
        <span class="text-sm font-normal text-gray-500">({s.mostUsed.percentage.toFixed(1)}%)</span>
      {:else}—{/if}
    </p>
  </div>

  <div class="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
    <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Least Used</p>
    <p class="mt-1 text-3xl font-bold text-gray-900">
      {#if s.leastUsed}
        {s.leastUsed.label}
        <span class="text-sm font-normal text-gray-500">({s.leastUsed.count})</span>
      {:else}—{/if}
    </p>
  </div>

  <div class="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
    <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Home Row</p>
    <p class="mt-1 text-3xl font-bold text-gray-900 tabular-nums">{s.homeRowPercent.toFixed(1)}%</p>
  </div>
</div>
