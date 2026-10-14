import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import SelectionPreview from './SelectionPreview.vue'
const swatch = {
  id: 'one',
  name: 'Brand/100',
  color: { r: 1, g: 0, b: 0, a: 1 },
  hidden: false,
  nodeOpacity: 1,
}
const conflict = {
  token: 'reviewed-value',
  variableId: 'target',
  canOverwrite: true,
  existingColor: { r: 0, g: 0, b: 1, a: 1 },
  proposedColor: swatch.color,
}
function reply(pluginMessage: unknown) {
  window.dispatchEvent(
    new MessageEvent('message', { origin: 'https://www.figma.com', data: { pluginMessage } }),
  )
}
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
it('shows existing and proposed HEX colors and sends only individual overwrite consent, cleared by renaming', async () => {
  const send = vi.spyOn(window.parent, 'postMessage').mockImplementation((message) => {
    structuredClone(message)
  })
  const command = (type: string) =>
    [...send.mock.calls].reverse().find(([value]) => value.pluginMessage.type === type)![0]
      .pluginMessage
  const wrapper = mount(SelectionPreview, { attachTo: document.body })
  reply({
    type: 'collection-options',
    requestId: command('list-collections').requestId,
    collections: [{ id: 'colors', name: 'Colors' }],
  })
  reply({ type: 'preview-result', requestId: 1, swatches: [swatch], skipped: [] })
  await flushPromises()
  reply({
    type: 'collection-review',
    requestId: command('review-collection').requestId,
    collectionName: 'Colors',
    collectionError: '',
    issues: [{ id: 'one', message: 'Conflict' }],
    canCreate: false,
    rows: [
      {
        id: 'one',
        relativeName: 'Brand/100',
        included: true,
        fullPath: 'Brand/100',
        status: 'conflict',
        message: 'Conflict',
        conflict,
      },
    ],
  })
  await flushPromises()
  expect(wrapper.text()).toContain('#0000FF')
  expect(wrapper.text()).toContain('#FF0000')
  const approve = wrapper.findAll('input[type="checkbox"]')[1]!
  await approve.setValue(true)
  expect(command('review-collection').items[0].overwriteToken).toBe('reviewed-value')
  await wrapper.get('input[type="text"]').setValue('Brand/200')
  expect(command('review-collection').items[0].overwriteToken).toBeUndefined()
  wrapper.unmount()
})

it('returns from partial results to failed-item correction and retains successful counts', async () => {
  const send = vi.spyOn(window.parent, 'postMessage').mockImplementation((message) => {
    structuredClone(message)
  })
  const command = (type: string) =>
    [...send.mock.calls].reverse().find(([value]) => value.pluginMessage.type === type)![0]
      .pluginMessage
  const wrapper = mount(SelectionPreview, { attachTo: document.body })
  reply({
    type: 'collection-options',
    requestId: command('list-collections').requestId,
    collections: [],
  })
  reply({
    type: 'preview-result',
    requestId: 1,
    swatches: [swatch, { ...swatch, id: 'two', name: 'Brand/200' }],
    skipped: [],
  })
  await flushPromises()
  reply({
    type: 'collection-review',
    requestId: command('review-collection').requestId,
    collectionName: 'Colors',
    collectionError: '',
    issues: [],
    canCreate: true,
    rows: ['one', 'two'].map((id) => ({
      id,
      relativeName: id === 'one' ? 'Brand/100' : 'Brand/200',
      included: true,
      fullPath: id === 'one' ? 'Brand/100' : 'Brand/200',
      status: 'ready',
      message: '',
    })),
  })
  await flushPromises()
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Create 2 variables')!
    .trigger('click')
  const previous = {
    type: 'creation-result',
    requestId: command('create-collection').requestId,
    collectionName: 'Colors',
    collectionId: 'created',
    collectionEmpty: false,
    created: 1,
    updated: 0,
    excluded: 0,
    unsupported: 0,
    failed: 1,
    errors: [{ id: 'two', name: 'Brand/200', message: 'Assignment failed' }],
  }
  reply(previous)
  await flushPromises()
  expect(wrapper.text()).toContain('Retry failed')
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Back to preview')!
    .trigger('click')
  const recovery = command('recover-collection')
  reply({
    type: 'recovery-preview',
    requestId: recovery.requestId,
    previous,
    destination: { kind: 'existing', id: 'created' },
    preview: {
      type: 'preview-result',
      requestId: recovery.requestId,
      swatches: [{ ...swatch, id: 'two', name: 'Brand/200' }],
      skipped: [],
    },
    items: [{ id: 'two', relativeName: 'Brand/200', included: true }],
  })
  await flushPromises()
  expect(wrapper.text()).toContain('1 created')
  expect(wrapper.text()).toContain('locked')
  expect(document.activeElement?.textContent?.trim()).toBe('Refresh selection')
  expect(wrapper.findAll('input[type="text"]')).toHaveLength(1)
  await wrapper.get('input[type="text"]').setValue('Corrected/200')
  expect(command('review-collection')).toMatchObject({
    destination: { kind: 'existing', id: 'created' },
    items: [{ id: 'two', relativeName: 'Corrected/200', included: true }],
  })
  wrapper.unmount()
})
