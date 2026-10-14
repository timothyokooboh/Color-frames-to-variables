import { isPreviewRequest, type PreviewResponse, type PreviewResult } from '@color-frames/contracts'

export function createPreviewController(host: {
  currentPage: Pick<PageNode, 'selection'>
  mixed: PluginAPI['mixed']
}) {
  return (request: unknown): PreviewResponse | null => {
    if (!isPreviewRequest(request)) return null
    try {
      const result: PreviewResult = {
        type: 'preview-result',
        requestId: request.requestId,
        swatches: [],
        skipped: [],
      }
      for (const node of host.currentPage.selection) {
        const skip = (reason: string) =>
          result.skipped.push({ id: node.id, name: node.name, reason })
        if (node.type !== 'FRAME' && node.type !== 'RECTANGLE') {
          skip(`Unsupported layer type: ${node.type}. Select a frame or rectangle.`)
          continue
        }
        if (node.fills === host.mixed) {
          skip('Mixed fills are not supported.')
          continue
        }
        const paints = node.fills.filter((paint) => paint.visible !== false)
        const paint = paints[0]
        if (!paint) {
          skip('No visible fills.')
          continue
        }
        if (paints.length !== 1) {
          skip('Multiple visible fills. Use exactly one solid fill.')
          continue
        }
        if (paint.type !== 'SOLID') {
          skip(
            paint.type === 'IMAGE'
              ? 'Image fills are not supported.'
              : paint.type.startsWith('GRADIENT')
                ? 'Gradient fills are not supported.'
                : 'Only solid fills are supported.',
          )
          continue
        }
        result.swatches.push({
          id: node.id,
          name: node.name,
          color: { ...paint.color, a: paint.opacity ?? 1 },
          hidden: !node.visible,
          nodeOpacity: node.opacity,
        })
      }
      return result
    } catch {
      return {
        type: 'preview-error',
        requestId: request.requestId,
        message: 'Could not read the selection. Please try again.',
      }
    }
  }
}
