import { expect, it } from 'vitest'
import { environment } from './test-environment'

it('requires individual reviewed consent and writes 40 created, 3 updated, 2 excluded without touching other modes', async () => {
  const env = environment(45)
  env.collections.push({ id: 'colors', name: 'Colors', defaultModeId: 'light' })
  for (let i = 0; i < 5; i++)
    env.variables.push({
      id: `v${i}`,
      name: env.selection[i]!.name,
      type: 'COLOR',
      variableCollectionId: 'colors',
      valuesByMode: { light: { r: 0, g: 0, b: 0, a: 1 }, dark: { r: 1, g: 1, b: 1, a: 1 } },
    })
  await env.handle({ type: 'preview-selection', requestId: 1 })
  const command = {
    type: 'review-collection',
    requestId: 2,
    previewRequestId: 1,
    destination: { kind: 'existing', id: 'colors' },
  }
  const review = await env.handle(command)
  expect(review).toMatchObject({
    canCreate: false,
    rows: expect.arrayContaining([
      expect.objectContaining({
        conflict: expect.objectContaining({
          canOverwrite: true,
          existingColor: { r: 0, g: 0, b: 0, a: 1 },
        }),
      }),
    ]),
  })
  if (review?.type !== 'collection-review') throw new Error('Missing review')
  const items = review.rows.map((row, i) => ({
    id: row.id,
    relativeName: row.relativeName,
    included: i !== 3 && i !== 4,
    overwriteToken: i < 3 ? row.conflict?.token : undefined,
  }))
  expect(await env.handle({ ...command, requestId: 3, items })).toMatchObject({ canCreate: true })
  expect(
    await env.handle({ type: 'create-collection', requestId: 4, reviewRequestId: 3 }),
  ).toMatchObject({ created: 40, updated: 3, excluded: 2, failed: 0 })
  expect(env.variables).toHaveLength(45)
  expect(env.variables[0]?.valuesByMode).toEqual({
    light: { r: 0.123456789, g: 0.5, b: 1, a: 0.4 },
    dark: { r: 1, g: 1, b: 1, a: 1 },
  })
})

it('invalidates overwrite consent when reviewed target or source data changes, including deleted targets', async () => {
  for (const change of ['deleted', 'identity', 'type', 'path', 'mode', 'value', 'source']) {
    const env = environment(1)
    env.collections.push({ id: 'colors', name: 'Colors', defaultModeId: 'light' })
    env.variables.push({
      id: 'target',
      name: 'Brand 100',
      type: 'COLOR',
      variableCollectionId: 'colors',
      valuesByMode: { light: { r: 0, g: 0, b: 0, a: 1 } },
    })
    await env.handle({ type: 'preview-selection', requestId: 1 })
    const command = {
      type: 'review-collection',
      requestId: 2,
      previewRequestId: 1,
      destination: { kind: 'existing', id: 'colors' },
    }
    const review = await env.handle(command)
    if (review?.type !== 'collection-review') throw new Error('No review')
    const items = [
      {
        id: '0',
        relativeName: 'Brand 100',
        included: true,
        overwriteToken: review.rows[0]!.conflict!.token,
      },
    ]
    await env.handle({ ...command, requestId: 3, items })
    if (change === 'deleted') env.variables.splice(0)
    if (change === 'identity') env.variables[0]!.id = 'replacement'
    if (change === 'type') env.variables[0]!.type = 'FLOAT'
    if (change === 'path') env.variables[0]!.name = 'Moved'
    if (change === 'mode') env.collections[0]!.defaultModeId = 'dark'
    if (change === 'value') env.variables[0]!.valuesByMode!.light = { r: 1, g: 0, b: 0, a: 1 }
    if (change === 'source') env.selection[0]!.fills[0]!.opacity = 0.7
    const before = JSON.stringify(env.variables)
    expect(
      await env.handle({ type: 'create-collection', requestId: 4, reviewRequestId: 3 }),
      change,
    ).toMatchObject({ type: 'creation-error' })
    expect(JSON.stringify(env.variables)).toBe(before)
  }
})

it('previews an aliased COLOR value and invalidates approval when its referenced color changes', async () => {
  const env = environment(1)
  env.collections.push({ id: 'colors', name: 'Colors', defaultModeId: 'light' })
  env.variables.push(
    {
      id: 'base',
      name: 'Base',
      type: 'COLOR',
      variableCollectionId: 'colors',
      valuesByMode: { light: { r: 0, g: 0, b: 1, a: 1 } },
    },
    {
      id: 'alias',
      name: 'Brand 100',
      type: 'COLOR',
      variableCollectionId: 'colors',
      valuesByMode: { light: { type: 'VARIABLE_ALIAS', id: 'base' } },
    },
  )
  await env.handle({ type: 'preview-selection', requestId: 1 })
  const command = {
    type: 'review-collection',
    requestId: 2,
    previewRequestId: 1,
    destination: { kind: 'existing', id: 'colors' },
  }
  const checked = await env.handle(command)
  expect(checked).toMatchObject({
    rows: [{ conflict: { canOverwrite: true, existingColor: { r: 0, g: 0, b: 1, a: 1 } } }],
  })
  if (checked?.type !== 'collection-review') throw new Error('No review')
  await env.handle({
    ...command,
    requestId: 3,
    items: [
      {
        id: '0',
        relativeName: 'Brand 100',
        included: true,
        overwriteToken: checked.rows[0]!.conflict!.token,
      },
    ],
  })
  env.variables[0]!.valuesByMode!.light = { r: 1, g: 0, b: 0, a: 1 }
  expect(
    await env.handle({ type: 'create-collection', requestId: 4, reviewRequestId: 3 }),
  ).toMatchObject({ type: 'creation-error' })
  expect(env.variables[1]!.valuesByMode!.light).toEqual({ type: 'VARIABLE_ALIAS', id: 'base' })
})
