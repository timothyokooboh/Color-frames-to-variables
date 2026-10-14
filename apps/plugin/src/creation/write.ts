import type { CollectionReview, CreationResult, PreviewResult } from '@color-frames/contracts'

export function writeCollection(
  host: PluginAPI,
  snapshot: PreviewResult,
  review: CollectionReview,
  requestId: number,
  existing?: VariableCollection,
  hasVariables = false,
): CreationResult {
  const collection = existing ?? host.variables.createVariableCollection(review.collectionName)
  const result: CreationResult = {
    type: 'creation-result',
    requestId,
    collectionName: collection.name,
    collectionId: collection.id,
    collectionEmpty: !hasVariables,
    created: 0,
    failed: 0,
    excluded: review.rows.filter((item) => !item.included).length,
    unsupported: snapshot.skipped.length,
    errors: [],
  }
  for (const item of review.rows.filter((item) => item.included)) {
    const swatch = snapshot.swatches.find(({ id }) => id === item.id)!
    let variable: Variable | undefined
    try {
      variable = host.variables.createVariable(item.fullPath, collection, 'COLOR')
      variable.setValueForMode(collection.defaultModeId, swatch.color)
      result.created++
      result.collectionEmpty = false
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Could not create this variable.'
      try {
        variable?.remove()
      } catch {
        result.collectionEmpty = false
        message +=
          ' An incomplete variable remains in the collection; inspect it before another batch.'
      }
      result.failed++
      result.errors.push({ id: swatch.id, name: item.fullPath, message })
    }
  }
  try {
    host.notify(
      `${result.created} created · ${result.failed} failed · ${result.excluded} excluded · ${result.unsupported} unsupported`,
    )
  } catch {
    /* Completed writes remain successful if notification fails. */
  }
  return result
}
