import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Script } from 'node:vm'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'))
const [controller, html] = await Promise.all([
  readFile(new URL(manifest.main, root), 'utf8'),
  readFile(new URL(manifest.ui, root), 'utf8'),
])

assert.deepEqual(manifest.networkAccess.allowedDomains, ['none'])
assert.ok(html.includes('id="app"'), 'UI mount point is missing')
assert.ok(/<script\b/.test(html), 'UI JavaScript must be embedded')
assert.ok(/<style\b/.test(html), 'UI CSS must be embedded')
assert.ok(!/<script\b[^>]*\bsrc\s*=/i.test(html), 'UI must not load external scripts')
assert.ok(!/<link\b[^>]*\brel=["']stylesheet/i.test(html), 'UI must inline stylesheets')
assert.ok(!/\b(?:import|export)\s/.test(controller), 'Sandbox must be a standalone IIFE')
new Script(controller, { filename: manifest.main })
process.stdout.write('Verified self-contained UI, standalone sandbox, and offline manifest.\n')
