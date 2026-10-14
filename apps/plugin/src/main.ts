import { createCollectionController } from './creation/controller'

const handle = createCollectionController(figma)
figma.ui.onmessage = async (message: unknown) => {
  const response = await handle(message)
  if (response) figma.ui.postMessage(response)
}
figma.showUI(__html__, { width: 440, height: 560, themeColors: true })
