import { finalizeReview } from './validation'
import { reviewArtifacts, type AllocationArtifact } from './artifacts'
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
import { recoverBatch, readSources, accumulateResult, type CompletedBatch } from './recovery'

function destinationFingerprint(collection: VariableCollection | undefined) {
  return JSON.stringify([collection?.id, collection?.name, collection?.defaultModeId])
}

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
  let batch: CompletedBatch | null = null
  let recovering = false
  const artifacts = new Map<string, AllocationArtifact>()
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
      artifacts.clear()
      batch = null
      recovering = false
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
    if (request.type === 'recover-collection') {
      if (
        busy ||
        !batch ||
        batch.result.requestId !== request.resultRequestId ||
        !batch.result.failed
      )
        return error('No failed items are available for this batch.')
      busy = true
      revision++
      reviewed = null
      try {
        const response = await recoverBatch(host, batch, request.requestId)
        snapshot = response.preview
        recovering = true
        completed = false
        return response
      } catch (cause) {
        return error(cause instanceof Error ? cause.message : 'Could not recover the batch.')
      } finally {
        busy = false
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
        if (
          recovering &&
          (request.destination.kind !== 'existing' ||
            request.destination.id !== batch?.result.collectionId)
        )
          return error(
            'Recovery must use the original collection. Start a new batch to choose another destination.',
          )
        const result = reviewDestination(source, request, target)
        reviewArtifacts(result, target.variables, artifacts)
        if (recovering)
          for (const row of result.rows) {
            const unavailable = source.skipped.find(({ id }) => id === row.id)
            if (row.included && unavailable) {
              row.status = 'invalid'
              row.message = unavailable.reason
              result.canCreate = false
            }
          }
        finalizeReview(result)
        reviewed = {
          result,
          request,
          target: destinationFingerprint(target.collection),
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
      const included = new Set(
        destination.result.rows.filter(({ included }) => included).map(({ id }) => id),
      )
      const expected = recovering
        ? { ...source, swatches: source.swatches.filter(({ id }) => included.has(id)), skipped: [] }
        : source
      const current = recovering
        ? await readSources(host, expected, source.requestId)
        : preview({ type: 'preview-selection', requestId: source.requestId })
      if (JSON.stringify(current) !== JSON.stringify(expected))
        return error('Sources or selection changed. Refresh the selection and review again.')
      const checked = reviewDestination(source, destination.request, target)
      reviewArtifacts(checked, target.variables, artifacts)
      finalizeReview(checked)
      const targetKey = destinationFingerprint(target.collection)
      if (
        !checked.canCreate ||
        targetKey !== destination.target ||
        JSON.stringify(checked.rows) !== JSON.stringify(destination.result.rows)
      )
        return error(
          checked.collectionError || 'Destination changed. Review the destination again.',
        )
      const written = writeCollection(
        host,
        source,
        checked,
        request.requestId,
        target.collection,
        target.variables.length > 0,
        target.variables,
        artifacts,
      )
      const result = accumulateResult(written, recovering ? batch?.result : undefined)
      batch = {
        result,
        source,
        request: destination.request,
      }
      completed = true
      try {
        host.notify(
          `${result.created} created · ${result.failed} failed · ${result.updated} updated · ${result.excluded} excluded · ${result.unsupported} unsupported`,
        )
      } catch {
        /* Writes remain complete if notification fails. */
      }
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
