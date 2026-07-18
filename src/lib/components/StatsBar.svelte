<script lang="ts">
  import { state } from '../stores.svelte'
  import { formatDuration } from '../format'

  const s = $derived(state.stats)

  function hourLabel(h: number | null): string {
    if (h === null) return '—'
    const am = h < 12
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}${am ? 'am' : 'pm'}`
  }

  const cards = $derived([
    { label: 'Total Presses', value: s.totalPresses.toLocaleString(), sub: `${s.activeDays} active day${s.activeDays === 1 ? '' : 's'}` },
    // Active-time cards only appear once there's screen-time data (v2+).
    ...(s.hasActiveData
      ? [
          { label: 'Active Time', value: formatDuration(s.totalActiveSeconds), sub: 'screen awake & unlocked' },
          {
            label: 'Keys / Min',
            value: s.totalActiveSeconds > 0 ? Math.round(s.totalPresses / (s.totalActiveSeconds / 60)).toLocaleString() : '—',
            sub: 'presses per active min',
          },
        ]
      : []),
    { label: 'Most Used', value: s.mostUsed?.label ?? '—', sub: s.mostUsed ? `${s.mostUsed.percentage.toFixed(1)}% of all` : '' },
    { label: 'Least Used', value: s.leastUsed?.label ?? '—', sub: s.leastUsed ? `${s.leastUsed.count.toLocaleString()} presses` : 'letters only' },
    { label: 'Est. Words', value: s.estWords.toLocaleString(), sub: 'letters ÷ 5' },
    { label: 'Peak Hour', value: hourLabel(s.peakHour), sub: 'busiest time of day' },
    { label: 'Correction Rate', value: `${s.correctionRate.toFixed(1)}%`, sub: 'backspace + delete' },
    { label: 'Home Row', value: `${s.homeRowPercent.toFixed(0)}%`, sub: 'of letter presses' },
    { label: 'Unique Keys', value: s.uniqueKeys.toLocaleString(), sub: 'distinct keys used' },
  ])
</script>

<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
  {#each cards as c}
    <div class="card p-4">
      <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--muted)">{c.label}</p>
      <p class="mt-1 text-3xl font-bold" style="color: var(--ink)">{c.value}</p>
      {#if c.sub}<p class="mt-0.5 text-xs" style="color: var(--ink-2)">{c.sub}</p>{/if}
    </div>
  {/each}
</div>
