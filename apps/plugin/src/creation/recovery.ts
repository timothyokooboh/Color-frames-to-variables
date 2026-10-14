import type {
  CreationResult,
  PreviewResult,
  ReviewCollectionRequest,
  RecoveryPreview,
} from '@color-frames/contracts'
import { createPreviewController } from '../preview/controller'

export interface CompletedBatch {
  result: CreationResult
  source: PreviewResult
  request: ReviewCollectionRequest
}

export async function readSources(host: PluginAPI, source: PreviewResult, requestId: number) {
  const nodes = await Promise.all(source.swatches.map(({ id }) => host.getNodeByIdAsync(id)))
  const selection = nodes.filter(
    (node): node is SceneNode => node !== null && node.type !== 'DOCUMENT' && node.type !== 'PAGE',
  )
  const result = createPreviewController({ mixed: host.mixed, currentPage: { selection } })({
    type: 'preview-selection',
    requestId,
  })
  if (result?.type !== 'preview-result') throw new Error('Could not reread failed sources.')
  return result
}

export async function recoverBatch(
  host: PluginAPI,
  batch: CompletedBatch,
  requestId: number,
): Promise<RecoveryPreview> {
  const ids = new Set(batch.result.errors.map(({ id }) => id))
  const source = {
    ...batch.source,
    swatches: batch.source.swatches.filter(({ id }) => ids.has(id)),
    skipped: [],
  }
  const preview = await readSources(host, source, requestId)
  // Retain unavailable rows so the designer can see and intentionally exclude them.
  const current = new Map(preview.swatches.map((swatch) => [swatch.id, swatch]))
  preview.swatches = source.swatches.map((swatch) => current.get(swatch.id) ?? swatch)
  for (const swatch of source.swatches)
    if (!current.has(swatch.id) && !preview.skipped.some(({ id }) => id === swatch.id))
      preview.skipped.push({ id: swatch.id, name: swatch.name, reason: 'Source no longer exists.' })
  const proposed =
    batch.request.items ??
    batch.source.swatches.map(({ id, name }) => ({ id, relativeName: name, included: true }))
  return {
    type: 'recovery-preview',
    requestId,
    preview,
    items: proposed
      .filter(({ id }) => ids.has(id))
      .map(({ id, relativeName }) => ({ id, relativeName, included: true })),
    destination: { kind: 'existing', id: batch.result.collectionId },
    previous: batch.result,
  }
}

export function accumulateResult(
  result: CreationResult,
  previous?: CreationResult,
): CreationResult {
  return {
    ...result,
    created: result.created + (previous?.created ?? 0),
    updated: result.updated + (previous?.updated ?? 0),
    excluded: result.excluded + (previous?.excluded ?? 0),
    unsupported: previous?.unsupported ?? result.unsupported,
  }
}
