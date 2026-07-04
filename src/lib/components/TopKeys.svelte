<script lang="ts">
  import { state } from '../stores.svelte'

  const s = $derived(state.stats)
  const maxTop = $derived(s.topKeys[0]?.count || 1)
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Top 10 Keys</h3>
    <div class="space-y-2">
      {#each s.topKeys as key, i}
        <div class="flex items-center gap-3">
          <span class="w-5 text-right text-sm text-gray-400 tabular-nums">{i + 1}</span>
          <span class="w-10 text-sm font-semibold text-gray-800">{key.label || '␣'}</span>
          <div class="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              style="width: {(key.count / maxTop) * 100}%; background: #6366f1"
            ></div>
          </div>
          <span class="w-20 text-right text-sm text-gray-600 tabular-nums">{key.count.toLocaleString()}</span>
          <span class="w-14 text-right text-xs text-gray-400 tabular-nums">({key.percentage.toFixed(1)}%)</span>
        </div>
      {/each}
    </div>
  </div>

  <div>
    <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Least 10 Keys (letters)</h3>
    <div class="space-y-2">
      {#each s.bottomKeys as key, i}
        <div class="flex items-center gap-3">
          <span class="w-5 text-right text-sm text-gray-400 tabular-nums">{i + 1}</span>
          <span class="w-10 text-sm font-semibold text-gray-800">{key.label}</span>
          <div class="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              style="width: {(key.count / maxTop) * 100}%; background: #f59e0b"
            ></div>
          </div>
          <span class="w-20 text-right text-sm text-gray-600 tabular-nums">{key.count.toLocaleString()}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
