import { check } from './helpers'
import { runScenarios } from './scenarios'

// Separate developer-only entry point. Never imported by the shipped plugin.
figma.showUI(
  `<html><body style="font:14px system-ui;padding:20px"><h1>Native acceptance results</h1><p>This harness tests the production controller against real Figma objects. It does not test the production UI.</p><pre id="results" style="white-space:pre-wrap" role="status">Running…</pre><script>onmessage = e => { document.getElementById('results').textContent = e.data.pluginMessage; }; parent.postMessage({pluginMessage:'ready'}, '*');</script></body></html>`,
  { width: 700, height: 600 },
)
let report = 'Running…'
figma.ui.onmessage = () => figma.ui.postMessage(report)
function publish(lines: string[]) {
  report = lines.join('\n\n')
  figma.ui.postMessage(report)
}
async function run() {
  check(
    figma.currentPage.children.length === 0 &&
      (await figma.variables.getLocalVariableCollectionsAsync()).length === 0,
    'Run only in a new, empty disposable design file. No fixtures were added.',
  )
  const lines: string[] = []
  await runScenarios(async (name, scenario) => {
    const start = Date.now()
    try {
      await scenario()
      lines.push(`PASS ${name} (${Date.now() - start} ms)`)
    } catch (error) {
      lines.push(`FAIL ${name}: ${String(error)}`)
    }
    publish(lines)
  })
  lines.push('Done. Fixtures intentionally remain for native inspection and production UI checks.')
  console.log(lines.join('\n'))
  publish(lines)
}
void run().catch((error) => publish([String(error)]))
