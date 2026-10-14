import type { CreationResult, PreviewResult } from '@color-frames/contracts'

export function writeCollection(
  host: PluginAPI,
  snapshot: PreviewResult,
  name: string,
  requestId: number,
): CreationResult {
  const collection = host.variables.createVariableCollection(name)
  const result: CreationResult = {
    type: 'creation-result',
    requestId,
    collectionName: collection.name,
    collectionId: collection.id,
    collectionEmpty: true,
    created: 0,
    failed: 0,
    unsupported: snapshot.skipped.length,
    errors: [],
  }
  for (const swatch of snapshot.swatches) {
    let variable: Variable | undefined
    try {
      variable = host.variables.createVariable(swatch.name, collection, 'COLOR')
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
      result.errors.push({ id: swatch.id, name: swatch.name, message })
    }
  }
  try {
    host.notify(
      `${result.created} created · ${result.failed} failed · ${result.unsupported} unsupported`,
    )
  } catch {
    /* Completed writes remain successful if notification fails. */
  }
  return result
}
