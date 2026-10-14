let sequence = 0
export function nextRequestId() {
  return ++sequence
}
export function readPluginMessage(event: MessageEvent<unknown>): unknown {
  // Figma relays through an ancestor, not necessarily window.parent.
  if (event.origin !== 'https://www.figma.com' && event.origin !== 'https://figma.com') return null
  return typeof event.data === 'object' && event.data !== null
    ? Reflect.get(event.data, 'pluginMessage')
    : null
}
