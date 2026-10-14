<script setup lang="ts">
defineProps<{ hasSkipped: boolean }>()
</script>

<template>
  <section class="rounded-lg border border-border p-5" aria-labelledby="empty-title">
    <h2 id="empty-title" class="text-sm font-semibold">
      {{ hasSkipped ? 'No eligible color swatches' : 'Select your color swatches' }}
    </h2>
    <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
      Select frames or rectangles with one visible solid fill, then refresh the selection. Only
      selected layers are read; nested layers are not scanned.
    </p>
  </section>
</template>
