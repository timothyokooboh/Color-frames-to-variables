import { expect, it, vi } from 'vitest'
import { environment, review } from './test-environment'

it('retries only failed items in the retained collection with original unprefixed paths and cumulative results', async () => {
  const env = environment(3)
  const allocate = env.host.variables.createVariable
  const fail = vi
    .spyOn(env.host.variables, 'createVariable')
    .mockImplementation((name, collection, type) => {
      if (name === 'Brand/1') throw new Error('Temporary allocation failure')
      return allocate(name, collection, type)
    })
  await review(env, 'Primitives')
  const first = await env.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 })
  expect(first).toMatchObject({ created: 2, failed: 1 })
  fail.mockRestore()
  const recovered = await env.handle({
    type: 'recover-collection',
    requestId: 4,
    resultRequestId: 3,
  })
  expect(recovered).toMatchObject({
    type: 'recovery-preview',
    preview: { swatches: [{ id: '1' }] },
    items: [{ id: '1', relativeName: 'Brand/1', included: true }],
  })
  if (recovered?.type !== 'recovery-preview') throw new Error('No recovery')
  expect(
    await env.handle({
      type: 'review-collection',
      requestId: 5,
      previewRequestId: 4,
      destination: recovered.destination,
      items: recovered.items,
    }),
  ).toMatchObject({ canCreate: true, rows: [{ fullPath: 'Brand/1' }] })
  const request = { type: 'create-collection', requestId: 6, reviewRequestId: 5 }
  const retry = env.handle(request)
  expect(await env.handle(request)).toMatchObject({ type: 'creation-error' })
  expect(await retry).toMatchObject({
    created: 3,
    updated: 0,
    failed: 0,
    collectionId: 'collection-0',
  })
  expect(await env.handle(request)).toMatchObject({ type: 'creation-error' })
  expect(env.variables.map(({ name }) => name).sort()).toEqual(['Brand 100', 'Brand/1', 'Brand/2'])
  expect(env.collections).toHaveLength(1)
})

it('recovers a surviving allocation without duplicating its path after an all-failed batch', async () => {
  const env = environment(1)
  const allocate = env.host.variables.createVariable
  const fail = vi
    .spyOn(env.host.variables, 'createVariable')
    .mockImplementation((name, collection, type) => {
      const variable = allocate(name, collection, type)
      variable.setValueForMode = () => {
        throw new Error('Assignment failed')
      }
      variable.remove = () => {
        throw new Error('Cleanup failed')
      }
      return variable
    })
  await review(env, 'Primitives')
  expect(
    await env.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 }),
  ).toMatchObject({ created: 0, failed: 1, collectionEmpty: false })
  fail.mockRestore()
  const recovered = await env.handle({
    type: 'recover-collection',
    requestId: 4,
    resultRequestId: 3,
  })
  if (recovered?.type !== 'recovery-preview') throw new Error('No recovery')
  expect(
    await env.handle({
      type: 'review-collection',
      requestId: 5,
      previewRequestId: 4,
      destination: recovered.destination,
      items: recovered.items,
    }),
  ).toMatchObject({ canCreate: true })
  expect(
    await env.handle({ type: 'create-collection', requestId: 6, reviewRequestId: 5 }),
  ).toMatchObject({ created: 1, updated: 0, failed: 0 })
  expect(env.variables).toHaveLength(1)
  expect(env.variables[0]?.name).toBe('Brand 100')
  expect(env.collections).toHaveLength(1)
})

it('refreshes failed sources for renewed review, blocks changed or deleted destinations, and preserves successes', async () => {
  for (const change of ['source', 'destination', 'artifact']) {
    const env = environment(2)
    const allocate = env.host.variables.createVariable
    const failure = vi
      .spyOn(env.host.variables, 'createVariable')
      .mockImplementation((name, collection, type) => {
        const variable = allocate(name, collection, type)
        if (name === 'Brand/1') {
          variable.setValueForMode = () => {
            throw new Error('Failed')
          }
          variable.remove = () => {
            throw new Error('Retained')
          }
        }
        return variable
      })
    await review(env)
    await env.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 })
    failure.mockRestore()
    env.selection[1]!.fills[0]!.opacity = 0.8
    const recovery = await env.handle({
      type: 'recover-collection',
      requestId: 4,
      resultRequestId: 3,
    })
    expect(recovery).toMatchObject({ preview: { swatches: [{ id: '1', color: { a: 0.8 } }] } })
    if (recovery?.type !== 'recovery-preview') throw new Error('No recovery')
    const command = {
      type: 'review-collection',
      requestId: 5,
      previewRequestId: 4,
      destination: recovery.destination,
      items: recovery.items,
    }
    expect(await env.handle(command)).toMatchObject({ canCreate: true })
    if (change === 'source') env.selection[1]!.fills[0]!.opacity = 0.9
    if (change === 'destination') env.collections.splice(0)
    if (change === 'artifact')
      env.variables[1]!.valuesByMode = { default: { r: 0, g: 1, b: 0, a: 1 } }
    const before = JSON.stringify(env.variables)
    expect(
      await env.handle({ type: 'create-collection', requestId: 6, reviewRequestId: 5 }),
    ).toMatchObject({ type: 'creation-error' })
    expect(JSON.stringify(env.variables)).toBe(before)
  }
})

it('can exclude an unavailable failed source and correct another without rewriting successful items', async () => {
  const env = environment(3)
  const allocate = env.host.variables.createVariable
  const fail = vi
    .spyOn(env.host.variables, 'createVariable')
    .mockImplementation((name, collection, type) => {
      if (name !== 'Brand 100') throw new Error('Unavailable')
      return allocate(name, collection, type)
    })
  await review(env)
  await env.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 })
  fail.mockRestore()
  env.selection.splice(1, 1)
  const recovery = await env.handle({
    type: 'recover-collection',
    requestId: 4,
    resultRequestId: 3,
  })
  if (recovery?.type !== 'recovery-preview') throw new Error('No recovery')
  const items = recovery.items.map((item) => ({
    ...item,
    included: item.id !== '1',
    relativeName: item.id === '2' ? 'Corrected/200' : item.relativeName,
  }))
  expect(
    await env.handle({
      type: 'review-collection',
      requestId: 5,
      previewRequestId: 4,
      destination: recovery.destination,
      items,
    }),
  ).toMatchObject({ canCreate: true })
  expect(
    await env.handle({ type: 'create-collection', requestId: 6, reviewRequestId: 5 }),
  ).toMatchObject({ created: 2, failed: 0, excluded: 1, unsupported: 0 })
  expect(env.variables.map(({ name }) => name)).toEqual(['Brand 100', 'Corrected/200'])
})

it('retries mixed update and allocation failures with fresh individual consent and cumulative counts', async () => {
  const env = environment(3)
  env.collections.push({ id: 'colors', name: 'Colors', defaultModeId: 'default' })
  env.variables.push({
    id: 'existing',
    name: 'Brand 100',
    type: 'COLOR',
    variableCollectionId: 'colors',
    valuesByMode: { default: { r: 0, g: 0, b: 0, a: 1 }, dark: { r: 1, g: 1, b: 1, a: 1 } },
  })
  const list = env.host.variables.getLocalVariablesAsync
  const updateFailure = vi
    .spyOn(env.host.variables, 'getLocalVariablesAsync')
    .mockImplementation(async () =>
      (await list()).map((variable) => ({
        ...variable,
        setValueForMode() {
          throw new Error('Update denied')
        },
      })),
    )
  const allocate = env.host.variables.createVariable
  const allocationFailure = vi
    .spyOn(env.host.variables, 'createVariable')
    .mockImplementation((name, collection, type) => {
      if (name === 'Brand/1') throw new Error('Allocation denied')
      return allocate(name, collection, type)
    })
  await env.handle({ type: 'preview-selection', requestId: 1 })
  const command = {
    type: 'review-collection',
    requestId: 2,
    previewRequestId: 1,
    destination: { kind: 'existing', id: 'colors' },
  }
  const checked = await env.handle(command)
  if (checked?.type !== 'collection-review') throw new Error('No review')
  await env.handle({
    ...command,
    requestId: 3,
    items: checked.rows.map((row) => ({
      id: row.id,
      relativeName: row.relativeName,
      included: true,
      overwriteToken: row.conflict?.token,
    })),
  })
  expect(
    await env.handle({ type: 'create-collection', requestId: 4, reviewRequestId: 3 }),
  ).toMatchObject({ created: 1, updated: 0, failed: 2 })
  updateFailure.mockRestore()
  allocationFailure.mockRestore()
  const recovery = await env.handle({
    type: 'recover-collection',
    requestId: 5,
    resultRequestId: 4,
  })
  if (recovery?.type !== 'recovery-preview') throw new Error('No recovery')
  const retryCommand = { ...command, requestId: 6, previewRequestId: 5, items: recovery.items }
  const retryReview = await env.handle(retryCommand)
  expect(retryReview).toMatchObject({ canCreate: false })
  if (retryReview?.type !== 'collection-review') throw new Error('No review')
  await env.handle({
    ...retryCommand,
    requestId: 7,
    items: retryReview.rows.map((row) => ({
      id: row.id,
      relativeName: row.relativeName,
      included: true,
      overwriteToken: row.conflict?.token,
    })),
  })
  expect(
    await env.handle({ type: 'create-collection', requestId: 8, reviewRequestId: 7 }),
  ).toMatchObject({ created: 2, updated: 1, failed: 0 })
  expect(env.variables).toHaveLength(3)
  expect(env.variables[0]?.valuesByMode?.dark).toEqual({ r: 1, g: 1, b: 1, a: 1 })
})

it('reports retained incomplete variables after a failed item is renamed successfully', async () => {
  const env = environment(1)
  const allocate = env.host.variables.createVariable
  const fail = vi
    .spyOn(env.host.variables, 'createVariable')
    .mockImplementation((name, collection, type) => {
      const variable = allocate(name, collection, type)
      variable.setValueForMode = () => {
        throw new Error('Assignment failed')
      }
      variable.remove = () => {
        throw new Error('Cleanup failed')
      }
      return variable
    })
  await review(env)
  await env.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 })
  fail.mockRestore()
  const recovery = await env.handle({
    type: 'recover-collection',
    requestId: 4,
    resultRequestId: 3,
  })
  if (recovery?.type !== 'recovery-preview') throw new Error('No recovery')
  await env.handle({
    type: 'review-collection',
    requestId: 5,
    previewRequestId: 4,
    destination: recovery.destination,
    items: [{ id: '0', relativeName: 'Corrected', included: true }],
  })
  expect(
    await env.handle({ type: 'create-collection', requestId: 6, reviewRequestId: 5 }),
  ).toMatchObject({
    created: 1,
    failed: 0,
    warnings: [{ name: 'Brand 100', message: expect.stringContaining('incomplete') }],
  })
  expect(env.variables.map(({ name }) => name)).toEqual(['Brand 100', 'Corrected'])
})
