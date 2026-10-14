<script setup lang="ts">
import { onMounted, useTemplateRef, type DeepReadonly } from 'vue'
import type { CreationResult } from '@color-frames/contracts'
defineProps<{ result: DeepReadonly<CreationResult> }>()
const emit = defineEmits<{ startNew: [] }>()
const heading = useTemplateRef('heading')
onMounted(() => heading.value?.focus())
</script>

<template>
  <section class="space-y-4" aria-labelledby="results-title">
    <h2 id="results-title" ref="heading" tabindex="-1" class="text-sm font-semibold">
      Creation results
    </h2>
    <p class="whitespace-pre-wrap break-words text-sm">Collection: {{ result.collectionName }}</p>
    <p role="status" class="text-sm">
      {{ result.created }} created · {{ result.failed }} failed · {{ result.excluded }} excluded ·
      {{ result.unsupported }} unsupported
    </p>
    <p v-if="result.created === 0" class="text-sm">
      No values were successfully assigned. The collection has been retained; inspect any reported
      incomplete variables before starting another batch.
    </p>
    <p v-if="result.collectionEmpty" class="text-sm">The retained collection is empty.</p>
    <ul v-if="result.errors.length" aria-label="Failed variables" class="space-y-2">
      <li
        v-for="item in result.errors"
        :key="item.id"
        class="rounded-md border border-border p-3 text-xs"
      >
        <p class="whitespace-pre-wrap break-words font-medium">{{ item.name }}</p>
        <p>{{ item.message }}</p>
      </li>
    </ul>
    <button
      type="button"
      class="rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
      @click="emit('startNew')"
    >
      Start new batch
    </button>
  </section>
</template>
