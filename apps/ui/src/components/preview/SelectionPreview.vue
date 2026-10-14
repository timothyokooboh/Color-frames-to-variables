<script setup lang="ts">
import { nextTick, useTemplateRef } from 'vue'
import { useSelectionPreview } from '@/composables/useSelectionPreview'
import { useCollectionCreation } from '@/composables/useCollectionCreation'
import CollectionDestination from '../creation/CollectionDestination.vue'
import CreationAction from '../creation/CreationAction.vue'
import CreationResults from '../creation/CreationResults.vue'
import PreviewEmptyState from './PreviewEmptyState.vue'
import SelectionSummary from './SelectionSummary.vue'
import SwatchList from './SwatchList.vue'
import SkippedLayers from './SkippedLayers.vue'

const { result, loading, error, refresh } = useSelectionPreview()
const creation = useCollectionCreation(result, loading)
const {
  collectionName,
  review,
  result: created,
  submitting,
  error: creationError,
  canCreate,
} = creation
const previewElement = useTemplateRef('previewElement')
async function startNew() {
  creation.reset()
  refresh()
  await nextTick()
  previewElement.value?.querySelector('button')?.focus()
}
</script>

<template>
  <CreationResults v-if="created" :result="created" @start-new="startNew" />
  <div v-else ref="previewElement" class="flex h-full flex-col" :aria-busy="loading || submitting">
    <div class="min-h-0 flex-1 space-y-4 overflow-auto pb-4">
      <SelectionSummary
        :eligible="result?.swatches.length ?? 0"
        :skipped="result?.skipped.length ?? 0"
        :loading="loading || submitting"
        :has-error="Boolean(error)"
        @refresh="refresh"
      />
      <p v-if="error" role="alert" class="text-sm">{{ error }}</p>
      <template v-else-if="result && !loading">
        <PreviewEmptyState
          v-if="result.swatches.length === 0"
          :has-skipped="result.skipped.length > 0"
        />
        <template v-else>
          <CollectionDestination
            :name="collectionName"
            :error="review?.collectionError ?? ''"
            :disabled="submitting"
            :reviewing="!review && !creationError && !submitting"
            @change="creation.setCollectionName"
          />
          <SwatchList :swatches="result.swatches" :issues="review?.issues ?? []" show-path />
        </template>
        <SkippedLayers v-if="result.skipped.length" :layers="result.skipped" />
      </template>
      <p v-if="creationError" role="alert" class="text-sm">{{ creationError }}</p>
    </div>
    <CreationAction
      :count="result?.swatches.length ?? 0"
      :enabled="canCreate"
      :submitting="submitting"
      @create="creation.create"
    />
  </div>
</template>
