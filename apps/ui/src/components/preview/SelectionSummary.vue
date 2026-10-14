<script setup lang="ts">
defineProps<{ eligible: number; skipped: number; loading: boolean; hasError: boolean }>()
defineEmits<{ refresh: [] }>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p
      role="status"
      class="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
    >
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
      class="rounded-md px-2 py-2 text-xs font-medium text-primary hover:bg-accent"
      @click="!loading && $emit('refresh')"
    >
      {{ hasError ? 'Try again' : 'Refresh selection' }}
    </button>
  </div>
</template>
