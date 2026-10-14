import { createPreviewController } from './preview/controller'

const handle = createPreviewController(figma)
figma.ui.onmessage = (message: unknown) => {
  const response = handle(message)
  if (response) figma.ui.postMessage(response)
}
figma.showUI(__html__, { width: 440, height: 560, themeColors: true })
