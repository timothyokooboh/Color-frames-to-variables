import { createCollectionController } from '../creation/controller'
import type { Destination, ProposedItem } from '@color-frames/contracts'

export function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message)
}
export function swatch(name: string, index = 0) {
  const node = figma.createRectangle()
  node.name = name
  node.x = (index % 10) * 110
  node.y = Math.floor(index / 10) * 110
  node.fills = [{ type: 'SOLID', color: { r: 0.125, g: 0.5, b: 1 }, opacity: 0.4 }]
  node.opacity = 0.2
  return node
}
export function session() {
  const handle = createCollectionController(figma)
  let id = 0
  let previewId = 0
  let reviewId = 0
  return {
    handle,
    async preview(nodes: SceneNode[]) {
      figma.currentPage.selection = nodes
      previewId = ++id
      const response = await handle({ type: 'preview-selection', requestId: previewId })
      check(response?.type === 'preview-result', 'Expected preview')
      return response
    },
    async review(destination: Destination, items?: ProposedItem[]) {
      reviewId = ++id
      const response = await handle({
        type: 'review-collection',
        requestId: reviewId,
        previewRequestId: previewId,
        destination,
        ...(items ? { items } : {}),
      })
      check(response?.type === 'collection-review', 'Expected review')
      return response
    },
    write() {
      return handle({ type: 'create-collection', requestId: ++id, reviewRequestId: reviewId })
    },
  }
}
export async function variables(collectionId: string) {
  return (await figma.variables.getLocalVariablesAsync()).filter(
    (v) => v.variableCollectionId === collectionId,
  )
}
export function sourceState(nodes: RectangleNode[]) {
  return JSON.stringify(nodes.map((n) => [n.id, n.name, n.fills, n.opacity]))
}
