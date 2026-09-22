import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const folder = new URL('../artifacts/', import.meta.url)
await mkdir(folder, { recursive: true })
const browser = await chromium.launch({
  channel: 'chromium',
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const errors = [],
  failed = [],
  frames = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})
page.on('requestfailed', (request) => failed.push(request.url()))
await page.goto('http://127.0.0.1:4173/burger/?qa', { waitUntil: 'networkidle' })
await page.waitForSelector('[data-scene-ready="true"]')
for (const [name, section, fraction] of [
  ['shelf-start', '#agent', 0],
  ['shelf-moving', '#agent', 0.13],
  ['shelf-middle', '#agent', 0.51],
  ['shelf-end', '#agent', 1],
  ['arrival-flight', '.reunion', 0.43],
  ['arrival-stack', '.reunion', 0.75],
  ['arrival-spin', '.reunion', 1.02],
  ['arrival-land', '.reunion', 1.52],
  ['arrival-seated', '.reunion', 1.91],
]) {
  await page.evaluate(
    ({ section, fraction }) => {
      const el = document.querySelector(section)
      const distance =
        section === '.reunion' ? innerHeight * fraction : (el.offsetHeight - innerHeight) * fraction
      scrollTo({ top: el.getBoundingClientRect().top + scrollY + distance, behavior: 'instant' })
    },
    { section, fraction }
  )
  await page.waitForTimeout(1700)
  await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, folder)) })
  const state = await page.locator('canvas').evaluate((canvas) => ({
    assembly: canvas.dataset.assembly,
    seed: canvas.dataset.assemblySeed,
    spin: canvas.dataset.burgerSpin,
    offset: canvas.dataset.recipeOffset,
    layers: JSON.parse(canvas.dataset.layers || '[]'),
  }))
  frames.push({ name, ...state })
}
await writeFile(
  new URL('motion-review.json', folder),
  JSON.stringify({ errors, failed, frames }, null, 2)
)
console.log(
  JSON.stringify(
    {
      errors,
      failed,
      frames: frames.map(({ name, assembly, offset }) => ({ name, assembly, offset })),
    },
    null,
    2
  )
)
await browser.close()
