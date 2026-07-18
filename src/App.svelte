<script lang="ts">
  import { onMount } from 'svelte'
  import { state as store } from './lib/stores.svelte'
  import StatsBar from './lib/components/StatsBar.svelte'
  import TimeRangePicker from './lib/components/TimeRangePicker.svelte'
  import MachineFilter from './lib/components/MachineFilter.svelte'
  import Keyboard from './lib/components/Keyboard.svelte'
  import DeviceBreakdown from './lib/components/DeviceBreakdown.svelte'
  import TopKeys from './lib/components/TopKeys.svelte'
  import ActivityChart from './lib/components/ActivityChart.svelte'
  import MouseStrip from './lib/components/MouseStrip.svelte'
  import Mouse from './lib/components/Mouse.svelte'
  import Insights from './lib/components/Insights.svelte'
  import FingerLoad from './lib/components/FingerLoad.svelte'
  import LayoutOptimizer from './lib/components/LayoutOptimizer.svelte'
  import Trends from './lib/components/Trends.svelte'
  import Records from './lib/components/Records.svelte'

  type Tab = 'overview' | 'mouse' | 'fingers' | 'trends' | 'records'
  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'mouse', label: 'Mouse' },
    { id: 'fingers', label: 'Fingers & Layout' },
    { id: 'trends', label: 'Trends' },
    { id: 'records', label: 'Records' },
  ]
  let tab = $state<Tab>('overview')
  // Tabs that read the selected date-range + machine filter.
  const rangeScoped = $derived(tab === 'overview' || tab === 'mouse' || tab === 'fingers')
  // Show the compact mouse strip on Overview only where there's a per-day series.
  const showMouseStrip = $derived(store.range?.grain !== 'hour' && store.stats.hasMouseData)

  onMount(() => store.init())
</script>

<div class="min-h-screen" style="background: var(--page)">
  <header class="sticky top-0 z-20 border-b backdrop-blur"
    style="border-color: var(--border); background: color-mix(in srgb, var(--page) 85%, transparent)">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
      <div>
        <h1 class="text-lg font-bold" style="color: var(--ink)">Keystroke Analytics</h1>
        <p class="text-xs" style="color: var(--muted)">{store.rangeLabel || 'Typing dashboard'}</p>
      </div>
      <button onclick={() => store.toggleTheme()} aria-label="Toggle theme"
        class="rounded-lg px-2.5 py-2 text-sm transition"
        style="background: var(--surface-2); color: var(--ink-2)">
        {store.theme === 'dark' ? '☀' : '☾'}
      </button>
    </div>
  </header>

  <main class="mx-auto max-w-6xl space-y-4 px-4 py-5 sm:px-6">
    {#if store.error}
      <div class="card p-10 text-center">
        <p class="text-lg font-medium" style="color: var(--ink)">Couldn’t load data</p>
        <p class="mt-1 text-sm" style="color: var(--muted)">{store.error}</p>
      </div>
    {:else if store.loading && !store.hasData}
      <div class="flex items-center justify-center py-32">
        <div class="h-8 w-8 animate-spin rounded-full border-4"
          style="border-color: var(--accent); border-top-color: transparent"></div>
      </div>
    {:else}
      <!-- Tab bar -->
      <nav class="flex gap-1 overflow-x-auto rounded-xl p-1" style="background: var(--surface-2)">
        {#each TABS as t}
          <button onclick={() => (tab = t.id)}
            class="shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition"
            style="{tab === t.id ? 'background: var(--surface); color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.08)' : 'color: var(--ink-2)'}">
            {t.label}
          </button>
        {/each}
      </nav>

      <!-- Range/machine filters only apply to range-scoped tabs -->
      {#if rangeScoped}
        <TimeRangePicker />
        <MachineFilter />
      {/if}

      {#if rangeScoped && !store.hasData}
        <div class="card p-16 text-center">
          <p class="text-lg font-medium" style="color: var(--ink)">No data in this range</p>
          <p class="mt-1 text-sm" style="color: var(--muted)">Try a wider range or a different preset.</p>
        </div>
      {:else}
        <div class="relative">
          {#if store.loading}
            <div class="absolute right-0 -top-1 h-4 w-4 animate-spin rounded-full border-2"
              style="border-color: var(--accent); border-top-color: transparent"></div>
          {/if}
          <div class="space-y-4">
            {#if tab === 'overview'}
              <StatsBar />
              <Keyboard />
              <ActivityChart />
              {#if showMouseStrip}
                <MouseStrip />
              {/if}
              <DeviceBreakdown />
              <TopKeys />
              <Insights />
            {:else if tab === 'mouse'}
              <Mouse />
            {:else if tab === 'fingers'}
              <FingerLoad />
              <LayoutOptimizer />
            {:else if tab === 'trends'}
              <Trends />
            {:else if tab === 'records'}
              <Records />
            {/if}
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
