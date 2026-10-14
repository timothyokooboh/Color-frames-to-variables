import { expect, it } from 'vitest'
import { environment } from './test-environment'

it('lists distinct collection IDs and writes exact or prefixed paths according to the chosen destination', async () => {
  for (const name of ['Colors', 'Primitives', 'Design Tokens']) {
    const env = environment(2)
    env.selection[0]!.name = 'Brand/100'
    env.selection[1]!.name = 'Colors/Brand/200'
    env.collections.push(
      { id: 'chosen', name, defaultModeId: 'light' },
      { id: 'other', name, defaultModeId: 'other' },
    )
    env.variables.push({
      id: 'unrelated',
      name: 'Spacing/100',
      type: 'FLOAT',
      variableCollectionId: 'chosen',
      valuesByMode: { light: 4, dark: 8 },
    })
    expect(await env.handle({ type: 'list-collections', requestId: 1 })).toMatchObject({
      type: 'collection-options',
      collections: [
        { id: 'chosen', name },
        { id: 'other', name },
      ],
    })
    await env.handle({ type: 'preview-selection', requestId: 2 })
    const result = await env.handle({
      type: 'review-collection',
      requestId: 3,
      previewRequestId: 2,
      destination: { kind: 'existing', id: 'chosen' },
    })
    expect(result).toMatchObject({
      canCreate: true,
      rows: [
        { fullPath: name === 'Colors' ? 'Brand/100' : 'Colors/Brand/100' },
        { fullPath: 'Colors/Brand/200' },
      ],
    })
    expect(
      await env.handle({ type: 'create-collection', requestId: 4, reviewRequestId: 3 }),
    ).toMatchObject({ created: 2, collectionId: 'chosen' })
    expect(env.collections).toHaveLength(2)
    expect(env.variables[0]?.valuesByMode).toEqual({ light: 4, dark: 8 })
    expect(env.variables[1]).toMatchObject({
      name: name === 'Colors' ? 'Brand/100' : 'Colors/Brand/100',
      variableCollectionId: 'chosen',
      mode: 'light',
    })
    expect(env.variables[2]?.name).toBe('Colors/Brand/200')
  }
})

it('blocks COLOR and incompatible conflicts, resolves by skipping or renaming, and never overwrites', async () => {
  const env = environment(3)
  env.selection[0]!.name = 'Brand/100'
  env.selection[1]!.name = 'Brand/200'
  env.selection[2]!.name = 'Colors/Brand/200'
  env.collections.push({ id: 'target', name: 'Primitives', defaultModeId: 'default' })
  env.variables.push(
    {
      name: 'Colors/Brand/100',
      type: 'COLOR',
      variableCollectionId: 'target',
      valuesByMode: { default: { r: 0, g: 0, b: 0 }, dark: { r: 1, g: 1, b: 1 } },
    },
    {
      name: 'Colors/Brand/200',
      type: 'FLOAT',
      variableCollectionId: 'target',
      valuesByMode: { default: 4 },
    },
  )
  const original = JSON.stringify(env.variables)
  await env.handle({ type: 'preview-selection', requestId: 1 })
  const command = {
    type: 'review-collection',
    requestId: 2,
    previewRequestId: 1,
    destination: { kind: 'existing', id: 'target' },
  }
  expect(await env.handle(command)).toMatchObject({
    canCreate: false,
    rows: [
      { status: 'conflict', conflict: { canOverwrite: true } },
      { status: 'duplicate' },
      { status: 'duplicate' },
    ],
  })
  expect(
    await env.handle({
      ...command,
      requestId: 3,
      items: [
        { id: '0', relativeName: 'Brand/100', included: false },
        { id: '1', relativeName: 'Brand/200', included: true },
        { id: '2', relativeName: 'Brand/300', included: true },
      ],
    }),
  ).toMatchObject({
    canCreate: false,
    rows: [
      { status: 'excluded' },
      { status: 'conflict', message: expect.stringContaining('FLOAT') },
      { status: 'ready' },
    ],
  })
  await env.handle({
    ...command,
    requestId: 4,
    items: [
      { id: '0', relativeName: 'Brand/100', included: false },
      { id: '1', relativeName: 'Brand/200', included: false },
      { id: '2', relativeName: 'Brand/300', included: true },
    ],
  })
  expect(
    await env.handle({ type: 'create-collection', requestId: 5, reviewRequestId: 4 }),
  ).toMatchObject({ created: 1, excluded: 2 })
  expect(JSON.stringify(env.variables.slice(0, 2))).toBe(original)
  expect(env.variables[2]?.name).toBe('Colors/Brand/300')
})

it('stops writes when the destination is deleted, renamed, changes default mode, or gains a conflict', async () => {
  for (const change of ['deleted', 'renamed', 'mode', 'conflict']) {
    const env = environment(1)
    env.collections.push({ id: 'target', name: 'Primitives', defaultModeId: 'light' })
    await env.handle({ type: 'preview-selection', requestId: 1 })
    const command = {
      type: 'review-collection',
      requestId: 2,
      previewRequestId: 1,
      destination: { kind: 'existing', id: 'target' },
    }
    expect(await env.handle(command)).toMatchObject({ canCreate: true })
    if (change === 'deleted') env.collections.splice(0)
    if (change === 'renamed') env.collections[0]!.name = 'Colors'
    if (change === 'mode') env.collections[0]!.defaultModeId = 'dark'
    if (change === 'conflict')
      env.variables.push({
        name: 'Colors/Brand 100',
        type: 'COLOR',
        variableCollectionId: 'target',
        value: { r: 0, g: 0, b: 0 },
      })
    const before = JSON.stringify(env.variables)
    expect(
      await env.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 }),
    ).toMatchObject({ type: 'creation-error' })
    expect(JSON.stringify(env.variables)).toBe(before)
    expect(
      await env.handle({ type: 'create-collection', requestId: 4, reviewRequestId: 2 }),
    ).toMatchObject({ type: 'creation-error' })
  }
})

it('uses the same name-based paths for new collections without duplicating Colors prefixes', async () => {
  for (const name of ['Colors', 'testing', 'colors']) {
    const env = environment(2)
    env.selection[0]!.name = 'Brand/100'
    env.selection[1]!.name = 'Colors/Brand/200'
    await env.handle({ type: 'preview-selection', requestId: 1 })
    expect(
      await env.handle({
        type: 'review-collection',
        requestId: 2,
        previewRequestId: 1,
        destination: { kind: 'new', name },
      }),
    ).toMatchObject({
      canCreate: true,
      rows: [
        { fullPath: name === 'Colors' ? 'Brand/100' : 'Colors/Brand/100' },
        { fullPath: 'Colors/Brand/200' },
      ],
    })
    expect(
      await env.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 }),
    ).toMatchObject({ created: 2 })
    expect(env.variables.map((v) => v.name)).toEqual([
      name === 'Colors' ? 'Brand/100' : 'Colors/Brand/100',
      'Colors/Brand/200',
    ])
    expect(env.selection.map((n) => n.name)).toEqual(['Brand/100', 'Colors/Brand/200'])
  }
})
