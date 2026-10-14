import type { Destination, ReviewCollectionRequest, PreviewResult } from '@color-frames/contracts'
import { readDefaultColor } from './color-value'
import { reviewNames, finalizeReview } from './validation'

export async function inspectDestination(host: PluginAPI, destination: Destination) {
  const collections = await host.variables.getLocalVariableCollectionsAsync()
  const collection =
    destination.kind === 'existing'
      ? collections.find(({ id }) => id === destination.id)
      : undefined
  if (destination.kind === 'existing' && !collection)
    throw new Error(
      'The destination was deleted. Refresh collections and select a destination again.',
    )
  const allVariables = collection ? await host.variables.getLocalVariablesAsync() : []
  const variables = allVariables.filter(
    (variable) => variable.variableCollectionId === collection?.id,
  )
  const colors = new Map(
    await Promise.all(
      variables.map(
        async (variable) =>
          [variable.id, await readDefaultColor(host, variable, collections, allVariables)] as const,
      ),
    ),
  )
  return { collection, variables, collections, colors }
}

export function reviewDestination(
  snapshot: PreviewResult,
  request: ReviewCollectionRequest,
  target: Awaited<ReturnType<typeof inspectDestination>>,
) {
  const name =
    request.destination.kind === 'new' ? request.destination.name : target.collection!.name
  const result = reviewNames(
    snapshot,
    name,
    request.destination.kind === 'new' ? target.collections.map(({ name }) => name) : [],
    request.requestId,
    request.items,
    name !== 'Colors',
  )
  const byPath = new Map(target.variables.map((variable) => [variable.name, variable]))
  for (const row of result.rows) {
    const conflict = byPath.get(row.fullPath)
    if (row.status === 'ready' && conflict && target.collection) {
      const source = snapshot.swatches.find(({ id }) => id === row.id)!
      const value = conflict.valuesByMode[target.collection.defaultModeId]
      const resolved = target.colors.get(conflict.id)
      const existingColor = resolved?.color ?? null
      const token = JSON.stringify([
        conflict.id,
        conflict.resolvedType,
        conflict.name,
        target.collection.id,
        target.collection.name,
        target.collection.defaultModeId,
        value,
        resolved?.fingerprint,
        source,
      ])
      row.conflict = {
        token,
        variableId: conflict.id,
        canOverwrite:
          conflict.resolvedType === 'COLOR' &&
          existingColor !== null &&
          target.variables.filter(({ name }) => name === row.fullPath).length === 1,
        existingColor,
        proposedColor: source.color,
      }
      if (row.conflict.canOverwrite && row.overwriteToken === token) {
        row.operation = 'update'
      } else {
        row.status = 'conflict'
        row.message =
          conflict.resolvedType === 'COLOR'
            ? 'Review the existing color, then approve this overwrite or rename or exclude the item.'
            : `An existing ${conflict.resolvedType} variable uses this path. Rename or exclude this item.`
      }
    }
  }
  return finalizeReview(result)
}
