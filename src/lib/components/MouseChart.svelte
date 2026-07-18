<script lang="ts">
  import { onMount } from 'svelte'
  import { state } from '../stores.svelte'
  import { formatDistance } from '../format'
  import { CATEGORICAL } from '../palette'
  import { Chart, registerables, type ChartConfiguration, type ChartDataset } from 'chart.js'

  Chart.register(...registerables)

  // 'clicks' = stacked L/R/M bars, 'inches' = travel line, 'both' = clicks bars + inches line.
  let { metric = 'both' }: { metric?: 'clicks' | 'inches' | 'both' } = $props()

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
    const dark = state.theme === 'dark'
    const c = themeColors(dark)
    const pal = CATEGORICAL[dark ? 'dark' : 'light']
    if (!canvas) return

    const series = s.mouseSeries
    const labels = series.map((b) => b.label)
    const inchesData = series.map((b) => b.inches)
    const [colL, colR, colM] = [pal[0], pal[1], pal[2]]

    const barBase = {
      type: 'bar' as const,
      borderColor: c.surface,
      borderRadius: 3,
      borderSkipped: false as const,
      maxBarThickness: 46,
    }
    const clickDatasets: ChartDataset[] = [
      { ...barBase, label: 'Left', data: series.map((b) => b.leftClick), backgroundColor: colL, stack: 'clicks', yAxisID: 'y' },
      { ...barBase, label: 'Right', data: series.map((b) => b.rightClick), backgroundColor: colR, stack: 'clicks', yAxisID: 'y' },
      { ...barBase, label: 'Middle', data: series.map((b) => b.middleClick), backgroundColor: colM, stack: 'clicks', yAxisID: 'y' },
    ]
    const inchesLine: ChartDataset = {
      type: 'line', label: 'Travel', data: inchesData,
      borderColor: '#eb6834', backgroundColor: '#eb6834',
      borderWidth: 2, pointRadius: 2, pointHoverRadius: 4, tension: 0.3,
      yAxisID: metric === 'both' ? 'y1' : 'y',
    }

    let datasets: ChartDataset[]
    if (metric === 'clicks') datasets = clickDatasets
    else if (metric === 'inches') datasets = [inchesLine]
    else datasets = [...clickDatasets, inchesLine]

    const stackedLeft = metric !== 'inches'
    const showRight = metric === 'both'
    const leftIsInches = metric === 'inches'

    chart?.destroy()
    // Base type 'bar'; the travel dataset overrides to 'line' per-dataset.
    const config: ChartConfiguration = {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: metric !== 'inches',
            position: 'top', align: 'end',
            labels: { color: c.ink, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle' },
          },
          tooltip: {
            backgroundColor: c.ink, titleColor: c.surface, bodyColor: c.surface,
            callbacks: {
              label: (item) => {
                if (item.dataset.label === 'Travel') return `Travel: ${formatDistance(item.raw as number)}`
                return `${item.dataset.label}: ${(item.raw as number).toLocaleString()}`
              },
            },
          },
        },
        scales: {
          x: { stacked: stackedLeft, grid: { display: false }, ticks: { color: c.tick, maxRotation: 0, autoSkipPadding: 12 }, border: { color: c.grid } },
          y: {
            stacked: stackedLeft, beginAtZero: true,
            grid: { color: c.grid },
            ticks: {
              color: c.tick, precision: 0,
              callback: (v) => (leftIsInches ? formatDistance(v as number) : (v as number).toLocaleString()),
            },
            border: { display: false },
          },
          y1: {
            display: showRight, position: 'right', beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: { color: '#eb6834', callback: (v) => formatDistance(v as number) },
            border: { display: false },
          },
        },
      },
    }
    chart = new Chart(canvas, config)
  })

  onMount(() => () => chart?.destroy())
</script>

<div class="h-64">
  <canvas bind:this={canvas}></canvas>
</div>
