<script lang="ts">
  import { state } from '../stores.svelte'
  import type { TimePreset } from '../types'

  const presets: { key: TimePreset; label: string }[] = [
    { key: 'hourly', label: 'Hourly' },
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'custom', label: 'Custom' },
  ]
</script>

<div class="flex flex-wrap items-center gap-2">
  {#each presets as p}
    <button
      class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {state.timePreset === p.key ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}"
      onclick={() => { state.timePreset = p.key; state.load() }}
    >
      {p.label}
    </button>
  {/each}

  {#if state.timePreset === 'custom'}
    <div class="flex items-center gap-2 ml-2">
      <input
        type="date"
        bind:value={state.customStart}
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <span class="text-gray-400">→</span>
      <input
        type="date"
        bind:value={state.customEnd}
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        onclick={() => state.load()}
      >
        Apply
      </button>
    </div>
  {/if}
</div>
