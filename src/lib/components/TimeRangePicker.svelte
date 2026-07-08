<script lang="ts">
  import { state } from '../stores.svelte'
  import type { TimePreset } from '../types'

  const presets: { key: TimePreset; label: string }[] = [
    { key: 'hourly', label: 'Hourly' },
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'custom', label: 'Custom' },
  ]
</script>

<div class="card p-4">
  <div class="flex flex-wrap items-center gap-2">
    {#each presets as p}
      <button
        onclick={() => state.setPreset(p.key)}
        class="rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors"
        style={state.preset === p.key
          ? 'background: var(--accent); color: #fff'
          : 'background: var(--surface-2); color: var(--ink-2)'}
      >{p.label}</button>
    {/each}

    <span class="ml-auto text-xs sm:text-sm" style="color: var(--muted)">
      {state.rangeLabel}
      {#if state.range}<span class="opacity-70">· by {state.range.grain}</span>{/if}
    </span>
  </div>

  {#if state.preset === 'custom'}
    <div class="mt-3 flex flex-wrap items-center gap-2 border-t pt-3" style="border-color: var(--border)">
      <input type="date" bind:value={state.customStart}
        class="rounded-lg px-3 py-1.5 text-sm" style="background: var(--surface-2); color: var(--ink); border: 1px solid var(--border)" />
      <span style="color: var(--muted)">→</span>
      <input type="date" bind:value={state.customEnd}
        class="rounded-lg px-3 py-1.5 text-sm" style="background: var(--surface-2); color: var(--ink); border: 1px solid var(--border)" />
      <button onclick={() => state.reload()}
        class="rounded-lg px-4 py-1.5 text-sm font-medium text-white" style="background: var(--accent)">Apply</button>
    </div>
  {/if}
</div>
