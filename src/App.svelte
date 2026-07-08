<script lang="ts">
  import { onMount } from 'svelte'
  import { state } from './lib/stores.svelte'
  import StatsBar from './lib/components/StatsBar.svelte'
  import TimeRangePicker from './lib/components/TimeRangePicker.svelte'
  import MachineFilter from './lib/components/MachineFilter.svelte'
  import Keyboard from './lib/components/Keyboard.svelte'
  import DeviceBreakdown from './lib/components/DeviceBreakdown.svelte'
  import TopKeys from './lib/components/TopKeys.svelte'
  import TimeChart from './lib/components/TimeChart.svelte'
  import Insights from './lib/components/Insights.svelte'

  onMount(() => state.init())
</script>

<div class="min-h-screen" style="background: var(--page)">
  <header class="sticky top-0 z-20 border-b backdrop-blur"
    style="border-color: var(--border); background: color-mix(in srgb, var(--page) 85%, transparent)">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
      <div>
        <h1 class="text-lg font-bold" style="color: var(--ink)">Keystroke Analytics</h1>
        <p class="text-xs" style="color: var(--muted)">{state.rangeLabel || 'Typing dashboard'}</p>
      </div>
      <button onclick={() => state.toggleTheme()} aria-label="Toggle theme"
        class="rounded-lg px-2.5 py-2 text-sm transition"
        style="background: var(--surface-2); color: var(--ink-2)">
        {state.theme === 'dark' ? '☀' : '☾'}
      </button>
    </div>
  </header>

  <main class="mx-auto max-w-6xl space-y-4 px-4 py-5 sm:px-6">
    {#if state.error}
      <div class="card p-10 text-center">
        <p class="text-lg font-medium" style="color: var(--ink)">Couldn’t load data</p>
        <p class="mt-1 text-sm" style="color: var(--muted)">{state.error}</p>
      </div>
    {:else if state.loading && !state.hasData}
      <div class="flex items-center justify-center py-32">
        <div class="h-8 w-8 animate-spin rounded-full border-4"
          style="border-color: var(--accent); border-top-color: transparent"></div>
      </div>
    {:else}
      <TimeRangePicker />
      <MachineFilter />

      {#if !state.hasData}
        <div class="card p-16 text-center">
          <p class="text-lg font-medium" style="color: var(--ink)">No data in this range</p>
          <p class="mt-1 text-sm" style="color: var(--muted)">Try a wider range or a different preset.</p>
        </div>
      {:else}
        <div class="relative">
          {#if state.loading}
            <div class="absolute right-0 -top-1 h-4 w-4 animate-spin rounded-full border-2"
              style="border-color: var(--accent); border-top-color: transparent"></div>
          {/if}
          <div class="space-y-4">
            <StatsBar />
            <Keyboard />
            <div class="card p-5">
              <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">
                Keystrokes Over Time
              </h2>
              <TimeChart />
            </div>
            <DeviceBreakdown />
            <TopKeys />
            <Insights />
          </div>
        </div>
      {/if}
    {/if}

    <footer class="pt-2 text-center text-xs" style="color: var(--muted)">
      Data from
      <a class="underline" href="https://github.com/apurbapokharel/keystroke_data" target="_blank" rel="noreferrer">keystroke_data</a>
    </footer>
  </main>
</div>
