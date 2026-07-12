<script lang="ts">
  import { onMount } from 'svelte'
  import { state as store } from '../stores.svelte'
  import { loadAllTime, deriveRecords, weekOverWeek, type DailyMap, type AllTimeRecords } from '../alltime'
  import { sequential } from '../palette'

  let daily = $state<DailyMap | null>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)

  onMount(async () => {
    const m = store.manifest
    if (!m) { error = 'No data.'; loading = false; return }
    try {
      daily = await loadAllTime(m)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load history.'
    } finally {
      loading = false
    }
  })

  const rec = $derived<AllTimeRecords | null>(daily ? deriveRecords(daily) : null)
  const wow = $derived(daily ? weekOverWeek(daily) : null)
  const mode = $derived(store.theme)

  // Last 90 active days for the trend line.
  const series = $derived(rec ? rec.daily.slice(-90) : [])
  const maxDay = $derived(Math.max(...series.map((d) => d.count), 1))

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  function pretty(date: string): string {
    const [y, m, d] = date.split('-').map(Number)
    return `${MONTHS[m - 1]} ${d}, ${y}`
  }
</script>

{#if loading}
  <div class="card flex items-center justify-center py-24">
    <div class="h-7 w-7 animate-spin rounded-full border-4" style="border-color: var(--accent); border-top-color: transparent"></div>
  </div>
{:else if error}
  <div class="card p-10 text-center"><p style="color: var(--muted)">{error}</p></div>
{:else if rec && wow}
  <div class="space-y-4">
    <!-- Stat tiles -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="card p-4">
        <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--muted)">Current streak</p>
        <p class="mt-1 text-3xl font-bold" style="color: var(--ink)">{rec.streaks.current}<span class="text-lg font-medium" style="color: var(--muted)"> d</span></p>
      </div>
      <div class="card p-4">
        <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--muted)">Longest streak</p>
        <p class="mt-1 text-3xl font-bold" style="color: var(--ink)">{rec.streaks.longest}<span class="text-lg font-medium" style="color: var(--muted)"> d</span></p>
      </div>
      <div class="card p-4">
        <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--muted)">Daily average</p>
        <p class="mt-1 text-3xl font-bold" style="color: var(--ink)">{rec.dailyAverage.toLocaleString()}</p>
        <p class="mt-0.5 text-xs" style="color: var(--ink-2)">over {rec.activeDays} active days</p>
      </div>
      <div class="card p-4">
        <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--muted)">Week over week</p>
        <p class="mt-1 text-3xl font-bold" style="color: {wow.deltaPct >= 0 ? '#1baf7a' : '#e34948'}">
          {wow.deltaPct >= 0 ? '+' : ''}{wow.deltaPct.toFixed(0)}%
        </p>
        <p class="mt-0.5 text-xs" style="color: var(--ink-2)">{wow.thisWeek.toLocaleString()} vs {wow.lastWeek.toLocaleString()}</p>
      </div>
    </div>

    <!-- Daily trend line -->
    <div class="card p-5">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Daily Keystrokes</h3>
        <span class="text-xs" style="color: var(--muted)">last {series.length} active days</span>
      </div>
      {#if series.length === 0}
        <p class="py-8 text-center text-sm" style="color: var(--muted)">Not enough history yet.</p>
      {:else}
        <div class="flex h-40 items-end gap-[2px]">
          {#each series as d}
            <div class="flex-1 rounded-sm transition-all"
              style="height: {Math.max((d.count / maxDay) * 100, 1)}%; background: {sequential(Math.sqrt(d.count / maxDay), mode)}"
              title="{pretty(d.date)}: {d.count.toLocaleString()}"></div>
          {/each}
        </div>
        <div class="mt-1 flex justify-between text-[10px]" style="color: var(--muted)">
          <span>{pretty(series[0].date)}</span>
          <span>{pretty(series[series.length - 1].date)}</span>
        </div>
      {/if}
    </div>
  </div>
{/if}
