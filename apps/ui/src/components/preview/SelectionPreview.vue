<script setup lang="ts">
import { nextTick, useTemplateRef, shallowRef, computed, watch } from 'vue'
import { useSelectionPreview } from '@/composables/useSelectionPreview'
import { useCollectionCreation } from '@/composables/useCollectionCreation'
import CollectionEditor from '../creation/CollectionEditor.vue'
import { useDestinations } from '@/composables/useDestinations'
import { useBatchEdits } from '@/composables/useBatchEdits'
import { useRecovery } from '@/composables/useRecovery'
import CreationAction from '../creation/CreationAction.vue'
import RecoverySummary from '../creation/RecoverySummary.vue'
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
  destination: selectedDestination,
} = destinations
const recovery = useRecovery()
const { recovered, loading: recovering, error: recoveryError } = recovery
const preview = computed(() => recovered.value?.preview ?? result.value)
const destination = computed(() => recovered.value?.destination ?? selectedDestination.value)
const edits = useBatchEdits(
  preview,
  computed(() => recovered.value?.items),
)
const { items, includedCount, dirty } = edits
const creation = useCollectionCreation(preview, loading, items, destination)
const { review, result: created, submitting, reviewing, error: creationError, canCreate } = creation
const previewElement = useTemplateRef('previewElement')
const confirmRefresh = shallowRef(false)
watch(
  recovered,
  () => {
    creation.reset()
    void restoreFocus()
  },
  { flush: 'sync' },
)
function requestRefresh() {
  if (!submitting.value) {
    if (dirty.value) confirmRefresh.value = true
    else reloadPreview()
  }
}
function discardAndRefresh() {
  confirmRefresh.value = false
  reloadPreview()
}
function reloadPreview() {
  if (recovered.value) recovery.recover(recovered.value.previous)
  else refresh()
}
async function restoreFocus() {
  await nextTick()
  previewElement.value?.querySelector<HTMLButtonElement>('[data-refresh-selection]')?.focus()
}
async function startNew() {
  recovery.reset()
  creation.reset()
  destinations.reset()
  refresh()
  await nextTick()
  previewElement.value?.querySelector<HTMLButtonElement>('[data-refresh-selection]')?.focus()
}
</script>

<template>
  <CreationResults
    v-if="created"
    :result="created"
    :busy="recovering"
    :error="recoveryError"
    @recover="recovery.recover(created)"
    @start-new="startNew"
  />
  <div v-else ref="previewElement" class="flex h-full flex-col" :aria-busy="loading || submitting">
    <div class="min-h-0 flex-1 space-y-4 overflow-auto pb-4">
      <RecoverySummary
        v-if="recovered"
        :result="recovered.previous"
        :disabled="submitting || recovering"
        @start-new="startNew"
      />
      <SelectionSummary
        :eligible="preview?.swatches.length ?? 0"
        :skipped="preview?.skipped.length ?? 0"
        :loading="loading || submitting || recovering"
        :has-error="Boolean(error)"
        @refresh="requestRefresh"
      />
      <p v-if="selectionChanged && !recovered" role="status" class="text-sm">
        Selection changed. Refresh selection to review the current layers.
      </p>
      <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
      <template v-else-if="preview && !loading">
        <PreviewEmptyState
          v-if="preview.swatches.length === 0"
          :has-skipped="preview.skipped.length > 0"
        />
        <template v-else>
          <CollectionEditor
            :preview="preview"
            :items="items"
            :review="review"
            :collections="collections"
            :selected="selected"
            :custom-name="customName"
            :destination-error="destinationError"
            :loading="destinationsLoading"
            :disabled="submitting || recovering"
            :recovery-name="recovered?.previous.collectionName"
            :reviewing="reviewing"
            @select="destinations.select"
            @rename="destinations.rename"
            @reload="destinations.reload"
            @edit="edits.edit"
            @skip-conflicts="review && edits.skipConflicts(review)"
          />
        </template>
        <SkippedLayers v-if="preview.skipped.length" :layers="preview.skipped" />
      </template>
      <p v-if="recoveryError" role="alert" class="text-sm text-destructive">{{ recoveryError }}</p>
      <p v-if="creationError" role="alert" class="text-sm text-destructive">{{ creationError }}</p>
    </div>
    <CreationAction
      :count="includedCount"
      :retry="Boolean(recovered)"
      :updates="Boolean(review?.rows.some((row) => row.operation === 'update'))"
      :enabled="canCreate && !recovering"
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
