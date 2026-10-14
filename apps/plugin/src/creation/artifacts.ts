import type { CollectionReview } from '@color-frames/contracts'
export interface AllocationArtifact {
  id: string
  name: string
  fingerprint: string
}
export function artifactFingerprint(variable: Variable) {
  return JSON.stringify([variable.id, variable.name, variable.resolvedType, variable.valuesByMode])
}
export function reviewArtifacts(
  review: CollectionReview,
  variables: Variable[],
  artifacts: Map<string, AllocationArtifact>,
) {
  for (const [sourceId, artifact] of artifacts)
    if (!variables.some(({ id }) => id === artifact.id)) artifacts.delete(sourceId)
  for (const row of review.rows) {
    const artifact = artifacts.get(row.id)
    const variable = artifact && variables.find(({ id }) => id === artifact.id)
    if (
      row.included &&
      variable &&
      row.fullPath === variable.name &&
      row.status === 'conflict' &&
      artifactFingerprint(variable) === artifact.fingerprint
    ) {
      row.status = 'ready'
      row.operation = 'recover'
      row.recoveryVariableId = variable.id
      row.conflict = undefined
      row.message = ''
    }
  }
}
