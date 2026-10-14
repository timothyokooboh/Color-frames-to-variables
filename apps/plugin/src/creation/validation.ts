import type { CollectionReview, PreviewResult } from '@color-frames/contracts'

export function reviewNames(
  snapshot: PreviewResult,
  collectionName: string,
  existingNames: string[],
  requestId: number,
): CollectionReview {
  const counts = new Map<string, number>()
  for (const swatch of snapshot.swatches)
    counts.set(swatch.name, (counts.get(swatch.name) ?? 0) + 1)
  const issues = snapshot.swatches.flatMap(({ id, name }) => {
    const message = !name.trim()
      ? 'Name cannot be blank.'
      : name.split('/').some((segment) => !segment.trim())
        ? 'Name contains an empty slash segment.'
        : (counts.get(name) ?? 0) > 1
          ? 'Duplicate variable path. Rename the source layers and refresh.'
          : ''
    return message ? [{ id, message }] : []
  })
  const collectionError = !collectionName.trim()
    ? 'Enter a collection name.'
    : existingNames.includes(collectionName)
      ? 'A local collection with this name already exists.'
      : ''
  return {
    type: 'collection-review',
    requestId,
    collectionName,
    issues,
    collectionError,
    canCreate: snapshot.swatches.length > 0 && !issues.length && !collectionError,
  }
}
