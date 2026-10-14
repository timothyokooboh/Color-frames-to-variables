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
    <SelectionSummary
      :eligible="result?.swatches.length ?? 0"
      :skipped="result?.skipped.length ?? 0"
      :loading="loading"
      :has-error="Boolean(error)"
      @refresh="refresh"
    />
    <p v-if="error" role="alert" class="text-sm">{{ error }}</p>
    <template v-else-if="result && !loading">
      <PreviewEmptyState
        v-if="result.swatches.length === 0"
        :has-skipped="result.skipped.length > 0"
      />
      <SwatchList v-else :swatches="result.swatches" />
      <SkippedLayers v-if="result.skipped.length" :layers="result.skipped" />
    </template>
  </div>
</template>
