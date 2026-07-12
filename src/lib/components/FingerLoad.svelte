<script lang="ts">
  import { state as store } from '../stores.svelte'
  import { fingerLoad, FINGER_ORDER, FINGER_LABEL, FINGER_PROFILES, handOf, type Finger, type FingerProfile } from '../fingers'
  import { sequential } from '../palette'

  // Default to Corne; remember the user's choice.
  const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('fingerProfile')) as FingerProfile | null
  let profile = $state<FingerProfile>(saved ?? 'corne')
  function setProfile(p: FingerProfile) {
    profile = p
    try { localStorage.setItem('fingerProfile', p) } catch { /* ignore */ }
  }

  const mode = $derived(store.theme)
  const load = $derived(fingerLoad(store.stats.keyCounts, profile))

  const typing = $derived(FINGER_ORDER.map((f) => ({ finger: f, count: load[f] })))
  const maxFinger = $derived(Math.max(...typing.map((t) => t.count), 1))
  const typingTotal = $derived(typing.reduce((a, t) => a + t.count, 0))
  const thumbCount = $derived(load.thumb)

  const leftTotal = $derived(FINGER_ORDER.filter((f) => handOf(f) === 'left').reduce((a, f) => a + load[f], 0))
  const rightTotal = $derived(FINGER_ORDER.filter((f) => handOf(f) === 'right').reduce((a, f) => a + load[f], 0))
  const leftPct = $derived(leftTotal + rightTotal > 0 ? (leftTotal / (leftTotal + rightTotal)) * 100 : 50)

  const busiest = $derived(typing.reduce((m, t) => (t.count > m.count ? t : m), typing[0]))
  const idlest = $derived(typing.reduce((m, t) => (t.count < m.count ? t : m), typing[0]))

  function pct(n: number): string {
    return typingTotal > 0 ? `${((n / typingTotal) * 100).toFixed(1)}%` : '0%'
  }
  function label(f: Finger): string { return FINGER_LABEL[f] }
</script>

<div class="card p-5">
  <div class="mb-4 flex items-center justify-between gap-3">
    <div>
      <h3 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">Finger Load</h3>
      <p class="mt-0.5 text-xs" style="color: var(--muted)">presses per finger · bars exclude thumbs</p>
    </div>
    <div class="flex rounded-lg p-0.5 text-xs" style="background: var(--surface-2)">
      {#each FINGER_PROFILES as p}
        <button onclick={() => setProfile(p.id)}
          class="rounded-md px-2.5 py-1 transition"
          style="{profile === p.id ? 'background: var(--accent); color: white' : 'color: var(--ink-2)'}">
          {p.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Per-finger bars -->
  <div class="grid grid-cols-8 gap-2">
    {#each typing as t}
      <div class="flex flex-col items-center gap-1.5">
        <div class="flex h-32 w-full items-end justify-center">
          <div class="w-full rounded-t-md transition-all"
            style="height: {Math.max((t.count / maxFinger) * 100, 2)}%; background: {t.count > 0 ? sequential(Math.sqrt(t.count / maxFinger), mode) : 'var(--surface-2)'}"
            title="{label(t.finger)}: {t.count.toLocaleString()} ({pct(t.count)})"></div>
        </div>
        <span class="text-[10px] font-medium" style="color: var(--ink-2)">{t.finger}</span>
        <span class="text-[10px] tabular-nums" style="color: var(--muted)">{pct(t.count)}</span>
      </div>
    {/each}
  </div>

  <!-- Hand balance -->
  <div class="mt-5">
    <div class="flex h-5 w-full overflow-hidden rounded-md text-[11px] font-semibold text-white">
      <div class="flex items-center justify-start pl-2" style="width: {leftPct}%; background: {sequential(0.7, mode)}">
        {leftPct.toFixed(0)}%
      </div>
      <div class="flex items-center justify-end pr-2" style="width: {100 - leftPct}%; background: #1baf7a">
        {(100 - leftPct).toFixed(0)}%
      </div>
    </div>
    <div class="mt-1 flex justify-between text-xs" style="color: var(--muted)">
      <span>Left hand · {leftTotal.toLocaleString()}</span>
      <span>Right hand · {rightTotal.toLocaleString()}</span>
    </div>
  </div>

  <!-- Callouts -->
  <div class="mt-4 grid grid-cols-3 gap-3">
    <div class="rounded-lg p-3" style="background: var(--surface-2)">
      <p class="text-xs" style="color: var(--muted)">Hardest-working</p>
      <p class="mt-0.5 text-sm font-semibold" style="color: var(--ink)">{label(busiest.finger)} · {pct(busiest.count)}</p>
    </div>
    <div class="rounded-lg p-3" style="background: var(--surface-2)">
      <p class="text-xs" style="color: var(--muted)">Most idle</p>
      <p class="mt-0.5 text-sm font-semibold" style="color: var(--ink)">{label(idlest.finger)} · {pct(idlest.count)}</p>
    </div>
    <div class="rounded-lg p-3" style="background: var(--surface-2)">
      <p class="text-xs" style="color: var(--muted)">Thumbs</p>
      <p class="mt-0.5 text-sm font-semibold" style="color: var(--ink)">{thumbCount.toLocaleString()}</p>
    </div>
  </div>
  {#if profile === 'corne'}
    <p class="mt-3 text-xs" style="color: var(--muted)">
      Corne profile: Space/Enter/Ctrl/Meta on thumbs · Backspace &amp; Shift on right index · Tab &amp; Alt on left index.
    </p>
  {/if}
</div>
