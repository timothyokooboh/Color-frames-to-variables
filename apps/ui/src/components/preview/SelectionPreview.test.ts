import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SelectionPreview from './SelectionPreview.vue'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('selection preview', () => {
  it('ignores malformed or foreign responses and times out with a useful recovery action', async () => {
    vi.useFakeTimers()
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {})
    const wrapper = mount(SelectionPreview)
    window.dispatchEvent(
      new MessageEvent('message', {
        source: window.parent,
        data: {
          pluginMessage: { type: 'preview-result', requestId: 1, swatches: [null], skipped: [] },
        },
      }),
    )
    window.dispatchEvent(
      new MessageEvent('message', {
        source: null,
        data: {
          pluginMessage: { type: 'preview-result', requestId: 1, swatches: [], skipped: [] },
        },
      }),
    )
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Reading selection')
    await vi.advanceTimersByTimeAsync(10000)
    expect(wrapper.get('[role="alert"]').text()).toContain('No response from Figma')
    expect(wrapper.get('button').text()).toBe('Try again')
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('offers retry after a controller error and ignores outdated responses', async () => {
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {})
    const wrapper = mount(SelectionPreview)
    const reply = (pluginMessage: unknown) =>
      window.dispatchEvent(
        new MessageEvent('message', { source: window.parent, data: { pluginMessage } }),
      )
    reply({
      type: 'preview-error',
      requestId: 1,
      message: 'Could not read the selection. Please try again.',
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[role="alert"]').text()).toContain('Could not read')
    await wrapper.get('button').trigger('click')
    reply({ type: 'preview-result', requestId: 1, swatches: [], skipped: [] })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Reading selection')
    reply({ type: 'preview-result', requestId: 2, swatches: [], skipped: [] })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Select your color swatches')
    wrapper.unmount()
  })
  it('shows exact source names, colors, visibility notes and skipped-layer explanations', async () => {
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {})
    const wrapper = mount(SelectionPreview)
    window.dispatchEvent(
      new MessageEvent('message', {
        source: window.parent,
        data: {
          pluginMessage: {
            type: 'preview-result',
            requestId: 1,
            swatches: [
              {
                id: 'one',
                name: 'Brand/<100>',
                color: { r: 1, g: 0, b: 0, a: 0.4 },
                hidden: true,
                nodeOpacity: 0.5,
              },
            ],
            skipped: [
              { id: 'two', name: 'Gradient swatch', reason: 'Gradient fills are not supported.' },
            ],
          },
        },
      }),
    )
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('1 eligible · 1 skipped')
    expect(wrapper.text()).toContain('Brand/<100>')
    expect(wrapper.text()).toContain('#FF000066')
    expect(wrapper.text()).toContain('RGBA (0–1): 1, 0, 0, 0.4')
    expect(wrapper.text()).toContain('Layer is hidden')
    expect(wrapper.text()).toContain('Layer opacity 50% is excluded')
    expect(wrapper.text()).toContain('Gradient swatch')
    expect(wrapper.text()).toContain('Gradient fills are not supported.')
    wrapper.unmount()
  })
  it('requests a preview and explains an empty selection after loading', async () => {
    const send = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {})
    const wrapper = mount(SelectionPreview)
    expect(wrapper.get('[role="status"]').text()).toContain('Reading selection')
    expect(send).toHaveBeenCalledWith(
      { pluginMessage: { type: 'preview-selection', requestId: 1 } },
      '*',
    )
    window.dispatchEvent(
      new MessageEvent('message', {
        source: window.parent,
        data: {
          pluginMessage: { type: 'preview-result', requestId: 1, swatches: [], skipped: [] },
        },
      }),
    )
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Select your color swatches')
    expect(wrapper.text()).toContain('0 eligible')
    expect(wrapper.get('button').text()).toBe('Refresh selection')
    wrapper.unmount()
  })
})
