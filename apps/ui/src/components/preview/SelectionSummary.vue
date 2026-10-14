<script setup lang="ts">
defineProps<{ eligible: number; skipped: number; loading: boolean; hasError: boolean }>()
defineEmits<{ refresh: [] }>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p role="status" class="text-sm text-muted-foreground">
      {{
        loading
          ? 'Reading selection…'
          : hasError
            ? 'Preview unavailable'
            : `${eligible} eligible · ${skipped} skipped`
      }}
    </p>
    <button
      type="button"
      :aria-disabled="loading"
      class="rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-accent"
      @click="!loading && $emit('refresh')"
    >
      {{ hasError ? 'Try again' : 'Refresh selection' }}
    </button>
  </div>
</template>
