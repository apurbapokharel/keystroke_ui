<script lang="ts">
  import { onMount } from 'svelte'
  import { state } from '../stores.svelte'
  import { Chart, registerables, type ChartConfiguration } from 'chart.js'

  Chart.register(...registerables)

  let canvas: HTMLCanvasElement
  let chart: Chart | null = null

  function themeColors(dark: boolean) {
    return {
      grid: dark ? '#2c2c2a' : '#e1e0d9',
      tick: '#898781',
      surface: dark ? '#1a1a19' : '#fcfcfb',
      ink: dark ? '#ffffff' : '#0b0b0b',
    }
  }

  $effect(() => {
    const s = state.stats
    const hosts = state.machineNames
    const dark = state.theme === 'dark'
    const c = themeColors(dark)
    if (!canvas) return

    const labels = s.timeSeries.map((b) => b.label)
    const datasets = hosts.map((host) => ({
      label: host,
      data: s.timeSeries.map((b) => b.byHost[host] || 0),
      backgroundColor: state.colorFor(host),
      borderColor: c.surface,
      borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
      borderRadius: 3,
      borderSkipped: false as const,
      stack: 'presses',
      maxBarThickness: 46,
    }))

    chart?.destroy()
    const config: ChartConfiguration = {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: hosts.length > 1, position: 'top', align: 'end',
            labels: { color: c.ink, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle' } },
          tooltip: {
            backgroundColor: c.ink, titleColor: c.surface, bodyColor: c.surface,
            callbacks: {
              footer: (items) => 'Total: ' + items.reduce((a, i) => a + (i.raw as number), 0).toLocaleString(),
            },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: c.tick, maxRotation: 0, autoSkipPadding: 12 }, border: { color: c.grid } },
          y: { stacked: true, beginAtZero: true, grid: { color: c.grid }, ticks: { color: c.tick, precision: 0 }, border: { display: false } },
        },
      },
    }
    chart = new Chart(canvas, config)
  })

  onMount(() => () => chart?.destroy())
</script>

<div class="h-72">
  <canvas bind:this={canvas}></canvas>
</div>
