import { mount, flushPromises } from '@vue/test-utils'
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
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

it('picks existing Colors by ID, edits proposed names, and creates only the reviewed paths', async () => {
  const send = vi.spyOn(window.parent, 'postMessage').mockImplementation((message) => {
    structuredClone(message)
  })
  const command = (type: string) =>
    [...send.mock.calls].reverse().find(([envelope]) => envelope.pluginMessage.type === type)![0]
      .pluginMessage
  const wrapper = mount(SelectionPreview, { attachTo: document.body })
  reply({
    type: 'collection-options',
    requestId: command('list-collections').requestId,
    collections: [
      { id: 'colors', name: 'Colors' },
      { id: 'primitives', name: 'Primitives' },
    ],
  })
  reply({ type: 'preview-result', requestId: 1, swatches: [swatch], skipped: [] })
  await flushPromises()
  expect(wrapper.get('select').element.value).toBe('existing:colors')
  expect(wrapper.text()).toContain('Colors (Existing)')
  expect(wrapper.text()).not.toContain('Colors (Create new)')
  await wrapper.get('select').setValue('existing:primitives')
  await wrapper.get('input[type="text"]').setValue('Brand/200')
  const reviewed = command('review-collection')
  expect(reviewed).toMatchObject({
    destination: { kind: 'existing', id: 'primitives' },
    items: [{ id: 'one', relativeName: 'Brand/200', included: true }],
  })
  reply({
    type: 'collection-review',
    requestId: reviewed.requestId,
    collectionName: 'Primitives',
    canCreate: true,
    collectionError: '',
    issues: [],
    rows: [
      {
        id: 'one',
        relativeName: 'Brand/200',
        fullPath: 'Colors/Brand/200',
        included: true,
        status: 'ready',
        message: '',
      },
    ],
  })
  await flushPromises()
  expect(wrapper.text()).toContain('Full variable path: Colors/Brand/200')
  const create = wrapper.findAll('button').find((button) => button.text() === 'Create 1 variable')!
  await create.trigger('click')
  await create.trigger('click')
  expect(
    send.mock.calls.filter(([envelope]) => envelope.pluginMessage.type === 'create-collection'),
  ).toHaveLength(1)
  reply({
    type: 'creation-result',
    requestId: command('create-collection').requestId,
    collectionName: 'Primitives',
    collectionId: 'primitives',
    collectionEmpty: false,
    created: 1,
    failed: 0,
    excluded: 0,
    unsupported: 0,
    errors: [],
  })
  await flushPromises()
  expect(wrapper.text()).toContain('1 created · 0 failed · 0 excluded · 0 unsupported')
  expect(document.activeElement?.textContent?.trim()).toBe('Creation results')
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Start new batch')!
    .trigger('click')
  expect(command('preview-selection').requestId).toBe(2)
  expect(
    send.mock.calls.filter(([envelope]) => envelope.pluginMessage.type === 'list-collections'),
  ).toHaveLength(2)
  wrapper.unmount()
})

it('keeps edits on selection change and lets the designer cancel or confirm refresh', async () => {
  const send = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {})
  const command = (type: string) =>
    [...send.mock.calls].reverse().find(([envelope]) => envelope.pluginMessage.type === type)![0]
      .pluginMessage
  const wrapper = mount(SelectionPreview, { attachTo: document.body })
  reply({
    type: 'collection-options',
    requestId: command('list-collections').requestId,
    collections: [],
  })
  reply({ type: 'preview-result', requestId: 1, swatches: [swatch], skipped: [] })
  await flushPromises()
  expect(wrapper.get('select').element.value).toBe('new:colors')
  await wrapper.get('input[type="text"]').setValue('Renamed/100')
  reply({ type: 'selection-changed' })
  await flushPromises()
  expect(wrapper.text()).toContain('Selection changed')
  expect(wrapper.get<HTMLInputElement>('input[type="text"]').element.value).toBe('Renamed/100')
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Refresh selection')!
    .trigger('click')
  await flushPromises()
  expect(document.body.textContent).toContain('Discard preview edits?')
  const cancel = Array.from(document.querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === 'Keep edits',
  )!
  cancel.click()
  await flushPromises()
  expect(command('preview-selection').requestId).toBe(1)
  expect(wrapper.get<HTMLInputElement>('input[type="text"]').element.value).toBe('Renamed/100')
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Refresh selection')!
    .trigger('click')
  await flushPromises()
  Array.from(document.querySelectorAll('button'))
    .find((button) => button.textContent?.trim() === 'Discard and refresh')!
    .click()
  await flushPromises()
  expect(command('preview-selection').requestId).toBe(2)
  reply({ type: 'preview-result', requestId: 2, swatches: [swatch], skipped: [] })
  await flushPromises()
  expect(wrapper.get<HTMLInputElement>('input[type="text"]').element.value).toBe('Brand/100')
  wrapper.unmount()
})

it('skips every conflicting item, disables an empty batch, and preserves a custom destination name', async () => {
  const send = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {})
  const command = (type: string) =>
    [...send.mock.calls].reverse().find(([envelope]) => envelope.pluginMessage.type === type)![0]
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
    swatches: [swatch, { ...swatch, id: 'two' }],
    skipped: [],
  })
  await flushPromises()
  await wrapper.get('select').setValue('new:custom')
  await wrapper.get('#collection-name').setValue('My Palette')
  const pending = command('review-collection')
  expect(pending.destination).toEqual({ kind: 'new', name: 'My Palette' })
  reply({
    type: 'collection-review',
    requestId: pending.requestId,
    collectionName: 'My Palette',
    canCreate: false,
    collectionError: '',
    issues: [
      { id: 'one', message: 'Duplicate' },
      { id: 'two', message: 'Duplicate' },
    ],
    rows: ['one', 'two'].map((id) => ({
      id,
      relativeName: 'Brand/100',
      fullPath: 'Brand/100',
      included: true,
      status: 'duplicate',
      message: 'Duplicate',
    })),
  })
  await flushPromises()
  const skip = wrapper.findAll('button').find((button) => button.text() === 'Skip all conflicts')!
  skip.element.focus()
  await skip.trigger('click')
  expect(document.activeElement).toBe(skip.element)
  expect(skip.attributes('aria-disabled')).toBe('true')
  const requestsAfterSkip = send.mock.calls.length
  await skip.trigger('click')
  expect(send.mock.calls).toHaveLength(requestsAfterSkip)
  expect(command('review-collection').items).toEqual([
    { id: 'one', relativeName: 'Brand/100', included: false },
    { id: 'two', relativeName: 'Brand/100', included: false },
  ])
  expect(
    wrapper
      .findAll<HTMLInputElement>('input[type="checkbox"]')
      .every((checkbox) => !checkbox.element.checked),
  ).toBe(true)
  const create = wrapper.findAll('button').find((button) => button.text() === 'Create 0 variables')!
  expect(create.attributes('aria-disabled')).toBe('true')
  await create.trigger('click')
  expect(
    send.mock.calls.some(([envelope]) => envelope.pluginMessage.type === 'create-collection'),
  ).toBe(false)
  expect(wrapper.get<HTMLInputElement>('#collection-name').element.value).toBe('My Palette')
  wrapper.unmount()
})
