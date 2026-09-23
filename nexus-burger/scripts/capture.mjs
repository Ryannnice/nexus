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
  failed = []
const captured = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('requestfailed', (r) => failed.push(r.url()))
await page.goto('http://127.0.0.1:4173/burger/?qa', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForSelector('[data-scene-ready="true"]')

async function capture(name, section) {
  await page.evaluate((id) => {
    const el = document.querySelector(id)
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' })
  }, section)
  await page.waitForTimeout(section === '#join' ? 2300 : 1800)
  await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, folder)) })
  captured.push(name)
}
await capture('desktop-hero', '#home')
await capture('desktop-foundations', '#foundations')
await capture('desktop-infra', '#infra')
await capture('desktop-agent', '#agent')
await capture('desktop-farm', '#humanoid')
await capture('desktop-griddle', '#posttraining')
await capture('desktop-eggs', '#recsys')
await capture('desktop-table', '#join')
await capture('desktop-schools', '.schools')
await capture('desktop-transition', '.table-transition')
await capture('desktop-ending', '.seat-invitation')
await page.setViewportSize({ width: 1920, height: 1080 })
await capture('wide-hero', '#home')
await capture('wide-agent', '#agent')
await capture('wide-table', '#join')
await page.setViewportSize({ width: 1366, height: 768 })
await capture('laptop-hero', '#home')
await capture('laptop-agent', '#agent')
await capture('laptop-table', '#join')
await page.setViewportSize({ width: 820, height: 1180 })
await capture('tablet-agent', '#agent')
await capture('tablet-table', '#join')
await page.setViewportSize({ width: 390, height: 844 })
await capture('mobile-hero', '#home')
await capture('mobile-agent', '#agent')
await capture('mobile-table', '#join')
await capture('mobile-schools', '.schools')
await capture('mobile-fridge', '#recsys')
await capture('mobile-ending', '.seat-invitation')
await page.setViewportSize({ width: 844, height: 390 })
await capture('landscape-hero', '#home')
await capture('landscape-agent', '#agent')
await capture('landscape-table', '#join')
const result = { errors, failed, screenshots: captured.length, captured }
await writeFile(new URL('browser-errors.json', folder), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
await browser.close()
if (errors.length || failed.length)
  throw new Error('Visual capture contains browser or resource errors')
