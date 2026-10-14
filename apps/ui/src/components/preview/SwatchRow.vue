<script setup lang="ts">
import { computed } from 'vue'
import type { SourceSwatch } from '@color-frames/contracts'
import { colorToCss, colorToHex } from '@/lib/color-display'

const props = defineProps<{ swatch: SourceSwatch }>()
const hex = computed(() => colorToHex(props.swatch.color))
const backgroundColor = computed(() => colorToCss(props.swatch.color))
</script>

<template>
  <li class="flex gap-3 rounded-lg border border-border p-3">
    <div
      aria-hidden="true"
      class="swatch-grid h-12 w-12 shrink-0 overflow-hidden rounded-md border border-input"
    >
      <div class="h-full w-full" :style="{ backgroundColor }" />
    </div>
    <div class="min-w-0 space-y-1">
      <p class="whitespace-pre-wrap break-words text-sm font-medium">
        {{ swatch.name || '(Unnamed layer)' }}
      </p>
      <p class="font-mono text-xs">{{ hex }}</p>
      <p v-if="swatch.hidden" class="text-xs text-muted-foreground">
        Layer is hidden; its visible fill is included.
      </p>
      <p v-if="swatch.nodeOpacity < 1" class="text-xs text-muted-foreground">
        Layer opacity {{ Math.round(swatch.nodeOpacity * 100) }}% is excluded; paint alpha is
        preserved.
      </p>
    </div>
  </li>
</template>

<style scoped>
.swatch-grid {
  background-color: #fff;
  background-image: conic-gradient(#d4d4d4 25%, transparent 0 50%, #d4d4d4 0 75%, transparent 0);
  background-size: 12px 12px;
}
</style>
