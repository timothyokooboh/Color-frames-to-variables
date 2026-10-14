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
} from '@color-frames/contracts'

export function useCollectionCreation(
  preview: Readonly<Ref<DeepReadonly<PreviewResult> | null>>,
  loading: Readonly<Ref<boolean>>,
) {
  const collectionName = shallowRef('Colors')
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
    requestId++
    if (!preview.value || loading.value || submitting.value || result.value) return
    window.parent.postMessage(
      {
        pluginMessage: {
          type: 'review-collection',
          requestId,
          previewRequestId: preview.value.requestId,
          collectionName: collectionName.value,
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
          requestId: ++requestId,
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
    if (event.origin !== 'https://www.figma.com' && event.origin !== 'https://figma.com') return
    if (typeof event.data !== 'object' || event.data === null) return
    const message: unknown = Reflect.get(event.data, 'pluginMessage')
    if (!isCollectionResponse(message) || message.requestId !== requestId) return
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
  function setCollectionName(value: string) {
    if (!submitting.value && !result.value) collectionName.value = value
  }
  function reset() {
    if (!submitting.value) {
      result.value = null
      review.value = null
      error.value = ''
      collectionName.value = 'Colors'
    }
  }
  watch([preview, loading, collectionName], requestReview)
  onMounted(() => window.addEventListener('message', receive))
  onUnmounted(() => {
    clearTimeout(timer)
    window.removeEventListener('message', receive)
  })
  return {
    collectionName: readonly(collectionName),
    review: readonly(review),
    result: readonly(result),
    submitting: readonly(submitting),
    error: readonly(error),
    canCreate,
    setCollectionName,
    create,
    reset,
  }
}
