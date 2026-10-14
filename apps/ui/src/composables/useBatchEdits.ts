import { computed, readonly, shallowRef, watch, type DeepReadonly, type Ref } from 'vue'
import type { PreviewResult, ProposedItem, CollectionReview } from '@color-frames/contracts'

export function useBatchEdits(preview: Readonly<Ref<DeepReadonly<PreviewResult> | null>>) {
  const items = shallowRef<ProposedItem[]>([])
  watch(preview, (value) => {
    items.value =
      value?.swatches.map(({ id, name }) => ({ id, relativeName: name, included: true })) ?? []
  })
  const dirty = computed(() =>
    items.value.some(
      (item) =>
        !item.included ||
        item.relativeName !== preview.value?.swatches.find(({ id }) => id === item.id)?.name,
    ),
  )
  const includedCount = computed(() => items.value.filter(({ included }) => included).length)
  function edit(id: string, change: Partial<Pick<ProposedItem, 'relativeName' | 'included'>>) {
    items.value = items.value.map((item) => (item.id === id ? { ...item, ...change } : item))
  }
  function skipConflicts(review: DeepReadonly<CollectionReview>) {
    const ids = new Set(
      review.rows
        .filter(({ status }) => status === 'duplicate' || status === 'conflict')
        .map(({ id }) => id),
    )
    items.value = items.value.map((item) =>
      ids.has(item.id) ? { ...item, included: false } : item,
    )
  }
  return { items: readonly(items), dirty, includedCount, edit, skipConflicts }
}
