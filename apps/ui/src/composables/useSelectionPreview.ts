import { onMounted, onUnmounted, readonly, shallowRef } from 'vue'
import { isPreviewResponse, type PreviewRequest, type PreviewResult } from '@color-frames/contracts'

import { readPluginMessage } from '@/lib/plugin-message'

export function useSelectionPreview() {
  const result = shallowRef<PreviewResult | null>(null)
  const loading = shallowRef(true)
  const error = shallowRef('')
  const selectionChanged = shallowRef(false)
  let requestId = 0
  let timeout: ReturnType<typeof setTimeout> | undefined

  function refresh() {
    clearTimeout(timeout)
    loading.value = true
    selectionChanged.value = false
    error.value = ''
    const request: PreviewRequest = { type: 'preview-selection', requestId: ++requestId }
    timeout = setTimeout(() => {
      loading.value = false
      error.value = 'No response from Figma. Open this plugin in Figma and try again.'
    }, 10000)
    window.parent.postMessage({ pluginMessage: request }, '*')
  }

  function receive(event: MessageEvent<unknown>) {
    const message = readPluginMessage(event)
    if (
      typeof message === 'object' &&
      message !== null &&
      Reflect.get(message, 'type') === 'selection-changed'
    ) {
      selectionChanged.value = true
      return
    }
    if (!isPreviewResponse(message) || message.requestId !== requestId) return
    clearTimeout(timeout)
    loading.value = false
    if (message.type === 'preview-error') error.value = message.message
    else {
      error.value = ''
      result.value = message
    }
  }

  onMounted(() => {
    window.addEventListener('message', receive)
    refresh()
  })
  onUnmounted(() => {
    clearTimeout(timeout)
    window.removeEventListener('message', receive)
  })
  return {
    selectionChanged: readonly(selectionChanged),
    result: readonly(result),
    loading: readonly(loading),
    error: readonly(error),
    refresh,
  }
}
