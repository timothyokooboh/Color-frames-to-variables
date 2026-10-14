<script setup lang="ts">
import type { SkippedLayer } from '@color-frames/contracts'
defineProps<{ layers: readonly SkippedLayer[] }>()
</script>

<template>
  <section aria-labelledby="skipped-title" class="space-y-3">
    <h2 id="skipped-title" class="text-sm font-semibold">Skipped layers</h2>
    <ul class="space-y-2">
      <li
        v-for="layer in layers"
        :key="layer.id"
        class="rounded-lg border border-border p-3 text-sm"
      >
        <p class="whitespace-pre-wrap break-words font-medium">
          {{ layer.name || '(Unnamed layer)' }}
        </p>
        <p class="mt-1 text-muted-foreground">{{ layer.reason }}</p>
      </li>
    </ul>
  </section>
</template>
