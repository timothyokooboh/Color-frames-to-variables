import { describe, expect, it } from 'vitest'
import { createPreviewController } from './controller'

describe('preview-selection command', () => {
  it('returns empty selection and preserves every explicitly selected swatch in a 100-item palette', () => {
    const host = { currentPage: { selection: [] as unknown[] }, mixed: Symbol('mixed') }
    const handle = createPreviewController(
      host as unknown as Pick<PluginAPI, 'currentPage' | 'mixed'>,
    )
    expect(handle({ type: 'preview-selection', requestId: 1 })).toEqual({
      type: 'preview-result',
      requestId: 1,
      swatches: [],
      skipped: [],
    })
    host.currentPage.selection = Array.from({ length: 100 }, (_, i) =>
      Object.freeze({
        id: String(i),
        name: `Brand ${i}`,
        type: 'FRAME',
        visible: true,
        opacity: 1,
        fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }],
      }),
    )
    const result = handle({ type: 'preview-selection', requestId: 2 })
    expect(result?.type).toBe('preview-result')
    if (result?.type !== 'preview-result') throw new Error('Preview was not returned')
    expect(result.swatches).toHaveLength(100)
    expect(result.swatches[99]?.name).toBe('Brand 99')
    expect(result.skipped).toEqual([])
  })
  it('ignores malformed commands and returns a recoverable error when selection cannot be read', () => {
    const host = {
      get currentPage() {
        throw new Error('Document unavailable')
      },
      mixed: Symbol('mixed'),
    } as unknown as Pick<PluginAPI, 'currentPage' | 'mixed'>
    const handle = createPreviewController(host)
    expect(handle(null)).toBeNull()
    expect(handle({ type: 'preview-selection', requestId: 'invalid' })).toBeNull()
    expect(handle({ type: 'preview-selection', requestId: 3 })).toEqual({
      type: 'preview-error',
      requestId: 3,
      message: 'Could not read the selection. Please try again.',
    })
  })
  it('explains unsupported layers and fills, ignores hidden fills, and never scans children', () => {
    const solid = { type: 'SOLID', color: { r: 1, g: 0, b: 0 } }
    const base = { type: 'RECTANGLE', visible: true, opacity: 1 }
    const selection = [
      {
        ...base,
        id: 'valid',
        name: 'Critical 100',
        visible: false,
        fills: [
          { type: 'IMAGE', visible: false },
          { ...solid, opacity: 0 },
        ],
      },
      { ...base, id: 'text', name: 'Label', type: 'TEXT', fills: [solid] },
      { ...base, id: 'empty', name: 'Empty', fills: [], children: [{ ...base, fills: [solid] }] },
      { ...base, id: 'hidden', name: 'Hidden paint', fills: [{ ...solid, visible: false }] },
      { ...base, id: 'gradient', name: 'Gradient', fills: [{ type: 'GRADIENT_LINEAR' }] },
      { ...base, id: 'image', name: 'Image', fills: [{ type: 'IMAGE' }] },
      { ...base, id: 'multiple', name: 'Multiple', fills: [solid, solid] },
      { ...base, id: 'opaque', name: 'Critical 200', fills: [solid] },
    ]
    const host = { currentPage: { selection }, mixed: Symbol('mixed') } as unknown as Pick<
      PluginAPI,
      'currentPage' | 'mixed'
    >
    expect(createPreviewController(host)({ type: 'preview-selection', requestId: 2 })).toEqual({
      type: 'preview-result',
      requestId: 2,
      swatches: [
        {
          id: 'valid',
          name: 'Critical 100',
          color: { r: 1, g: 0, b: 0, a: 0 },
          hidden: true,
          nodeOpacity: 1,
        },
        {
          id: 'opaque',
          name: 'Critical 200',
          color: { r: 1, g: 0, b: 0, a: 1 },
          hidden: false,
          nodeOpacity: 1,
        },
      ],
      skipped: [
        {
          id: 'text',
          name: 'Label',
          reason: 'Unsupported layer type: TEXT. Select a frame or rectangle.',
        },
        { id: 'empty', name: 'Empty', reason: 'No visible fills.' },
        { id: 'hidden', name: 'Hidden paint', reason: 'No visible fills.' },
        { id: 'gradient', name: 'Gradient', reason: 'Gradient fills are not supported.' },
        { id: 'image', name: 'Image', reason: 'Image fills are not supported.' },
        {
          id: 'multiple',
          name: 'Multiple',
          reason: 'Multiple visible fills. Use exactly one solid fill.',
        },
      ],
    })
  })
  it('returns the selected source name and exact paint channels without changing the layer', () => {
    const layer = Object.freeze({
      id: 'swatch-1',
      type: 'FRAME',
      name: 'Brand/100',
      visible: true,
      opacity: 0.2,
      fills: Object.freeze([
        { type: 'SOLID', color: { r: 0.123456789, g: 0.5, b: 1 }, opacity: 0.4 },
      ]),
    })
    const host = { currentPage: { selection: [layer] }, mixed: Symbol('mixed') } as unknown as Pick<
      PluginAPI,
      'currentPage' | 'mixed'
    >
    const controller = createPreviewController(host)

    expect(controller({ type: 'preview-selection', requestId: 1 })).toEqual({
      type: 'preview-result',
      requestId: 1,
      swatches: [
        {
          id: 'swatch-1',
          name: 'Brand/100',
          color: { r: 0.123456789, g: 0.5, b: 1, a: 0.4 },
          hidden: false,
          nodeOpacity: 0.2,
        },
      ],
      skipped: [],
    })
    expect(layer.opacity).toBe(0.2)
    expect(layer.name).toBe('Brand/100')
  })
})
