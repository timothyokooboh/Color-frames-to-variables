import { createCollectionController } from './controller'
export function environment(count = 45) {
  const selection = Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: i === 0 ? 'Brand 100' : `Brand/${i}`,
    type: 'FRAME',
    visible: true,
    opacity: 0.2,
    fills: [{ type: 'SOLID', color: { r: 0.123456789, g: 0.5, b: 1 }, opacity: 0.4 }],
  }))
  const collections: { id: string; name: string; defaultModeId: string }[] = []
  const variables: {
    id?: string
    variableCollectionId?: string
    name: string
    mode?: string
    value?: unknown
    valuesByMode?: Record<string, unknown>
    type: string
  }[] = []
  const notifications: string[] = []
  let variableId = 0
  const host = {
    currentPage: { selection },
    mixed: Symbol('mixed'),
    async getNodeByIdAsync(id: string) {
      return selection.find((node) => node.id === id) ?? null
    },
    variables: {
      async getLocalVariableCollectionsAsync() {
        return collections
      },
      async getLocalVariablesAsync() {
        return variables.map((variable, i) => ({
          ...variable,
          id: variable.id ?? String(i),
          resolvedType: variable.type,
          setValueForMode(mode: string, value: unknown) {
            variable.valuesByMode = { ...variable.valuesByMode, [mode]: value }
          },
          valuesByMode:
            variable.valuesByMode ?? (variable.mode ? { [variable.mode]: variable.value } : {}),
        }))
      },
      createVariableCollection(name: string) {
        const collection = {
          id: `collection-${collections.length}`,
          name,
          defaultModeId: 'default',
        }
        collections.push(collection)
        return collection
      },
      createVariable(name: string, _collection: unknown, type: string) {
        const variable = {
          id: `allocated-${++variableId}`,
          name,
          type,
          variableCollectionId: (_collection as { id: string }).id,
        } as (typeof variables)[number]
        variables.push(variable)
        return {
          id: variable.id!,
          name,
          resolvedType: type,
          get valuesByMode() {
            return (
              variable.valuesByMode ?? (variable.mode ? { [variable.mode]: variable.value } : {})
            )
          },
          setValueForMode(mode: string, value: unknown) {
            variable.mode = mode
            variable.value = value
          },
          remove() {
            variables.splice(variables.indexOf(variable), 1)
          },
        }
      },
    },
    notify(message: string) {
      notifications.push(message)
    },
  }
  const handle = createCollectionController(host as unknown as PluginAPI)
  return { host, handle, selection, collections, variables, notifications }
}

export async function review(env: ReturnType<typeof environment>, collectionName = 'Colors') {
  await env.handle({ type: 'preview-selection', requestId: 1 })
  return env.handle({
    type: 'review-collection',
    requestId: 2,
    previewRequestId: 1,
    destination: { kind: 'new', name: collectionName },
  })
}
