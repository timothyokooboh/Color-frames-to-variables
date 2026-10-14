import { check, session, sourceState, swatch, variables } from './helpers'

export async function runScenarios(
  record: (name: string, run: () => Promise<void>) => Promise<void>,
) {
  await record(
    '1–3,10: 45 exact native colors, spaces/slashes, alpha and unchanged sources',
    async () => {
      const nodes = Array.from({ length: 45 }, (_, i) =>
        swatch(i === 0 ? 'Brand 100' : i === 1 ? 'Critical/100' : `Brand/${i * 100}`, i),
      )
      const before = sourceState(nodes)
      const s = session()
      await s.preview(nodes)
      check((await s.review({ kind: 'new', name: 'Colors' })).canCreate, 'Review blocked')
      const result = await s.write()
      check(
        result?.type === 'creation-result' && result.created === 45 && result.failed === 0,
        'Expected 45 creations',
      )
      const stored = await variables(result.collectionId)
      const collection = await figma.variables.getVariableCollectionByIdAsync(result.collectionId)
      check(stored.length === 45 && collection, 'Expected exactly 45 variables')
      for (const node of nodes) {
        const variable = stored.find((v) => v.name === node.name)
        check(variable?.resolvedType === 'COLOR', `Missing exact name ${node.name}`)
        const value = variable.valuesByMode[collection.defaultModeId] as RGBA
        check(
          value.r === 0.125 && value.g === 0.5 && value.b === 1 && Math.abs(value.a - 0.4) < 1e-7,
          'Paint fidelity failed',
        )
      }
      check(sourceState(nodes) === before, 'Source changed')
    },
  )
  await record('4,9: existing Primitives prefix and unrelated values preserved', async () => {
    const c = figma.variables.createVariableCollection('Primitives')
    for (const [name, value] of [
      ['Font Family', 'Inter'],
      ['Font Size', 16],
      ['Font Weight', 400],
    ] as const) {
      figma.variables
        .createVariable(name, c, typeof value === 'string' ? 'STRING' : 'FLOAT')
        .setValueForMode(c.defaultModeId, value)
    }
    const before = JSON.stringify(
      (await variables(c.id)).map((v) => [v.id, v.name, v.valuesByMode]),
    )
    const s = session()
    await s.preview([swatch('Brand/100')])
    const review = await s.review({ kind: 'existing', id: c.id })
    check(review.rows[0]?.fullPath === 'Colors/Brand/100', 'Prefix wrong')
    const result = await s.write()
    check(result?.type === 'creation-result' && result.created === 1, 'Write failed')
    const stored = await variables(c.id)
    check(
      JSON.stringify(
        stored
          .filter((v) => v.name !== 'Colors/Brand/100')
          .map((v) => [v.id, v.name, v.valuesByMode]),
      ) === before,
      'Unrelated values changed',
    )
  })
  await record(
    '5: conflict blocks until individual approval; existing Colors is unprefixed',
    async () => {
      const c = (await figma.variables.getLocalVariableCollectionsAsync()).find(
        (c) => c.name === 'Colors',
      )!
      const s = session()
      await s.preview([swatch('Brand 100')])
      const first = await s.review({ kind: 'existing', id: c.id })
      check(!first.canCreate && first.rows[0]?.conflict?.canOverwrite, 'Missing conflict')
      check((await s.write())?.type === 'creation-error', 'Unapproved write accepted')
      const row = first.rows[0]!
      check(
        (
          await s.review({ kind: 'existing', id: c.id }, [
            {
              id: row.id,
              relativeName: row.relativeName,
              included: true,
              overwriteToken: row.conflict!.token,
            },
          ])
        ).canCreate,
        'Approval blocked',
      )
      const result = await s.write()
      check(
        result?.type === 'creation-result' && result.updated === 1 && result.created === 0,
        'Overwrite count wrong',
      )
    },
  )
  await record('6,11: duplicates and empty slash segments block writes', async () => {
    const s = session()
    await s.preview([swatch('Duplicate'), swatch('Duplicate'), swatch('Brand//100')])
    const review = await s.review({ kind: 'new', name: 'Invalid paths' })
    check(
      !review.canCreate &&
        review.rows.filter((r) => r.status === 'duplicate').length === 2 &&
        review.rows[2]?.status === 'invalid',
      'Invalid paths accepted',
    )
    check((await s.write())?.type === 'creation-error', 'Invalid write accepted')
  })
  await record('7: 40 creations, 3 updates, 2 intentional exclusions', async () => {
    const c = figma.variables.createVariableCollection('Mixed counts')
    const nodes = Array.from({ length: 45 }, (_, i) => swatch(`Mixed/${i}`, i))
    for (let i = 0; i < 3; i++)
      figma.variables
        .createVariable(`Colors/Mixed/${i}`, c, 'COLOR')
        .setValueForMode(c.defaultModeId, { r: 1, g: 0, b: 0 })
    const s = session()
    await s.preview(nodes)
    const first = await s.review({ kind: 'existing', id: c.id })
    const items = first.rows.map((r, i) => ({
      id: r.id,
      relativeName: r.relativeName,
      included: i < 43,
      overwriteToken: r.conflict?.token,
    }))
    check((await s.review({ kind: 'existing', id: c.id }, items)).canCreate, 'Mixed review blocked')
    const result = await s.write()
    check(
      result?.type === 'creation-result' &&
        result.created === 40 &&
        result.updated === 3 &&
        result.excluded === 2 &&
        result.failed === 0,
      'Mixed counts wrong',
    )
    check((await variables(c.id)).length === 43, 'Mixed stored count wrong')
  })
  await record('8: unsupported fills and hidden/transparent paint eligibility', async () => {
    const solid = swatch('Solid')
    const gradient = swatch('Gradient')
    gradient.fills = [
      {
        type: 'GRADIENT_LINEAR',
        gradientTransform: [
          [1, 0, 0],
          [0, 1, 0],
        ],
        gradientStops: [
          { position: 0, color: { r: 0, g: 0, b: 0, a: 1 } },
          { position: 1, color: { r: 1, g: 1, b: 1, a: 1 } },
        ],
      },
    ]
    const image = swatch('Image')
    image.fills = [{ type: 'IMAGE', imageHash: null, scaleMode: 'FILL' }]
    const multiple = swatch('Multiple')
    multiple.fills = [...(solid.fills as Paint[]), ...(solid.fills as Paint[])]
    const hidden = swatch('Hidden')
    hidden.visible = false
    const transparent = swatch('Transparent')
    transparent.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 }, opacity: 0 }]
    const empty = swatch('Empty')
    empty.fills = []
    const s = session()
    const preview = await s.preview([solid, gradient, image, multiple, hidden, transparent, empty])
    check(
      preview.swatches.length === 3 &&
        preview.skipped.length === 4 &&
        preview.swatches.some((s) => s.color.a === 0),
      'Eligibility wrong',
    )
  })
  await record('12: deleted destination stops writes', async () => {
    const c = figma.variables.createVariableCollection('Delete only this fixture')
    const s = session()
    await s.preview([swatch('Deletion')])
    await s.review({ kind: 'existing', id: c.id })
    c.remove()
    check((await s.write())?.type === 'creation-error', 'Deleted destination accepted')
  })
  await record('13: actual API invalid-name failure retains success', async () => {
    const s = session()
    await s.preview([swatch('Valid'), swatch('Invalid{name}')])
    await s.review({ kind: 'new', name: 'Partial results' })
    const result = await s.write()
    check(
      result?.type === 'creation-result' &&
        result.created === 1 &&
        result.failed === 1 &&
        result.errors.length === 1,
      'Expected partial result',
    )
  })
  await record('14: concurrent and completed submissions cannot repeat writes', async () => {
    const s = session()
    await s.preview([swatch('Once')])
    await s.review({ kind: 'new', name: 'Submission guard' })
    const first = s.write()
    check((await s.write())?.type === 'creation-error', 'Concurrent write allowed')
    check((await first)?.type === 'creation-result', 'First write failed')
    check((await s.write())?.type === 'creation-error', 'Repeated write allowed')
  })
  await record('15: new Colors name collision blocks allocation', async () => {
    const s = session()
    await s.preview([swatch('Collision')])
    const review = await s.review({ kind: 'new', name: 'Colors' })
    check(!review.canCreate && review.collectionError, 'Name collision accepted')
  })
  await record('100 swatches: native command throughput and exact count', async () => {
    const nodes = Array.from({ length: 100 }, (_, i) => swatch(`Large/${i}`, i))
    const s = session()
    await s.preview(nodes)
    await s.review({ kind: 'new', name: '100 swatches' })
    const result = await s.write()
    check(
      result?.type === 'creation-result' && result.created === 100 && result.failed === 0,
      '100 writes failed',
    )
    check((await variables(result.collectionId)).length === 100, 'Stored count differs')
  })
}
