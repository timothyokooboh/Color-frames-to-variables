import { readFile, writeFile } from 'node:fs/promises'
import { Resvg } from '@resvg/resvg-js'
for (const name of ['icon', 'cover']) {
  const path = `docs/release/assets/${name}`
  const svg = await readFile(`${path}.svg`, 'utf8')
  const png = new Resvg(svg, { font: { defaultFontFamily: 'Arial' } }).render().asPng()
  await writeFile(`${path}.png`, png)
  console.log(`Rendered ${path}.png`)
}
