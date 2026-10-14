import { onMounted, onUnmounted, readonly, shallowRef } from 'vue'
import { isPreviewResponse, type PreviewRequest, type PreviewResult } from '@color-frames/contracts'

export function useSelectionPreview() {
  const result = shallowRef<PreviewResult | null>(null)
  const loading = shallowRef(true)
  const error = shallowRef('')
  let requestId = 0
  let timeout: ReturnType<typeof setTimeout> | undefined

  function refresh() {
    clearTimeout(timeout)
    loading.value = true
    error.value = ''
    const request: PreviewRequest = { type: 'preview-selection', requestId: ++requestId }
    timeout = setTimeout(() => {
      loading.value = false
      error.value = 'No response from Figma. Open this plugin in Figma and try again.'
    }, 10000)
    window.parent.postMessage({ pluginMessage: request }, '*')
  }

  function receive(event: MessageEvent<unknown>) {
    // Figma relays through an ancestor frame, not necessarily the immediate parent.
    const fromFigma =
      event.origin === 'https://www.figma.com' || event.origin === 'https://figma.com'
    if (!fromFigma || typeof event.data !== 'object' || event.data === null) return
    const message: unknown = Reflect.get(event.data, 'pluginMessage')
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
  return { result: readonly(result), loading: readonly(loading), error: readonly(error), refresh }
}
