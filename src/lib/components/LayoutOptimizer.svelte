<script lang="ts">
  import { state as store } from '../stores.svelte'
  import { scoreLayouts, FINGER_ORDER, type EffortModel, type LayoutName } from '../fingers'

  // Corne is columnar, so default to that effort model.
  let model = $state<EffortModel>('columnar')

  const scores = $derived(scoreLayouts(store.stats.keyCounts, model))
  // Rank by effort (lower = better).
  const ranked = $derived([...scores].sort((a, b) => a.effort - b.effort))
  const current = $derived(scores.find((s) => s.name === 'QWERTY')!)
  const best = $derived(ranked[0])
  const hasData = $derived(current.total > 0)

  function homeDelta(name: LayoutName): number {
    const s = scores.find((x) => x.name === name)!
    return s.homeRowPercent - current.homeRowPercent
  }
  function effortDelta(name: LayoutName): number {
    const s = scores.find((x) => x.name === name)!
    return current.effort > 0 ? ((s.effort - current.effort) / current.effort) * 100 : 0
  }
  function fmtSign(n: number, digits = 1): string {
    return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}`
  }
  // Simple imbalance measure: max single-finger share (lower = better balanced).
  function maxFingerShare(perFinger: Record<string, number>, total: number): number {
    if (total <= 0) return 0
    const max = Math.max(...FINGER_ORDER.map((f) => perFinger[f] || 0))
    return (max / total) * 100
  }
</script>

<div class="card p-5">
  <div class="mb-4 flex items-center justify-between gap-3">
    <div>
      <h3 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Layout Optimizer</h3>
      <p class="mt-0.5 text-xs" style="color: var(--muted)">your letter frequencies, re-placed on each layout</p>
    </div>
    <div class="flex rounded-lg p-0.5 text-xs" style="background: var(--surface-2)">
      {#each ['columnar', 'staggered'] as m}
        <button onclick={() => (model = m as EffortModel)}
          class="rounded-md px-2.5 py-1 capitalize transition"
          style="{model === m ? 'background: var(--accent); color: white' : 'color: var(--ink-2)'}">
          {m}
        </button>
      {/each}
    </div>
  </div>

  {#if !hasData}
    <p class="py-8 text-center text-sm" style="color: var(--muted)">No letter presses in this range.</p>
  {:else}
    <!-- Verdict -->
    <div class="mb-4 rounded-lg p-3" style="background: var(--surface-2)">
      {#if best.name === 'QWERTY'}
        <p class="text-sm" style="color: var(--ink)">
          QWERTY already scores best for your typing under the <b>{model}</b> model. No change worth it.
        </p>
      {:else}
        <p class="text-sm" style="color: var(--ink)">
          Switching to <b>{best.name}</b> → home row
          <b>{current.homeRowPercent.toFixed(0)}% → {best.homeRowPercent.toFixed(0)}%</b>,
          effort <b>{fmtSign(effortDelta(best.name), 0)}%</b> ({model} model).
        </p>
      {/if}
    </div>

    <!-- Comparison table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-wide" style="color: var(--muted)">
            <th class="py-1.5 pr-3 font-medium">Layout</th>
            <th class="py-1.5 pr-3 text-right font-medium">Home row</th>
            <th class="py-1.5 pr-3 text-right font-medium">vs now</th>
            <th class="py-1.5 pr-3 text-right font-medium">Effort</th>
            <th class="py-1.5 pr-3 text-right font-medium">vs now</th>
            <th class="py-1.5 text-right font-medium">Max finger</th>
          </tr>
        </thead>
        <tbody>
          {#each ranked as s, i}
            <tr style="border-top: 1px solid var(--border)">
              <td class="py-2 pr-3">
                <span class="font-semibold" style="color: var(--ink)">{s.name}</span>
                {#if i === 0}<span class="ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white" style="background: var(--accent)">BEST</span>{/if}
                {#if s.name === 'QWERTY'}<span class="ml-1.5 text-[10px]" style="color: var(--muted)">current</span>{/if}
              </td>
              <td class="py-2 pr-3 text-right tabular-nums" style="color: var(--ink)">{s.homeRowPercent.toFixed(0)}%</td>
              <td class="py-2 pr-3 text-right tabular-nums" style="color: {homeDelta(s.name) > 0 ? '#1baf7a' : homeDelta(s.name) < 0 ? '#e34948' : 'var(--muted)'}">
                {s.name === 'QWERTY' ? '—' : `${fmtSign(homeDelta(s.name), 0)}pt`}
              </td>
              <td class="py-2 pr-3 text-right tabular-nums" style="color: var(--ink-2)">{s.effort.toFixed(3)}</td>
              <td class="py-2 pr-3 text-right tabular-nums" style="color: {effortDelta(s.name) < 0 ? '#1baf7a' : effortDelta(s.name) > 0 ? '#e34948' : 'var(--muted)'}">
                {s.name === 'QWERTY' ? '—' : `${fmtSign(effortDelta(s.name), 0)}%`}
              </td>
              <td class="py-2 text-right tabular-nums" style="color: var(--ink-2)">{maxFingerShare(s.perFinger, s.total).toFixed(0)}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="mt-3 text-xs" style="color: var(--muted)">
      Effort = average reach cost per letter (row × finger-strength weight); lower is better.
      Assumes your counts are typed on a QWERTY OS layout.
    </p>
  {/if}
</div>
