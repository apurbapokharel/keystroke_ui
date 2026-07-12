<script lang="ts">
  import { state as app } from '../stores.svelte'
  import { sequential } from '../palette'
  import { handBalance, type HandPart } from '../fingers'

  const s = $derived(app.stats)
  const mode = $derived(app.theme)

  // Hand-balance parts the user can include/exclude (persisted).
  const HAND_PARTS: { id: HandPart; label: string }[] = [
    { id: 'standard', label: 'Letters/digits/punct' },
    { id: 'backspace', label: 'Backspace' },
    { id: 'thumb', label: 'Thumbs' },
  ]
  const savedParts = (() => {
    try {
      const raw = localStorage.getItem('handParts')
      if (raw) return new Set(JSON.parse(raw) as HandPart[])
    } catch { /* ignore */ }
    return new Set<HandPart>(['standard'])
  })()
  let parts = $state<Set<HandPart>>(savedParts)
  function togglePart(p: HandPart) {
    const next = new Set(parts)
    next.has(p) ? next.delete(p) : next.add(p)
    parts = next
    try { localStorage.setItem('handParts', JSON.stringify([...next])) } catch { /* ignore */ }
  }

  const balance = $derived(handBalance(s.keyCounts, parts))
  const balTotal = $derived(balance.left + balance.right)
  const leftPct = $derived(balTotal > 0 ? (balance.left / balTotal) * 100 : 50)

  const catLabels: Record<string, string> = {
    letters: 'Letters', digits: 'Digits', whitespace: 'Space / Tab / Enter',
    punctuation: 'Punctuation', modifiers: 'Modifiers', navigation: 'Navigation',
    function: 'Function keys', editing: 'Backspace / Delete', other: 'Other',
  }
  const maxCat = $derived(Math.max(...s.categories.map((c) => c.count), 1))
  const maxHour = $derived(Math.max(...s.hourly, 1))

  function hourTip(h: number): string {
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}${h < 12 ? 'am' : 'pm'}: ${s.hourly[h].toLocaleString()}`
  }
</script>

<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
  <!-- Category composition -->
  <div class="card p-5">
    <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Key Categories</h3>
    <div class="space-y-2">
      {#each s.categories as c}
        <div class="flex items-center gap-3">
          <span class="w-32 shrink-0 truncate text-sm" style="color: var(--ink)">{catLabels[c.name] ?? c.name}</span>
          <div class="h-4 flex-1 overflow-hidden rounded-md" style="background: var(--surface-2)">
            <div class="h-full rounded-md" style="width: {Math.max((c.count / maxCat) * 100, 2)}%; background: var(--accent)"></div>
          </div>
          <span class="w-16 text-right text-sm tabular-nums" style="color: var(--ink-2)">{c.count.toLocaleString()}</span>
          <span class="w-12 text-right text-xs tabular-nums" style="color: var(--muted)">
            {s.totalPresses > 0 ? ((c.count / s.totalPresses) * 100).toFixed(0) : 0}%
          </span>
        </div>
      {/each}
    </div>
  </div>

  <div class="space-y-4">
    <!-- Hand balance -->
    <div class="card p-5">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Hand Balance</h3>
        <div class="flex flex-wrap gap-1.5">
          {#each HAND_PARTS as p}
            {@const on = parts.has(p.id)}
            <button onclick={() => togglePart(p.id)}
              class="rounded-full px-2.5 py-0.5 text-[11px] font-medium transition"
              style="background: var(--surface-2); color: {on ? 'var(--ink)' : 'var(--muted)'}; opacity: {on ? 1 : 0.55}; border: 1px solid var(--border)">
              {p.label}
            </button>
          {/each}
        </div>
      </div>
      {#if balTotal === 0}
        <p class="py-3 text-center text-xs" style="color: var(--muted)">No presses for the selected parts.</p>
      {:else}
        <div class="flex h-6 w-full overflow-hidden rounded-md">
          <div class="flex items-center justify-start pl-2 text-xs font-semibold text-white"
            style="width: {leftPct}%; background: {sequential(0.7, mode)}">
            {leftPct.toFixed(0)}%
          </div>
          <div class="flex items-center justify-end pr-2 text-xs font-semibold text-white"
            style="width: {100 - leftPct}%; background: #1baf7a">
            {(100 - leftPct).toFixed(0)}%
          </div>
        </div>
        <div class="mt-1.5 flex justify-between text-xs" style="color: var(--muted)">
          <span>Left · {balance.left.toLocaleString()}</span>
          <span>Right · {balance.right.toLocaleString()}</span>
        </div>
      {/if}
    </div>

    <!-- Activity by hour of day -->
    <div class="card p-5">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Activity by Hour</h3>
        <span class="text-xs" style="color: var(--muted)">
          peak {s.peakHour === null ? '—' : `${s.peakHour % 12 === 0 ? 12 : s.peakHour % 12}${s.peakHour < 12 ? 'am' : 'pm'}`}
        </span>
      </div>
      <div class="flex h-24 items-end gap-[3px]">
        {#each s.hourly as count, h}
          <div class="flex-1 rounded-sm transition-all"
            style="height: {Math.max((count / maxHour) * 100, 3)}%; background: {count > 0 ? sequential(Math.sqrt(count / maxHour), mode) : 'var(--surface-2)'}"
            title={hourTip(h)}></div>
        {/each}
      </div>
      <div class="mt-1 flex justify-between text-[10px]" style="color: var(--muted)">
        <span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span>
      </div>
    </div>
  </div>
</div>
