import type { CollectionRequest, CollectionResponse } from './creation'
import { isRecord, isRequestId } from './validation'

export function isCollectionRequest(value: unknown): value is CollectionRequest {
  if (!isRecord(value) || !isRequestId(value.requestId)) return false
  return value.type === 'review-collection'
    ? isRequestId(value.previewRequestId) && typeof value.collectionName === 'string'
    : value.type === 'create-collection' && isRequestId(value.reviewRequestId)
}

export function isCollectionResponse(value: unknown): value is CollectionResponse {
  if (!isRecord(value) || !isRequestId(value.requestId)) return false
  if (value.type === 'creation-error') return typeof value.message === 'string'
  if (typeof value.collectionName !== 'string') return false
  if (value.type === 'collection-review')
    return (
      typeof value.canCreate === 'boolean' &&
      typeof value.collectionError === 'string' &&
      Array.isArray(value.issues) &&
      value.issues.every(
        (item: unknown) =>
          isRecord(item) && typeof item.id === 'string' && typeof item.message === 'string',
      )
    )
  return (
    value.type === 'creation-result' &&
    typeof value.collectionEmpty === 'boolean' &&
    typeof value.collectionId === 'string' &&
    [value.created, value.failed, value.unsupported].every(
      (count) => typeof count === 'number' && Number.isSafeInteger(count) && count >= 0,
    ) &&
    Array.isArray(value.errors) &&
    value.errors.every(
      (item: unknown) =>
        isRecord(item) &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.message === 'string',
    )
  )
}
