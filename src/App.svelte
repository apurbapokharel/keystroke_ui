<script lang="ts">
  import { onMount } from 'svelte'
  import { state } from './lib/stores.svelte'
  import StatsBar from './lib/components/StatsBar.svelte'
  import TimeRangePicker from './lib/components/TimeRangePicker.svelte'
  import MachineFilter from './lib/components/MachineFilter.svelte'
  import Keyboard from './lib/components/Keyboard.svelte'
  import TopKeys from './lib/components/TopKeys.svelte'
  import TimeChart from './lib/components/TimeChart.svelte'

  onMount(() => state.load())
</script>

<div class="min-h-screen bg-gray-50">
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <h1 class="text-xl font-bold text-gray-900">Keystroke Tracker</h1>
      <p class="text-sm text-gray-500">Typing analytics dashboard</p>
    </div>
  </header>

  <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
    {#if state.loading}
      <div class="flex items-center justify-center py-24">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    {:else if state.files.length === 0}
      <div class="rounded-xl bg-white py-24 text-center shadow-sm border border-gray-100">
        <p class="text-lg font-medium text-gray-500">No data found for the selected range.</p>
        <p class="mt-1 text-sm text-gray-400">Try a different time range or check the data repository.</p>
      </div>
    {:else}
      <StatsBar />
      <TimeRangePicker />
      <MachineFilter />
      <Keyboard />
      <div class="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Keystrokes over time</h2>
        <TimeChart />
      </div>
      <TopKeys />
    {/if}
  </main>
</div>
