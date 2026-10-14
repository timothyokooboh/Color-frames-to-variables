<script setup lang="ts">
import { computed } from 'vue'
import type {
  CollectionReview,
  PreviewResult,
  ProposedItem,
  CollectionOption,
} from '@color-frames/contracts'
import type { DeepReadonly } from 'vue'
import CollectionDestination from './CollectionDestination.vue'
import SwatchList from '../preview/SwatchList.vue'
const props = defineProps<{
  preview: DeepReadonly<PreviewResult>
  items: readonly ProposedItem[]
  review: DeepReadonly<CollectionReview> | null
  collections: readonly CollectionOption[]
  selected: string
  customName: string
  destinationError: string
  loading: boolean
  disabled: boolean
}>()
const emit = defineEmits<{
  select: [value: string]
  rename: [value: string]
  reload: []
  edit: [id: string, change: Partial<Pick<ProposedItem, 'relativeName' | 'included'>>]
  skipConflicts: []
}>()
const conflicts = computed(() =>
  props.review?.rows.some(({ status }) => status === 'duplicate' || status === 'conflict'),
)
</script>

<template>
  <CollectionDestination
    :collections="collections"
    :selected="selected"
    :custom-name="customName"
    :error="destinationError || review?.collectionError || ''"
    :loading="loading"
    :disabled="disabled"
    @select="emit('select', $event)"
    @rename="emit('rename', $event)"
    @reload="emit('reload')"
  />
  <p v-if="review" class="whitespace-pre-wrap break-words text-xs">
    Destination: {{ review.collectionName }}
  </p>
  <button
    type="button"
    :aria-disabled="disabled || !conflicts"
    class="rounded-md border border-input px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-ring aria-disabled:opacity-50"
    @click="!disabled && conflicts && emit('skipConflicts')"
  >
    Skip all conflicts
  </button>
  <SwatchList
    :swatches="preview.swatches"
    :items="items"
    :rows="review?.rows ?? []"
    :disabled="disabled"
    @edit="(id, change) => emit('edit', id, change)"
  />
</template>
