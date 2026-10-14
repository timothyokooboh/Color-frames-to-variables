<script setup lang="ts">
import { nextTick, useTemplateRef, shallowRef } from 'vue'
import { useSelectionPreview } from '@/composables/useSelectionPreview'
import { useCollectionCreation } from '@/composables/useCollectionCreation'
import CollectionEditor from '../creation/CollectionEditor.vue'
import { useDestinations } from '@/composables/useDestinations'
import { useBatchEdits } from '@/composables/useBatchEdits'
import CreationAction from '../creation/CreationAction.vue'
import CreationResults from '../creation/CreationResults.vue'
import PreviewEmptyState from './PreviewEmptyState.vue'
import SelectionSummary from './SelectionSummary.vue'
import RefreshConfirmation from './RefreshConfirmation.vue'
import SkippedLayers from './SkippedLayers.vue'

const { result, loading, error, refresh, selectionChanged } = useSelectionPreview()
const destinations = useDestinations()
const {
  collections,
  selected,
  customName,
  loading: destinationsLoading,
  error: destinationError,
  destination,
} = destinations
const edits = useBatchEdits(result)
const { items, includedCount, dirty } = edits
const creation = useCollectionCreation(result, loading, items, destination)
const { review, result: created, submitting, error: creationError, canCreate } = creation
const previewElement = useTemplateRef('previewElement')
const confirmRefresh = shallowRef(false)
function requestRefresh() {
  if (!submitting.value) {
    if (dirty.value) confirmRefresh.value = true
    else refresh()
  }
}
function discardAndRefresh() {
  confirmRefresh.value = false
  refresh()
}
async function restoreFocus() {
  await nextTick()
  previewElement.value?.querySelector('button')?.focus()
}
async function startNew() {
  creation.reset()
  destinations.reset()
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
        @refresh="requestRefresh"
      />
      <p v-if="selectionChanged" role="status" class="text-sm">
        Selection changed. Refresh selection to review the current layers.
      </p>
      <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
      <template v-else-if="result && !loading">
        <PreviewEmptyState
          v-if="result.swatches.length === 0"
          :has-skipped="result.skipped.length > 0"
        />
        <template v-else>
          <CollectionEditor
            :preview="result"
            :items="items"
            :review="review"
            :collections="collections"
            :selected="selected"
            :custom-name="customName"
            :destination-error="destinationError"
            :loading="destinationsLoading"
            :disabled="submitting"
            @select="destinations.select"
            @rename="destinations.rename"
            @reload="destinations.reload"
            @edit="edits.edit"
            @skip-conflicts="review && edits.skipConflicts(review)"
          />
        </template>
        <SkippedLayers v-if="result.skipped.length" :layers="result.skipped" />
      </template>
      <p v-if="creationError" role="alert" class="text-sm text-destructive">{{ creationError }}</p>
    </div>
    <CreationAction
      :count="includedCount"
      :enabled="canCreate"
      :submitting="submitting"
      @create="creation.create"
    />
  </div>
  <RefreshConfirmation
    :open="confirmRefresh"
    @cancel="confirmRefresh = false"
    @confirm="discardAndRefresh"
    @restore-focus="restoreFocus"
  />
</template>
