import type { PaintColor } from '@color-frames/contracts'

export async function readDefaultColor(
  host: PluginAPI,
  variable: Variable,
  collections: VariableCollection[],
  variables: Variable[],
  visited = new Set<string>(),
): Promise<{ color: PaintColor | null; fingerprint: string }> {
  if (visited.has(variable.id)) return { color: null, fingerprint: 'cycle' }
  visited.add(variable.id)
  const collection =
    collections.find(({ id }) => id === variable.variableCollectionId) ??
    (await host.variables.getVariableCollectionByIdAsync(variable.variableCollectionId))
  const mode = collection?.defaultModeId
  const value = mode ? variable.valuesByMode[mode] : undefined
  const fingerprint = JSON.stringify([variable.id, variable.resolvedType, mode, value])
  if (variable.resolvedType !== 'COLOR' || !value || typeof value !== 'object')
    return { color: null, fingerprint }
  if ('r' in value)
    return {
      color: { ...value, a: 'a' in value && typeof value.a === 'number' ? value.a : 1 },
      fingerprint,
    }
  if (
    !('type' in value) ||
    value.type !== 'VARIABLE_ALIAS' ||
    !('id' in value) ||
    typeof value.id !== 'string'
  )
    return { color: null, fingerprint }
  const referenced =
    variables.find(({ id }) => id === value.id) ??
    (await host.variables.getVariableByIdAsync(value.id))
  if (!referenced) return { color: null, fingerprint }
  const resolved = await readDefaultColor(host, referenced, collections, variables, visited)
  return { color: resolved.color, fingerprint: fingerprint + resolved.fingerprint }
}
