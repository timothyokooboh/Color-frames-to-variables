import { computed, onMounted, onUnmounted, readonly, shallowRef } from 'vue'
import {
  isCollectionResponse,
  type CollectionOption,
  type Destination,
  type ListCollectionsRequest,
} from '@color-frames/contracts'
import { nextRequestId, readPluginMessage } from '@/lib/plugin-message'

export function useDestinations() {
  const collections = shallowRef<CollectionOption[]>([])
  const selected = shallowRef('')
  const customName = shallowRef('')
  const loading = shallowRef(true)
  const error = shallowRef('')
  let initialized = false
  let requestId = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const destination = computed<Destination | null>(() => {
    if (loading.value || error.value || !selected.value) return null
    if (selected.value.startsWith('existing:'))
      return { kind: 'existing', id: selected.value.slice(9) }
    return { kind: 'new', name: selected.value === 'new:colors' ? 'Colors' : customName.value }
  })
  function reload() {
    clearTimeout(timer)
    requestId = nextRequestId()
    loading.value = true
    error.value = ''
    window.parent.postMessage(
      { pluginMessage: { type: 'list-collections', requestId } satisfies ListCollectionsRequest },
      '*',
    )
    timer = setTimeout(() => {
      loading.value = false
      error.value = 'Could not load collections. Try again.'
    }, 10000)
  }
  function receive(event: MessageEvent<unknown>) {
    const message = readPluginMessage(event)
    if (!isCollectionResponse(message) || message.requestId !== requestId) return
    if (message.type !== 'collection-options' && message.type !== 'creation-error') return
    clearTimeout(timer)
    loading.value = false
    if (message.type === 'creation-error') {
      error.value = message.message
      return
    }
    error.value = ''
    collections.value = message.collections
    const colors = message.collections.find(({ name }) => name === 'Colors')
    if (!initialized) {
      selected.value = colors ? `existing:${colors.id}` : 'new:colors'
      initialized = true
    } else if (
      (selected.value.startsWith('existing:') &&
        !message.collections.some(({ id }) => `existing:${id}` === selected.value)) ||
      (selected.value === 'new:colors' && colors)
    ) {
      selected.value = ''
    }
  }
  onMounted(() => {
    window.addEventListener('message', receive)
    reload()
  })
  onUnmounted(() => {
    clearTimeout(timer)
    window.removeEventListener('message', receive)
  })
  return {
    collections: readonly(collections),
    selected: readonly(selected),
    customName: readonly(customName),
    loading: readonly(loading),
    error: readonly(error),
    destination,
    select: (value: string) => {
      selected.value = value
    },
    rename: (value: string) => {
      customName.value = value
    },
    reload,
    reset: () => {
      initialized = false
      selected.value = ''
      reload()
    },
  }
}
