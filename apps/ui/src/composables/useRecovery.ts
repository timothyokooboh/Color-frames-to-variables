import { onMounted, onUnmounted, readonly, shallowRef } from 'vue'
import {
  isCollectionResponse,
  type CreationResult,
  type RecoveryPreview,
} from '@color-frames/contracts'
import type { DeepReadonly } from 'vue'
import { nextRequestId, readPluginMessage } from '@/lib/plugin-message'
export function useRecovery() {
  const recovered = shallowRef<RecoveryPreview | null>(null)
  const loading = shallowRef(false)
  const error = shallowRef('')
  let requestId = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  function recover(result: DeepReadonly<CreationResult>) {
    if (loading.value) return
    loading.value = true
    error.value = ''
    requestId = nextRequestId()
    window.parent.postMessage(
      {
        pluginMessage: { type: 'recover-collection', requestId, resultRequestId: result.requestId },
      },
      '*',
    )
    timer = setTimeout(() => {
      loading.value = false
      error.value = 'Could not reload failed items. Try again.'
    }, 10000)
  }
  function receive(event: MessageEvent<unknown>) {
    const message = readPluginMessage(event)
    if (!isCollectionResponse(message) || message.requestId !== requestId) return
    if (message.type !== 'recovery-preview' && message.type !== 'creation-error') return
    clearTimeout(timer)
    loading.value = false
    if (message.type === 'creation-error') error.value = message.message
    else {
      error.value = ''
      recovered.value = message
    }
  }
  onMounted(() => window.addEventListener('message', receive))
  onUnmounted(() => {
    clearTimeout(timer)
    window.removeEventListener('message', receive)
  })
  return {
    recovered: readonly(recovered),
    loading: readonly(loading),
    error: readonly(error),
    recover,
    reset: () => {
      requestId = nextRequestId()
      recovered.value = null
      error.value = ''
      clearTimeout(timer)
      loading.value = false
    },
  }
}
