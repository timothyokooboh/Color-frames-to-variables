import type { Destination, ReviewCollectionRequest, PreviewResult } from '@color-frames/contracts'
import { reviewNames } from './validation'

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
  const variables = collection
    ? (await host.variables.getLocalVariablesAsync()).filter(
        (variable) => variable.variableCollectionId === collection.id,
      )
    : []
  return { collection, variables, collections }
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
    request.destination.kind === 'existing' && name !== 'Colors',
  )
  const byPath = new Map(target.variables.map((variable) => [variable.name, variable]))
  for (const row of result.rows) {
    const conflict = byPath.get(row.fullPath)
    if (row.status === 'ready' && conflict) {
      row.status = 'conflict'
      row.message = `An existing ${conflict.resolvedType} variable uses this path. Rename or exclude this item; overwriting is unavailable.`
    }
  }
  result.issues = result.rows
    .filter(({ message }) => message)
    .map(({ id, message }) => ({ id, message }))
  result.canCreate = result.canCreate && !result.issues.length
  return result
}
