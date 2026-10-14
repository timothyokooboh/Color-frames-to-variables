<script setup lang="ts">
import type { DeepReadonly } from 'vue'
import type { CreationResult } from '@color-frames/contracts'
defineProps<{ result: DeepReadonly<CreationResult>; disabled: boolean }>()
const emit = defineEmits<{ startNew: [] }>()
</script>
<template>
  <div class="space-y-2 rounded-md bg-accent p-3 text-xs">
    <p role="status">
      {{ result.created }} created · {{ result.updated }} updated · {{ result.excluded }} excluded ·
      {{ result.unsupported }} unsupported. Completed items are locked. Only failed items appear
      below.
    </p>
    <p>Reloading rereads the original failed source layers.</p>
    <button
      type="button"
      :disabled="disabled"
      class="rounded text-primary underline disabled:opacity-50"
      @click="emit('startNew')"
    >
      Start new batch
    </button>
  </div>
</template>
