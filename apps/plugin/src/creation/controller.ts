import type {
  CollectionResponse,
  CollectionReview,
  PreviewResult,
  ReviewCollectionRequest,
} from '@color-frames/contracts'
import { isCollectionRequest, isPreviewRequest } from '@color-frames/contracts'
import { createPreviewController } from '../preview/controller'
import { inspectDestination, reviewDestination } from './destination'
import { writeCollection } from './write'

export function createCollectionController(host: PluginAPI) {
  const preview = createPreviewController(host)
  let snapshot: PreviewResult | null = null
  let reviewed: {
    result: CollectionReview
    request: ReviewCollectionRequest
    target: string
  } | null = null
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
    if (request.type === 'list-collections') {
      try {
        return {
          type: 'collection-options',
          requestId: request.requestId,
          collections: (await host.variables.getLocalVariableCollectionsAsync()).map(
            ({ id, name }) => ({ id, name }),
          ),
        }
      } catch {
        return error('Could not load collections. Try again.')
      }
    }
    if (busy || completed)
      return error('This batch is processing or complete. Start a new batch after completion.')
    if (request.type === 'review-collection') {
      reviewed = null
      const version = ++revision
      const source = snapshot
      if (!source || request.previewRequestId !== source.requestId)
        return error('Refresh the selection before reviewing.')
      try {
        const target = await inspectDestination(host, request.destination)
        if (version !== revision || busy || completed)
          return error('The preview changed. Review again.')
        const result = reviewDestination(source, request, target)
        reviewed = {
          result,
          request,
          target: JSON.stringify([
            target.collection?.id,
            target.collection?.name,
            target.collection?.defaultModeId,
          ]),
        }
        return result
      } catch (cause) {
        return error(
          cause instanceof Error
            ? cause.message
            : 'Could not read local collections. Refresh the selection and try again.',
        )
      }
    }
    if (
      !snapshot ||
      !reviewed?.result.canCreate ||
      request.reviewRequestId !== reviewed.result.requestId
    )
      return error('Resolve the blocking issues and review again.')
    busy = true
    const source = snapshot
    const destination = reviewed
    reviewed = null
    revision++
    try {
      const target = await inspectDestination(host, destination.request.destination)
      const current = preview({ type: 'preview-selection', requestId: source.requestId })
      if (JSON.stringify(current) !== JSON.stringify(source))
        return error('Sources or selection changed. Refresh the selection and review again.')
      const checked = reviewDestination(source, destination.request, target)
      const targetKey = JSON.stringify([
        target.collection?.id,
        target.collection?.name,
        target.collection?.defaultModeId,
      ])
      if (!checked.canCreate || targetKey !== destination.target)
        return error(
          checked.collectionError || 'Destination changed. Review the destination again.',
        )
      const result = writeCollection(
        host,
        source,
        checked,
        request.requestId,
        target.collection,
        target.variables.length > 0,
      )
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
