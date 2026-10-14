import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import SelectionPreview from './SelectionPreview.vue'

const swatch = {
  id: 'one',
  name: 'Brand/100',
  color: { r: 1, g: 0, b: 0, a: 0.4 },
  hidden: false,
  nodeOpacity: 1,
}
function reply(pluginMessage: unknown) {
  window.dispatchEvent(
    new MessageEvent('message', { origin: 'https://www.figma.com', data: { pluginMessage } }),
  )
}
afterEach(() => vi.restoreAllMocks())
it('reviews an editable destination, creates only once, and retains results until starting a new batch', async () => {
  const send = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {})
  const wrapper = mount(SelectionPreview, { attachTo: document.body })
  reply({ type: 'preview-result', requestId: 1, swatches: [swatch], skipped: [] })
  await wrapper.vm.$nextTick()
  expect(wrapper.get('input').element.value).toBe('Colors')
  await wrapper.get('input').setValue('Palette')
  const review = send.mock.calls[send.mock.calls.length - 1]![0].pluginMessage
  expect(review).toMatchObject({
    type: 'review-collection',
    collectionName: 'Palette',
    previewRequestId: 1,
  })
  reply({
    type: 'collection-review',
    requestId: review.requestId,
    collectionName: 'Palette',
    canCreate: true,
    collectionError: '',
    issues: [],
  })
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toContain('Full variable path: Brand/100')
  const create = wrapper
    .findAll('button')
    .find((button) => button.text().includes('Create 1 variable'))!
  await create.trigger('click')
  await create.trigger('click')
  expect(
    send.mock.calls.filter(([envelope]) => envelope.pluginMessage.type === 'create-collection'),
  ).toHaveLength(1)
  const command = send.mock.calls[send.mock.calls.length - 1]![0].pluginMessage
  reply({
    type: 'creation-result',
    requestId: command.requestId,
    collectionName: 'Palette',
    collectionId: 'new',
    collectionEmpty: false,
    created: 1,
    failed: 0,
    unsupported: 0,
    errors: [],
  })
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toContain('1 created')
  expect(wrapper.text()).toContain('Palette')
  expect(wrapper.find('input').exists()).toBe(false)
  expect(document.activeElement?.textContent?.trim()).toBe('Creation results')
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Start new batch')!
    .trigger('click')
  expect(send.mock.calls[send.mock.calls.length - 1]![0].pluginMessage.type).toBe(
    'preview-selection',
  )
  expect(document.activeElement?.textContent?.trim()).toBe('Refresh selection')
  wrapper.unmount()
})

it('blocks invalid reviews and ignores old destination responses, then displays partial failure details', async () => {
  const send = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {})
  const wrapper = mount(SelectionPreview)
  reply({ type: 'preview-result', requestId: 1, swatches: [swatch], skipped: [] })
  await wrapper.vm.$nextTick()
  const initial = send.mock.calls[send.mock.calls.length - 1]![0].pluginMessage
  await wrapper.get('input').setValue('Existing')
  const latest = send.mock.calls[send.mock.calls.length - 1]![0].pluginMessage
  reply({
    type: 'collection-review',
    requestId: initial.requestId,
    collectionName: 'Colors',
    canCreate: true,
    collectionError: '',
    issues: [],
  })
  await wrapper.vm.$nextTick()
  const create = () =>
    wrapper.findAll('button').find((button) => button.text().includes('Create 1 variable'))!
  expect(create().attributes('aria-disabled')).toBe('true')
  reply({
    type: 'collection-review',
    requestId: latest.requestId,
    collectionName: 'Existing',
    canCreate: false,
    collectionError: 'Collection already exists.',
    issues: [{ id: 'one', message: 'Duplicate variable path.' }],
  })
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toContain('Collection already exists.')
  expect(wrapper.text()).toContain('Duplicate variable path.')
  await create().trigger('click')
  expect(
    send.mock.calls.some(([envelope]) => envelope.pluginMessage.type === 'create-collection'),
  ).toBe(false)
  await wrapper.get('input').setValue('New')
  const valid = send.mock.calls[send.mock.calls.length - 1]![0].pluginMessage
  reply({
    type: 'collection-review',
    requestId: valid.requestId,
    collectionName: 'New',
    canCreate: true,
    collectionError: '',
    issues: [],
  })
  await wrapper.vm.$nextTick()
  await create().trigger('click')
  const command = send.mock.calls[send.mock.calls.length - 1]![0].pluginMessage
  reply({
    type: 'creation-result',
    requestId: command.requestId,
    collectionName: 'New',
    collectionId: 'new',
    collectionEmpty: false,
    created: 0,
    failed: 1,
    unsupported: 2,
    errors: [{ id: 'one', name: 'Brand/100', message: 'Permission denied.' }],
  })
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toContain('0 created · 1 failed · 2 unsupported')
  expect(wrapper.text()).toContain('Permission denied.')
  expect(wrapper.text()).toContain('collection has been retained')
  wrapper.unmount()
})
