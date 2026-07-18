<script lang="ts">
  import { onMount } from 'svelte'
  import { state as app } from '../stores.svelte'
  import { formatDuration } from '../format'
  import { Chart, registerables, type ChartConfiguration, type ChartDataset } from 'chart.js'

  Chart.register(...registerables)

  type Mode = 'keys' | 'active' | 'both'
  let mode = $state<Mode>('keys')

  const MODES: { id: Mode; label: string }[] = [
    { id: 'keys', label: 'Keystrokes' },
    { id: 'active', label: 'Active time' },
    { id: 'both', label: 'Both' },
  ]

  let canvas: HTMLCanvasElement
  let chart: Chart | null = null

  function themeColors(dark: boolean) {
    return {
      grid: dark ? '#2c2c2a' : '#e1e0d9',
      tick: '#898781',
      surface: dark ? '#1a1a19' : '#fcfcfb',
      ink: dark ? '#ffffff' : '#0b0b0b',
      active: '#1baf7a', // green line/bar for active time
    }
  }

  $effect(() => {
    const s = app.stats
    const hosts = app.machineNames
    const dark = app.theme === 'dark'
    const c = themeColors(dark)
    // If there's no active-time data in range, fall back to keystrokes only.
    const m: Mode = s.hasActiveData ? mode : 'keys'
    if (!canvas) return

    const labels = s.timeSeries.map((b) => b.label)
    const activeSecs = s.timeSeries.map((b) => b.activeSeconds)
    // Minutes at hour grain, hours at day+ grain — keeps the axis readable.
    const grain = app.range?.grain ?? 'hour'
    const inHours = grain !== 'hour'
    const activeDisplay = activeSecs.map((sec) => (inHours ? sec / 3600 : sec / 60))
    const activeUnit = inHours ? 'h' : 'min'

    const keyBars: ChartDataset[] = hosts.map((host) => ({
      type: 'bar',
      label: host,
      data: s.timeSeries.map((b) => b.byHost[host] || 0),
      backgroundColor: app.colorFor(host),
      borderColor: c.surface,
      borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
      borderRadius: 3,
      borderSkipped: false as const,
      stack: 'presses',
      maxBarThickness: 46,
      yAxisID: 'y',
    }))

    const activeBar: ChartDataset = {
      type: 'bar',
      label: 'Active time',
      data: activeDisplay,
      backgroundColor: c.active,
      borderColor: c.surface,
      borderRadius: 3,
      borderSkipped: false as const,
      maxBarThickness: 46,
      yAxisID: 'y',
    }

    const activeLine: ChartDataset = {
      type: 'line',
      label: 'Active time',
      data: activeDisplay,
      borderColor: c.active,
      backgroundColor: c.active,
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 4,
      tension: 0.3,
      yAxisID: 'y1',
    }

    let datasets: ChartDataset[]
    if (m === 'keys') datasets = keyBars
    else if (m === 'active') datasets = [activeBar]
    else datasets = [...keyBars, activeLine]

    const showRightAxis = m === 'both'
    const leftIsActive = m === 'active'

    chart?.destroy()
    // Base type 'bar'; the active-time dataset overrides to 'line' per-dataset.
    const config: ChartConfiguration = {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: m === 'both' || hosts.length > 1,
            position: 'top', align: 'end',
            labels: { color: c.ink, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle' },
          },
          tooltip: {
            backgroundColor: c.ink, titleColor: c.surface, bodyColor: c.surface,
            callbacks: {
              label: (item) => {
                const isActive = item.dataset.label === 'Active time'
                if (isActive) return `Active: ${formatDuration(activeSecs[item.dataIndex])}`
                return `${item.dataset.label}: ${(item.raw as number).toLocaleString()}`
              },
              footer: (items) => {
                // Sum only the keystroke (bar, left-axis) datasets.
                const keyItems = items.filter((i) => i.dataset.label !== 'Active time')
                if (keyItems.length === 0) return ''
                return 'Keys: ' + keyItems.reduce((a, i) => a + (i.raw as number), 0).toLocaleString()
              },
            },
          },
        },
        scales: {
          // Stacking is per-scale; the active line lives on y1, so stacking y/x
          // only affects the per-host keystroke bars (which should always stack).
          x: { stacked: true, grid: { display: false }, ticks: { color: c.tick, maxRotation: 0, autoSkipPadding: 12 }, border: { color: c.grid } },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: c.grid },
            ticks: {
              color: c.tick, precision: 0,
              callback: (v) => (leftIsActive ? `${v}${activeUnit}` : (v as number).toLocaleString()),
            },
            border: { display: false },
          },
          y1: {
            display: showRightAxis,
            position: 'right',
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: { color: c.active, callback: (v) => `${v}${activeUnit}` },
            border: { display: false },
          },
        },
      },
    }
    chart = new Chart(canvas, config)
  })

  onMount(() => () => chart?.destroy())
</script>

<div class="card p-5">
  <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
    <h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--ink-2)">
      Activity Over Time
    </h2>
    {#if app.stats.hasActiveData}
      <div class="flex gap-1 rounded-lg p-0.5" style="background: var(--surface-2)">
        {#each MODES as md}
          <button onclick={() => (mode = md.id)}
            class="rounded-md px-2.5 py-1 text-xs font-medium transition"
            style="{mode === md.id ? 'background: var(--surface); color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.08)' : 'color: var(--ink-2)'}">
            {md.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>
  <div class="h-72">
    <canvas bind:this={canvas}></canvas>
  </div>
</div>
