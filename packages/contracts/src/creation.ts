export interface ReviewCollectionRequest {
  type: 'review-collection'
  requestId: number
  previewRequestId: number
  collectionName: string
}
export interface CreateCollectionRequest {
  type: 'create-collection'
  requestId: number
  reviewRequestId: number
}
export interface NameIssue {
  id: string
  message: string
}
export interface CollectionReview {
  type: 'collection-review'
  requestId: number
  collectionName: string
  issues: NameIssue[]
  collectionError: string
  canCreate: boolean
}
export interface CreationResult {
  type: 'creation-result'
  requestId: number
  collectionName: string
  collectionEmpty: boolean
  collectionId: string
  created: number
  failed: number
  unsupported: number
  errors: { id: string; name: string; message: string }[]
}
export interface CreationError {
  type: 'creation-error'
  requestId: number
  message: string
}
export type CollectionRequest = ReviewCollectionRequest | CreateCollectionRequest
export type CollectionResponse = CollectionReview | CreationResult | CreationError
