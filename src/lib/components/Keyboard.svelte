<script lang="ts">
  import { state } from '../stores.svelte'
  import { KEY_MAP, KEY_ORDER, getColor, SVG_CONFIG } from '../keymap'

  const s = $derived(state.stats)
  const maxCount = $derived(Math.max(...Object.values(s.keyCounts), 1))

  const rows = $derived.by(() => {
    const r: { y: number; keys: { x: number; w: number; label: string; count: number; color: string }[] }[] = []
    for (let row = 0; row < 5; row++) {
      const keys = KEY_ORDER
        .filter((k) => KEY_MAP[k].row === row)
        .map((k) => {
          const m = KEY_MAP[k]
          const count = s.keyCounts[k] || 0
          return {
            x: m.col * (SVG_CONFIG.keyW + SVG_CONFIG.gap),
            w: m.w * SVG_CONFIG.keyW + (m.w - 1) * SVG_CONFIG.gap,
            label: m.label,
            count,
            color: getColor(count, maxCount),
          }
        })
      r.push({ y: row * (SVG_CONFIG.keyH + SVG_CONFIG.gap), keys })
    }
    return r
  })

  const svgW = 14 * SVG_CONFIG.colW
  const svgH = 5 * SVG_CONFIG.rowH
</script>

<div class="overflow-x-auto">
  <svg
    width={svgW}
    height={svgH}
    viewBox="0 0 {svgW} {svgH}"
    class="min-w-[700px]"
  >
    {#each rows as row}
      {#each row.keys as key (key.label + row.y)}
        <g>
          <rect
            x={key.x}
            y={row.y}
            width={key.w - SVG_CONFIG.gap}
            height={SVG_CONFIG.keyH - SVG_CONFIG.gap}
            rx={SVG_CONFIG.rx}
            fill={key.color}
            class="transition-colors duration-200"
          />
          {#if key.label}
            <text
              x={key.x + (key.w - SVG_CONFIG.gap) / 2}
              y={row.y + (SVG_CONFIG.keyH - SVG_CONFIG.gap) / 2 + SVG_CONFIG.fontSize / 3}
              text-anchor="middle"
              font-size={SVG_CONFIG.fontSize}
              fill={key.count > 0 ? '#fff' : '#6b7280'}
              font-family="system-ui, sans-serif"
              pointer-events="none"
            >
              {key.label}
            </text>
          {/if}
          <title>{key.count > 0 ? `${key.label || 'Space'}: ${key.count} presses` : key.label || 'Space'}</title>
        </g>
      {/each}
    {/each}
  </svg>
</div>
