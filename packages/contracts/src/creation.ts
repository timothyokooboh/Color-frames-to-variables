export type Destination = { kind: 'new'; name: string } | { kind: 'existing'; id: string }
export interface CollectionOption {
  id: string
  name: string
}
export interface ListCollectionsRequest {
  type: 'list-collections'
  requestId: number
}
export interface CollectionOptions {
  type: 'collection-options'
  requestId: number
  collections: CollectionOption[]
}
export interface ProposedItem {
  id: string
  relativeName: string
  included: boolean
}
export interface ReviewedItem extends ProposedItem {
  fullPath: string
  status: 'ready' | 'excluded' | 'invalid' | 'duplicate' | 'conflict'
  message: string
}
export interface ReviewCollectionRequest {
  type: 'review-collection'
  requestId: number
  previewRequestId: number
  destination: Destination
  items?: ProposedItem[]
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
  rows: ReviewedItem[]
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
  excluded: number
  unsupported: number
  errors: { id: string; name: string; message: string }[]
}
export interface CreationError {
  type: 'creation-error'
  requestId: number
  message: string
}
export type CollectionRequest =
  ReviewCollectionRequest | CreateCollectionRequest | ListCollectionsRequest
export type CollectionResponse =
  CollectionReview | CreationResult | CreationError | CollectionOptions
