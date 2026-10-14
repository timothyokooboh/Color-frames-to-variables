export interface PaintColor {
  r: number
  g: number
  b: number
  a: number
}

export interface SourceSwatch {
  id: string
  name: string
  color: PaintColor
  hidden: boolean
  nodeOpacity: number
}

export interface SkippedLayer {
  id: string
  name: string
  reason: string
}

export interface PreviewRequest {
  type: 'preview-selection'
  requestId: number
}
export interface PreviewResult {
  type: 'preview-result'
  requestId: number
  swatches: SourceSwatch[]
  skipped: SkippedLayer[]
}
export interface PreviewError {
  type: 'preview-error'
  requestId: number
  message: string
}
export type PreviewResponse = PreviewResult | PreviewError

export { isPreviewRequest, isPreviewResponse } from './validation'
export type * from './creation'
export { isCollectionRequest, isCollectionResponse } from './creation-validation'
