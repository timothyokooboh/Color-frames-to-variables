import type { CollectionRequest, CollectionResponse } from './creation'
import { isRecord, isRequestId } from './validation'

export function isCollectionRequest(value: unknown): value is CollectionRequest {
  if (!isRecord(value) || !isRequestId(value.requestId)) return false
  if (value.type === 'list-collections') return true
  if (value.type === 'create-collection') return isRequestId(value.reviewRequestId)
  if (
    value.type !== 'review-collection' ||
    !isRequestId(value.previewRequestId) ||
    !isRecord(value.destination)
  )
    return false
  const target = value.destination
  const validTarget =
    target.kind === 'new'
      ? typeof target.name === 'string'
      : target.kind === 'existing' && typeof target.id === 'string'
  return (
    validTarget &&
    (value.items === undefined ||
      (Array.isArray(value.items) &&
        value.items.every(
          (item: unknown) =>
            isRecord(item) &&
            typeof item.id === 'string' &&
            typeof item.relativeName === 'string' &&
            typeof item.included === 'boolean',
        )))
  )
}

export function isCollectionResponse(value: unknown): value is CollectionResponse {
  if (!isRecord(value) || !isRequestId(value.requestId)) return false
  if (value.type === 'creation-error') return typeof value.message === 'string'
  if (value.type === 'collection-options')
    return (
      Array.isArray(value.collections) &&
      value.collections.every(
        (item: unknown) =>
          isRecord(item) && typeof item.id === 'string' && typeof item.name === 'string',
      )
    )
  if (typeof value.collectionName !== 'string') return false
  if (value.type === 'collection-review')
    return (
      typeof value.canCreate === 'boolean' &&
      typeof value.collectionError === 'string' &&
      Array.isArray(value.rows) &&
      value.rows.every(
        (row: unknown) =>
          isRecord(row) &&
          typeof row.id === 'string' &&
          typeof row.relativeName === 'string' &&
          typeof row.included === 'boolean' &&
          typeof row.fullPath === 'string' &&
          typeof row.message === 'string' &&
          ['ready', 'excluded', 'invalid', 'duplicate', 'conflict'].includes(String(row.status)),
      ) &&
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
    [value.created, value.failed, value.excluded, value.unsupported].every(
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
