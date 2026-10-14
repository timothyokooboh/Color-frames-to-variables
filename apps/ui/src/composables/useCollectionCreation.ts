import {
  computed,
  onMounted,
  onUnmounted,
  readonly,
  shallowRef,
  watch,
  type Ref,
  type DeepReadonly,
} from 'vue'
import {
  isCollectionResponse,
  type CollectionReview,
  type ReviewCollectionRequest,
  type CreateCollectionRequest,
  type CreationResult,
  type PreviewResult,
  type ProposedItem,
  type Destination,
} from '@color-frames/contracts'
import { nextRequestId, readPluginMessage } from '@/lib/plugin-message'

export function useCollectionCreation(
  preview: Readonly<Ref<DeepReadonly<PreviewResult> | null>>,
  loading: Readonly<Ref<boolean>>,
  items: Readonly<Ref<readonly ProposedItem[]>>,
  destination: Readonly<Ref<Destination | null>>,
) {
  const review = shallowRef<CollectionReview | null>(null)
  const result = shallowRef<CreationResult | null>(null)
  const submitting = shallowRef(false)
  const error = shallowRef('')
  let requestId = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const canCreate = computed(
    () => !loading.value && !submitting.value && !result.value && review.value?.canCreate === true,
  )

  function requestReview() {
    clearTimeout(timer)
    review.value = null
    error.value = ''
    requestId = nextRequestId()
    if (!preview.value || !destination.value || loading.value || submitting.value || result.value)
      return
    window.parent.postMessage(
      {
        pluginMessage: {
          type: 'review-collection',
          requestId,
          previewRequestId: preview.value.requestId,
          destination: destination.value,
          items: items.value.map(({ id, relativeName, included }) => ({
            id,
            relativeName,
            included,
          })),
        } satisfies ReviewCollectionRequest,
      },
      '*',
    )
    timer = setTimeout(() => {
      error.value = 'Could not review the destination. Refresh the selection to try again.'
    }, 10000)
  }
  function create() {
    if (!canCreate.value || !review.value) return
    submitting.value = true
    error.value = ''
    clearTimeout(timer)
    window.parent.postMessage(
      {
        pluginMessage: {
          type: 'create-collection',
          requestId: (requestId = nextRequestId()),
          reviewRequestId: review.value.requestId,
        } satisfies CreateCollectionRequest,
      },
      '*',
    )
    timer = setTimeout(() => {
      error.value = 'Still waiting for Figma. Creation remains locked to avoid duplicate writes.'
    }, 10000)
  }
  function receive(event: MessageEvent<unknown>) {
    const message = readPluginMessage(event)
    if (
      !isCollectionResponse(message) ||
      message.type === 'collection-options' ||
      message.requestId !== requestId
    )
      return
    clearTimeout(timer)
    error.value = ''
    if (message.type === 'collection-review') review.value = message
    else {
      submitting.value = false
      review.value = null
      if (message.type === 'creation-result') result.value = message
      else error.value = message.message
    }
  }
  function reset() {
    if (!submitting.value) {
      result.value = null
      review.value = null
      error.value = ''
    }
  }
  watch([preview, loading, items, destination], requestReview)
  onMounted(() => window.addEventListener('message', receive))
  onUnmounted(() => {
    clearTimeout(timer)
    window.removeEventListener('message', receive)
  })
  return {
    review: readonly(review),
    result: readonly(result),
    submitting: readonly(submitting),
    error: readonly(error),
    canCreate,
    create,
    reset,
  }
}
