import type { CollectionResponse, CollectionReview, PreviewResult } from '@color-frames/contracts'
import { isCollectionRequest, isPreviewRequest } from '@color-frames/contracts'
import { createPreviewController } from '../preview/controller'
import { reviewNames } from './validation'
import { writeCollection } from './write'

export function createCollectionController(host: PluginAPI) {
  const preview = createPreviewController(host)
  let snapshot: PreviewResult | null = null
  let reviewed: CollectionReview | null = null
  let busy = false
  let completed = false
  let revision = 0
  return async (request: unknown): Promise<CollectionResponse | ReturnType<typeof preview>> => {
    if (isPreviewRequest(request)) {
      if (busy)
        return {
          type: 'preview-error',
          requestId: request.requestId,
          message: 'Creation is in progress.',
        }
      revision++
      const result = preview(request)
      snapshot = result?.type === 'preview-result' ? result : null
      reviewed = null
      completed = false
      return result
    }
    if (!isCollectionRequest(request)) return null
    const error = (message: string): CollectionResponse => ({
      type: 'creation-error',
      requestId: request.requestId,
      message,
    })
    if (busy || completed)
      return error('This batch is processing or complete. Start a new batch after completion.')
    if (request.type === 'review-collection') {
      reviewed = null
      const version = ++revision
      const source = snapshot
      if (!source || request.previewRequestId !== source.requestId)
        return error('Refresh the selection before reviewing.')
      try {
        const collections = await host.variables.getLocalVariableCollectionsAsync()
        if (version !== revision || busy || completed)
          return error('The preview changed. Review again.')
        reviewed = reviewNames(
          source,
          request.collectionName,
          collections.map((collection) => collection.name),
          request.requestId,
        )
        return reviewed
      } catch {
        return error('Could not read local collections. Refresh the selection and try again.')
      }
    }
    if (!snapshot || !reviewed?.canCreate || request.reviewRequestId !== reviewed.requestId)
      return error('Resolve the blocking issues and review again.')
    busy = true
    const source = snapshot
    const destination = reviewed
    reviewed = null
    revision++
    try {
      const collections = await host.variables.getLocalVariableCollectionsAsync()
      const current = preview({ type: 'preview-selection', requestId: source.requestId })
      if (JSON.stringify(current) !== JSON.stringify(source))
        return error('Sources or selection changed. Refresh the selection and review again.')
      const checked = reviewNames(
        source,
        destination.collectionName,
        collections.map((collection) => collection.name),
        request.requestId,
      )
      if (!checked.canCreate)
        return error(
          checked.collectionError || 'The batch is no longer valid. Refresh the selection.',
        )
      const result = writeCollection(host, source, destination.collectionName, request.requestId)
      completed = true
      return result
    } catch (cause) {
      return error(
        cause instanceof Error
          ? cause.message
          : 'Could not create the collection. Refresh and try again.',
      )
    } finally {
      busy = false
    }
  }
}
