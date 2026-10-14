<script setup lang="ts">
import { useSelectionPreview } from '@/composables/useSelectionPreview'
import PreviewEmptyState from './PreviewEmptyState.vue'
import SelectionSummary from './SelectionSummary.vue'
import SwatchList from './SwatchList.vue'
import SkippedLayers from './SkippedLayers.vue'

const { result, loading, error, refresh } = useSelectionPreview()
</script>

<template>
  <div class="space-y-4" :aria-busy="loading">
    <p v-if="loading" role="status" class="text-sm text-muted-foreground">Reading selection…</p>
    <div v-else-if="error" class="space-y-3">
      <p role="alert" class="text-sm">{{ error }}</p>
      <button
        type="button"
        class="rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-accent"
        @click="refresh"
      >
        Try again
      </button>
    </div>
    <template v-else-if="result">
      <SelectionSummary
        :eligible="result.swatches.length"
        :skipped="result.skipped.length"
        @refresh="refresh"
      />
      <PreviewEmptyState
        v-if="result.swatches.length === 0"
        :has-skipped="result.skipped.length > 0"
      />
      <SwatchList v-else :swatches="result.swatches" />
      <SkippedLayers v-if="result.skipped.length" :layers="result.skipped" />
    </template>
  </div>
</template>
