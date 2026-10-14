import { computed, readonly, shallowRef, watch, type DeepReadonly, type Ref } from 'vue'
import type { PreviewResult, ProposedItem, CollectionReview } from '@color-frames/contracts'

export function useBatchEdits(
  preview: Readonly<Ref<DeepReadonly<PreviewResult> | null>>,
  initialItems: Readonly<Ref<readonly ProposedItem[] | undefined>>,
) {
  const items = shallowRef<ProposedItem[]>([])
  watch(
    [preview, initialItems],
    ([value, initial]) => {
      items.value =
        initial?.map((item) => ({ ...item })) ??
        value?.swatches.map(({ id, name }) => ({ id, relativeName: name, included: true })) ??
        []
    },
    { flush: 'sync' },
  )
  const dirty = computed(() =>
    items.value.some(
      (item) =>
        !item.included ||
        Boolean(item.overwriteToken) ||
        item.relativeName !== preview.value?.swatches.find(({ id }) => id === item.id)?.name,
    ),
  )
  const includedCount = computed(() => items.value.filter(({ included }) => included).length)
  function edit(
    id: string,
    change: Partial<Pick<ProposedItem, 'relativeName' | 'included' | 'overwriteToken'>>,
  ) {
    items.value = items.value.map((item) =>
      item.id === id
        ? {
            ...item,
            ...change,
            overwriteToken:
              'relativeName' in change || change.included === false
                ? undefined
                : 'overwriteToken' in change
                  ? change.overwriteToken
                  : item.overwriteToken,
          }
        : item,
    )
  }
  function skipConflicts(review: DeepReadonly<CollectionReview>) {
    const ids = new Set(
      review.rows
        .filter(({ status }) => status === 'duplicate' || status === 'conflict')
        .map(({ id }) => id),
    )
    items.value = items.value.map((item) =>
      ids.has(item.id) ? { ...item, included: false, overwriteToken: undefined } : item,
    )
  }
  return { items: readonly(items), dirty, includedCount, edit, skipConflicts }
}
