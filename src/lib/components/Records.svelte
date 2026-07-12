<script lang="ts">
  import { onMount } from 'svelte'
  import { state as store } from '../stores.svelte'
  import { loadAllTime, deriveRecords, type DailyMap, type AllTimeRecords } from '../alltime'
  import { keyLabel } from '../keymap'

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

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  function pretty(date: string): string {
    const [y, m, d] = date.split('-').map(Number)
    return `${MONTHS[m - 1]} ${d}, ${y}`
  }
  function hourLabel(h: number | null): string {
    if (h === null) return '—'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}${h < 12 ? 'am' : 'pm'}`
  }

  // Milestone ladder — the largest crossed, and progress to the next.
  const MILESTONES = [1e4, 5e4, 1e5, 5e5, 1e6, 5e6, 1e7, 5e7, 1e8]
  const crossed = $derived(rec ? MILESTONES.filter((m) => rec.totalPresses >= m) : [])
  const lastMilestone = $derived(crossed.length ? crossed[crossed.length - 1] : 0)
  const nextMilestone = $derived(MILESTONES.find((m) => rec && rec.totalPresses < m) ?? null)
  const milestoneProgress = $derived(
    rec && nextMilestone
      ? ((rec.totalPresses - lastMilestone) / (nextMilestone - lastMilestone)) * 100
      : 100,
  )
  function compact(n: number): string {
    if (n >= 1e6) return `${(n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1)}M`
    if (n >= 1e3) return `${(n / 1e3).toFixed(n % 1e3 === 0 ? 0 : 1)}k`
    return `${n}`
  }

  const cards = $derived(rec ? [
    { label: 'All-time presses', value: rec.totalPresses.toLocaleString(), sub: `${rec.activeDays} active days` },
    { label: 'Busiest day', value: rec.busiestDay ? rec.busiestDay.count.toLocaleString() : '—', sub: rec.busiestDay ? pretty(rec.busiestDay.date) : '' },
    { label: 'Most active hour', value: hourLabel(rec.peakHour), sub: 'all-time, hour of day' },
    { label: 'Longest streak', value: `${rec.streaks.longest} d`, sub: 'consecutive active days' },
    { label: 'Single-key record', value: rec.recordKeyDay ? rec.recordKeyDay.count.toLocaleString() : '—', sub: rec.recordKeyDay ? `${keyLabel(rec.recordKeyDay.code)} · ${pretty(rec.recordKeyDay.date)}` : '' },
    { label: 'Cleanest day', value: rec.bestCorrectionDay ? `${rec.bestCorrectionDay.rate.toFixed(1)}%` : '—', sub: rec.bestCorrectionDay ? `corrections · ${pretty(rec.bestCorrectionDay.date)}` : 'needs 500+ day' },
  ] : [])
</script>

{#if loading}
  <div class="card flex items-center justify-center py-24">
    <div class="h-7 w-7 animate-spin rounded-full border-4" style="border-color: var(--accent); border-top-color: transparent"></div>
  </div>
{:else if error}
  <div class="card p-10 text-center"><p style="color: var(--muted)">{error}</p></div>
{:else if rec}
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {#each cards as c}
        <div class="card p-4">
          <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--muted)">{c.label}</p>
          <p class="mt-1 text-2xl font-bold" style="color: var(--ink)">{c.value}</p>
          {#if c.sub}<p class="mt-0.5 text-xs" style="color: var(--ink-2)">{c.sub}</p>{/if}
        </div>
      {/each}
    </div>

    <!-- Milestone progress -->
    <div class="card p-5">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Milestones</h3>
        <span class="text-xs" style="color: var(--muted)">
          {#if nextMilestone}{compact(rec.totalPresses)} / {compact(nextMilestone)} presses{:else}all milestones reached 🎉{/if}
        </span>
      </div>
      <div class="h-3 w-full overflow-hidden rounded-full" style="background: var(--surface-2)">
        <div class="h-full rounded-full" style="width: {Math.max(milestoneProgress, 2)}%; background: var(--accent)"></div>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        {#each MILESTONES as m}
          <span class="rounded-full px-2.5 py-1 text-xs font-medium"
            style="{rec.totalPresses >= m
              ? 'background: var(--accent); color: white'
              : 'background: var(--surface-2); color: var(--muted)'}">
            {compact(m)}{rec.totalPresses >= m ? ' ✓' : ''}
          </span>
        {/each}
      </div>
    </div>
  </div>
{/if}
