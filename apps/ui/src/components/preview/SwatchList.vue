<script setup lang="ts">
import { computed } from 'vue'
import type { SourceSwatch, ProposedItem, ReviewedItem } from '@color-frames/contracts'
import SwatchRow from './SwatchRow.vue'
import SwatchEdit from './SwatchEdit.vue'
const props = defineProps<{
  swatches: readonly SourceSwatch[]
  items: readonly ProposedItem[]
  rows: readonly ReviewedItem[]
  disabled: boolean
}>()
const emit = defineEmits<{
  edit: [id: string, change: Partial<Pick<ProposedItem, 'relativeName' | 'included'>>]
}>()
const rowsById = computed(() => new Map(props.rows.map((item) => [item.id, item])))
const itemsById = computed(() => new Map(props.items.map((item) => [item.id, item])))
</script>

<template>
  <section aria-labelledby="swatches-title" class="space-y-3">
    <h2 id="swatches-title" class="text-sm font-semibold">Eligible swatches</h2>
    <ul class="space-y-2">
      <SwatchRow v-for="swatch in swatches" :key="swatch.id" :swatch="swatch">
        <SwatchEdit
          v-if="itemsById.has(swatch.id)"
          :item="itemsById.get(swatch.id)!"
          :reviewed="rowsById.get(swatch.id)"
          :disabled="disabled"
          @edit="emit('edit', swatch.id, $event)"
        />
      </SwatchRow>
    </ul>
  </section>
</template>
