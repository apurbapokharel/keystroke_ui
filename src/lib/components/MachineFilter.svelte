<script lang="ts">
  import { state } from '../stores.svelte'

  const names = $derived(state.machineNames)
  const allOn = $derived(state.selectedMachines.size === names.length)
</script>

{#if names.length > 1}
  <div class="flex flex-wrap items-center gap-2">
    <span class="text-xs font-medium uppercase tracking-wide" style="color: var(--muted)">Devices</span>

    <button onclick={() => state.selectAllMachines()}
      class="rounded-full px-3 py-1 text-sm font-medium transition"
      style={allOn ? 'background: var(--ink); color: var(--surface)' : 'background: var(--surface-2); color: var(--ink-2)'}
    >All</button>

    {#each names as name}
      {@const on = state.selectedMachines.has(name)}
      <button onclick={() => state.toggleMachine(name)}
        class="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition"
        style="background: var(--surface-2); color: {on ? 'var(--ink)' : 'var(--muted)'}; opacity: {on ? 1 : 0.55}; border: 1px solid var(--border)"
      >
        <span class="h-2.5 w-2.5 rounded-full" style="background: {state.colorFor(name)}"></span>
        {name}
      </button>
    {/each}
  </div>
{/if}
