import { artifactFingerprint, type AllocationArtifact } from './artifacts'
import type { CollectionReview, CreationResult, PreviewResult } from '@color-frames/contracts'

export function writeCollection(
  host: PluginAPI,
  snapshot: PreviewResult,
  review: CollectionReview,
  requestId: number,
  existing?: VariableCollection,
  hasVariables = false,
  targets: Variable[] = [],
  artifacts = new Map<string, AllocationArtifact>(),
): CreationResult {
  const collection = existing ?? host.variables.createVariableCollection(review.collectionName)
  const result: CreationResult = {
    type: 'creation-result',
    requestId,
    collectionName: collection.name,
    collectionId: collection.id,
    collectionEmpty: !hasVariables,
    created: 0,
    updated: 0,
    failed: 0,
    excluded: review.rows.filter((item) => !item.included).length,
    unsupported: snapshot.skipped.length,
    errors: [],
  }
  for (const item of review.rows.filter((item) => item.included)) {
    const swatch = snapshot.swatches.find(({ id }) => id === item.id)!
    let variable: Variable | undefined
    try {
      if (item.operation === 'update' || item.operation === 'recover') {
        const target = targets.find(
          ({ id }) => id === (item.recoveryVariableId ?? item.conflict?.variableId),
        )
        if (!target) throw new Error('The reviewed target no longer exists.')
        target.setValueForMode(collection.defaultModeId, swatch.color)
        if (item.operation === 'update') result.updated++
        else result.created++
        artifacts.delete(item.id)
        result.collectionEmpty = false
        continue
      }
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
        if (variable)
          artifacts.set(item.id, {
            id: variable.id,
            name: variable.name,
            fingerprint: artifactFingerprint(variable),
          })
        message +=
          ' An incomplete variable remains in the collection; inspect it before another batch.'
      }
      result.failed++
      result.errors.push({ id: swatch.id, name: item.fullPath, message })
    }
  }
  result.warnings = [...artifacts.values()].map(({ id, name }) => ({
    id,
    name,
    message:
      'A previously incomplete variable remains in this collection. Inspect it before another batch.',
  }))
  return result
}
