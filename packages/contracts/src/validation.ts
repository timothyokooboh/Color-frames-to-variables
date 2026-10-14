import type { PreviewRequest, PreviewResponse } from './index'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isRequestId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

export function isPreviewRequest(value: unknown): value is PreviewRequest {
  return isRecord(value) && value.type === 'preview-selection' && isRequestId(value.requestId)
}

export function isPreviewResponse(value: unknown): value is PreviewResponse {
  if (!isRecord(value) || !isRequestId(value.requestId)) return false
  if (value.type === 'preview-error') return typeof value.message === 'string'
  return (
    value.type === 'preview-result' &&
    Array.isArray(value.swatches) &&
    value.swatches.every(isSwatch) &&
    Array.isArray(value.skipped) &&
    value.skipped.every((layer: unknown) => isLayer(layer) && typeof layer.reason === 'string')
  )
}

function isLayer(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string'
}

function isChannel(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
}

function isSwatch(value: unknown) {
  if (!isLayer(value) || !isRecord(value.color)) return false
  return (
    typeof value.hidden === 'boolean' &&
    isChannel(value.nodeOpacity) &&
    ['r', 'g', 'b', 'a'].every((channel) =>
      isChannel((value.color as Record<string, unknown>)[channel]),
    )
  )
}
