<script lang="ts">
  import { state } from '../stores.svelte'
  import type { KeyStat } from '../types'

  const s = $derived(state.stats)
  const maxTop = $derived(s.topKeys[0]?.count || 1)
  const maxBottom = $derived(Math.max(...s.bottomKeys.map((k) => k.count), 1))
</script>

<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
  {#snippet list(title: string, keys: KeyStat[], max: number, fill: string, showPct: boolean)}
    <div class="card p-5">
      <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">{title}</h3>
      <div class="space-y-1.5">
        {#each keys as k, i}
          <div class="flex items-center gap-3">
            <span class="w-4 text-right text-xs tabular-nums" style="color: var(--muted)">{i + 1}</span>
            <span class="w-12 truncate text-sm font-semibold" style="color: var(--ink)">{k.label}</span>
            <div class="h-4 flex-1 overflow-hidden rounded-md" style="background: var(--surface-2)">
              <div class="h-full rounded-md transition-all duration-300"
                style="width: {Math.max((k.count / max) * 100, 2)}%; background: {fill}"></div>
            </div>
            <span class="w-16 text-right text-sm tabular-nums" style="color: var(--ink-2)">{k.count.toLocaleString()}</span>
            {#if showPct}
              <span class="w-12 text-right text-xs tabular-nums" style="color: var(--muted)">{k.percentage.toFixed(1)}%</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/snippet}

  {@render list(`Top ${s.topKeys.length} Keys`, s.topKeys, maxTop, 'var(--accent)', true)}
  {@render list('Least Used Letters', s.bottomKeys, maxBottom, 'var(--axis)', false)}
</div>
