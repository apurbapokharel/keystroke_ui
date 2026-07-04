<script lang="ts">
  import { onMount } from 'svelte'
  import { state } from '../stores.svelte'
  import { Chart, registerables } from 'chart.js'

  Chart.register(...registerables)

  let canvas: HTMLCanvasElement
  let chart: Chart | null = null

  $effect(() => {
    const series = state.stats.timeSeries
    if (!canvas) return

    if (chart) {
      chart.data.labels = series.map((s) => s.label)
      chart.data.datasets[0].data = series.map((s) => s.count)
      chart.update('none')
      return
    }

    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: series.map((s) => s.label),
        datasets: [{
          label: 'Keystrokes',
          data: series.map((s) => s.count),
          backgroundColor: '#6366f1',
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    })
  })

  onMount(() => {
    return () => chart?.destroy()
  })
</script>

<div class="h-64">
  <canvas bind:this={canvas}></canvas>
</div>
