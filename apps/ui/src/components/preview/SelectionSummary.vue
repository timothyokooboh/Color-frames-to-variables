<script setup lang="ts">
defineProps<{ eligible: number; skipped: number }>()
defineEmits<{ refresh: [] }>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p class="text-sm text-muted-foreground">{{ eligible }} eligible · {{ skipped }} skipped</p>
    <button
      type="button"
      class="rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-accent"
      @click="$emit('refresh')"
    >
      Refresh selection
    </button>
  </div>
</template>
