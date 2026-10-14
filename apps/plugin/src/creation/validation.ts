import type {
  CollectionReview,
  PreviewResult,
  ProposedItem,
  ReviewedItem,
} from '@color-frames/contracts'

export function reviewNames(
  snapshot: PreviewResult,
  collectionName: string,
  existingNames: string[],
  requestId: number,
  items?: ProposedItem[],
  prefix = false,
): CollectionReview {
  const proposals =
    items ?? snapshot.swatches.map(({ id, name }) => ({ id, relativeName: name, included: true }))
  const ids = new Set(proposals.map(({ id }) => id))
  if (
    ids.size !== proposals.length ||
    proposals.length !== snapshot.swatches.length ||
    snapshot.swatches.some(({ id }) => !ids.has(id))
  )
    throw new Error('The proposed items do not match the preview. Refresh the selection.')
  const path = (name: string) => (prefix && !name.startsWith('Colors/') ? `Colors/${name}` : name)
  const counts = new Map<string, number>()
  for (const item of proposals)
    if (item.included)
      counts.set(path(item.relativeName), (counts.get(path(item.relativeName)) ?? 0) + 1)
  const rows: ReviewedItem[] = proposals.map((item) => {
    const name = item.relativeName
    const status = !item.included
      ? 'excluded'
      : !name.trim() || name.split('/').some((segment) => !segment.trim())
        ? 'invalid'
        : (counts.get(path(name)) ?? 0) > 1
          ? 'duplicate'
          : 'ready'
    const message =
      status === 'invalid'
        ? 'Enter a name with no empty slash segments.'
        : status === 'duplicate'
          ? 'Duplicate variable path. Rename or exclude the affected items.'
          : ''
    return { ...item, fullPath: path(name), status, message }
  })
  const collectionError = !collectionName.trim()
    ? 'Enter a collection name.'
    : existingNames.includes(collectionName)
      ? 'A local collection with this name already exists.'
      : ''
  return finalizeReview({
    type: 'collection-review',
    requestId,
    collectionName,
    issues: [],
    rows,
    collectionError,
    canCreate: false,
  })
}

export function finalizeReview(review: CollectionReview) {
  review.issues = review.rows
    .filter(({ message }) => message)
    .map(({ id, message }) => ({ id, message }))
  review.canCreate =
    review.rows.some(({ included }) => included) && !review.issues.length && !review.collectionError
  return review
}
