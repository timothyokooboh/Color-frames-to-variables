<script setup lang="ts">
import { onMounted, useTemplateRef, type DeepReadonly } from 'vue'
import type { CreationResult } from '@color-frames/contracts'
defineProps<{ result: DeepReadonly<CreationResult>; busy?: boolean; error?: string }>()
const emit = defineEmits<{ startNew: []; recover: [] }>()
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
      {{ result.created }} created · {{ result.updated }} updated · {{ result.failed }} failed ·
      {{ result.excluded }} excluded · {{ result.unsupported }} unsupported
    </p>
    <p v-if="result.created + result.updated === 0" class="text-sm">
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
    <ul
      v-if="result.warnings?.length"
      aria-label="Retained incomplete variables"
      class="space-y-2 text-xs text-destructive"
    >
      <li v-for="warning in result.warnings" :key="warning.id">
        {{ warning.name }}: {{ warning.message }}
      </li>
    </ul>
    <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
    <p v-if="result.failed" class="text-xs text-muted-foreground">
      Successful writes are retained. Retry reloads failed items for review before writing.
    </p>
    <div v-if="result.failed" class="flex flex-wrap gap-2">
      <button
        type="button"
        :disabled="busy"
        class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
        @click="emit('recover')"
      >
        {{ busy ? 'Reloading…' : 'Retry failed' }}
      </button>
      <button
        type="button"
        :disabled="busy"
        class="rounded-md border border-input px-3 py-2 text-sm"
        @click="emit('recover')"
      >
        Back to preview
      </button>
    </div>
    <button
      :disabled="busy"
      type="button"
      class="rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
      @click="emit('startNew')"
    >
      Start new batch
    </button>
  </section>
</template>
