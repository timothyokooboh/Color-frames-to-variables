import { describe, expect, it, vi } from 'vitest'

import { environment, review } from './test-environment'

describe('new collection commands', () => {
  it('creates corrected proposed names and counts exclusions without changing sources', async () => {
    const env = environment(3)
    env.selection[0]!.name = 'Duplicate'
    env.selection[1]!.name = 'Duplicate'
    env.selection[2]!.name = ' '
    const original = JSON.stringify(env.selection)
    expect(await review(env)).toMatchObject({ canCreate: false })
    const corrected = await env.handle({
      type: 'review-collection',
      requestId: 4,
      previewRequestId: 1,
      destination: { kind: 'new', name: 'Colors' },
      items: [
        { id: '0', relativeName: 'Brand/100', included: true },
        { id: '1', relativeName: 'Duplicate', included: false },
        { id: '2', relativeName: ' Exact Name ', included: true },
      ],
    })
    expect(corrected).toMatchObject({
      canCreate: true,
      rows: [
        { id: '0', fullPath: 'Brand/100', status: 'ready' },
        { id: '1', status: 'excluded' },
        { id: '2', fullPath: ' Exact Name ', status: 'ready' },
      ],
    })
    expect(
      await env.handle({ type: 'create-collection', requestId: 5, reviewRequestId: 4 }),
    ).toMatchObject({ created: 2, excluded: 1, unsupported: 0 })
    expect(env.variables.map((variable) => variable.name)).toEqual(['Brand/100', ' Exact Name '])
    expect(JSON.stringify(env.selection)).toBe(original)
  })
  it('retains an empty collection when all writes fail and reports surviving incomplete variables', async () => {
    for (const cleanupFails of [false, true]) {
      const env = environment(1)
      const allocate = env.host.variables.createVariable
      vi.spyOn(env.host.variables, 'createVariable').mockImplementation(
        (name, collection, type) => {
          const variable = allocate(name, collection, type)
          variable.setValueForMode = () => {
            throw new Error('Value failed')
          }
          if (cleanupFails)
            variable.remove = () => {
              throw new Error('Cleanup failed')
            }
          return variable
        },
      )
      await review(env)
      const result = await env.handle({
        type: 'create-collection',
        requestId: 3,
        reviewRequestId: 2,
      })
      expect(result).toMatchObject({ created: 0, failed: 1, collectionEmpty: !cleanupFails })
      expect(env.collections).toHaveLength(1)
      expect(env.variables).toHaveLength(cleanupFails ? 1 : 0)
      if (cleanupFails)
        expect(result).toMatchObject({
          errors: [{ message: expect.stringContaining('incomplete variable remains') }],
        })
    }
  })
  it('requires refreshed review for source changes or a newly colliding collection', async () => {
    for (const change of ['name', 'color', 'selection', 'collection']) {
      const env = environment(1)
      await review(env)
      if (change === 'name') env.selection[0]!.name = 'Changed'
      if (change === 'color') env.selection[0]!.fills[0]!.opacity = 0
      if (change === 'selection') env.host.currentPage.selection = []
      if (change === 'collection')
        env.collections.push({ id: 'external', name: 'Colors', defaultModeId: 'default' })
      expect(
        await env.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 }),
      ).toMatchObject({ type: 'creation-error' })
      expect(env.variables).toEqual([])
      expect(env.collections).toHaveLength(change === 'collection' ? 1 : 0)
    }
  })
  it('locks concurrent and completed submissions and permits an explicit new batch', async () => {
    const env = environment(1)
    await review(env)
    const command = { type: 'create-collection', requestId: 3, reviewRequestId: 2 }
    const first = env.handle(command)
    expect(await env.handle(command)).toMatchObject({ type: 'creation-error' })
    expect(await first).toMatchObject({ created: 1 })
    expect(await env.handle(command)).toMatchObject({ type: 'creation-error' })
    expect(env.variables).toHaveLength(1)
    await review(env, 'Another collection')
    expect(await env.handle(command)).toMatchObject({ created: 1 })
    expect(env.variables).toHaveLength(2)
  })
  it('continues after allocation and value failures, counts only completed writes and cleans incomplete variables', async () => {
    const env = environment(3)
    const allocate = env.host.variables.createVariable
    vi.spyOn(env.host.variables, 'createVariable').mockImplementation((name, collection, type) => {
      if (name === 'Brand 100') throw new Error('Allocation denied')
      const variable = allocate(name, collection, type)
      if (name === 'Brand/1')
        variable.setValueForMode = () => {
          throw new Error('Value denied')
        }
      return variable
    })
    await review(env)
    expect(
      await env.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 }),
    ).toMatchObject({
      type: 'creation-result',
      created: 1,
      failed: 2,
      errors: [
        { id: '0', name: 'Brand 100', message: expect.stringContaining('Allocation denied') },
        { id: '1', name: 'Brand/1', message: expect.stringContaining('Value denied') },
      ],
    })
    expect(env.variables).toHaveLength(1)
    expect(env.collections).toHaveLength(1)
    expect(env.notifications[0]).toContain('1 created · 2 failed')
  })
  it('blocks collisions, invalid names, duplicates, empty batches and malformed commands without writes', async () => {
    const env = environment(5)
    env.selection[0]!.name = ' '
    env.selection[1]!.name = 'Brand//100'
    env.selection[2]!.name = 'Brand/ '
    env.selection[3]!.name = 'Duplicate'
    env.selection[4]!.name = 'Duplicate'
    env.collections.push({ id: 'existing', name: 'Colors', defaultModeId: 'default' })
    const result = await review(env)
    expect(result).toMatchObject({
      type: 'collection-review',
      canCreate: false,
      issues: expect.arrayContaining([
        { id: '0', message: expect.any(String) },
        { id: '1', message: expect.any(String) },
        { id: '2', message: expect.any(String) },
        { id: '3', message: expect.any(String) },
        { id: '4', message: expect.any(String) },
      ]),
      collectionError: expect.stringContaining('already exists'),
    })
    expect(
      await env.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 }),
    ).toMatchObject({ type: 'creation-error' })
    expect(env.collections).toHaveLength(1)
    expect(env.variables).toEqual([])
    expect(
      await env.handle({ type: 'create-collection', requestId: 'bad', reviewRequestId: 2 }),
    ).toBeNull()
    const empty = environment(0)
    expect(await review(empty)).toMatchObject({ canCreate: false })
    await empty.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 })
    expect(empty.collections).toEqual([])
    expect(await review(environment(1), '   ')).toMatchObject({ canCreate: false })
  })
  it('creates all 45 native colors with exact names, channels and default-mode values after review', async () => {
    const env = environment()
    const before = JSON.stringify(env.selection)
    const preview = await review(env)
    expect(preview).toMatchObject({
      type: 'collection-review',
      canCreate: true,
      collectionName: 'Colors',
    })
    expect(env.collections).toEqual([])
    const result = await env.handle({ type: 'create-collection', requestId: 3, reviewRequestId: 2 })
    expect(result).toMatchObject({
      type: 'creation-result',
      created: 45,
      failed: 0,
      unsupported: 0,
    })
    expect(env.collections).toHaveLength(1)
    expect(env.variables).toHaveLength(45)
    expect(env.variables[0]).toMatchObject({
      name: 'Brand 100',
      type: 'COLOR',
      mode: 'default',
      value: { r: 0.123456789, g: 0.5, b: 1, a: 0.4 },
    })
    expect(env.variables[44]?.name).toBe('Brand/44')
    expect(JSON.stringify(env.selection)).toBe(before)
    expect(env.notifications[0]).toContain('45 created')
  })
})
