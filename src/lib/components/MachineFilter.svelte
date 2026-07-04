<script lang="ts">
  import { state } from '../stores.svelte'
</script>

{#if state.machineNames.length > 1}
  <div class="flex flex-wrap items-center gap-3">
    <span class="text-sm font-medium text-gray-600">Machines:</span>
    <label class="flex items-center gap-1.5 cursor-pointer">
      <input
        type="checkbox"
        checked={state.selectedMachines.size === state.machineNames.length}
        onchange={() => {
          state.selectedMachines =
            state.selectedMachines.size === state.machineNames.length
              ? new Set()
              : new Set(state.machineNames)
        }}
        class="rounded border-gray-300 text-indigo-600"
      />
      <span class="text-sm text-gray-700">All</span>
    </label>
    {#each state.machineNames as name}
      <label class="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={state.selectedMachines.has(name)}
          onchange={() => state.toggleMachine(name)}
          class="rounded border-gray-300 text-indigo-600"
        />
        <span class="text-sm text-gray-700">{name}</span>
      </label>
    {/each}
  </div>
{/if}
