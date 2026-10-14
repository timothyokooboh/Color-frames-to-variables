<script setup lang="ts">
defineProps<{
  count: number
  enabled: boolean
  submitting: boolean
  retry?: boolean
  updates?: boolean
}>()
const emit = defineEmits<{ create: [] }>()
</script>

<template>
  <div class="sticky bottom-0 shrink-0 border-t border-border bg-background py-3">
    <button
      type="button"
      :aria-disabled="!enabled"
      class="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold shadow-sm enabled:active:brightness-95 text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring aria-disabled:opacity-50"
      @click="enabled && emit('create')"
    >
      {{
        submitting
          ? 'Applying changes…'
          : `${retry ? 'Retry' : updates ? 'Apply' : 'Create'} ${count} ${updates ? 'change' : 'variable'}${count === 1 ? '' : 's'}`
      }}
    </button>
  </div>
</template>
