import { chromium, expect } from '@playwright/test'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const url = 'https://ryannnice.github.io/nexus/burger/'
const local = await readFile(new URL('../../burger/index.html', import.meta.url), 'utf8')
const expected = local.match(/assets\/index-[^"\s]+\.js/)[0]
const response = await fetch(url, { cache: 'no-store' })
if (!response.ok) throw new Error(`Published page returned ${response.status}`)
const html = await response.text()
if (!html.includes(expected))
  throw new Error(`Pages is still serving an older build; expected ${expected}`)
const oldLocal = await readFile(new URL('../../index.html', import.meta.url), 'utf8')
const oldResponse = await fetch(new URL('../', url), { cache: 'no-store' })
if (!oldResponse.ok) throw new Error(`Original site returned ${oldResponse.status}`)
const oldLive = await oldResponse.text()
if (oldLive.replace(/\r\n/g, '\n').trim() !== oldLocal.replace(/\r\n/g, '\n').trim())
  throw new Error('Original homepage differs from the preserved local version')

const folder = new URL('../artifacts/', import.meta.url)
await mkdir(folder, { recursive: true })
const browser = await chromium.launch({
  channel: 'chromium',
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
})
const errors = []
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('requestfailed', (request) => errors.push(request.url()))
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await expect(page.locator('.app')).toHaveAttribute('data-scene-ready', 'true', { timeout: 30000 })
  await expect(page.locator('.resource-link')).toHaveCount(107)
  const content = JSON.parse(
    await readFile(new URL('../src/data/content.json', import.meta.url), 'utf8')
  )
  for (const school of content.schools) {
    const card = page
      .locator('.school-item')
      .filter({ has: page.getByText(school.name, { exact: true }) })
    await expect(card.locator('.school-count')).toHaveText(String(school.count))
  }
  await expect(page.locator('.brand-note')).toHaveCount(1)
  await expect(page.locator('.footer-motto')).toHaveText('我们热爱汉堡，正如我们热爱大语言模型！')
  expect(
    await page.evaluate(() => document.fonts.check('400 12px "Nexus Round"', '基础必修'))
  ).toBe(true)
  await page.locator('#join').evaluate((el) => el.scrollIntoView({ behavior: 'instant' }))
  await expect(page.locator('canvas')).toHaveAttribute('data-active-speakers', '5', {
    timeout: 30000,
  })
  await expect(page.locator('canvas')).toHaveAttribute('data-member-instances', '46')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: fileURLToPath(new URL('live-table.png', folder)) })
  expect(errors).toEqual([])
  const result = {
    url,
    asset: expected,
    originalHomepageUnchanged: true,
    members: 46,
    resources: 107,
    speakers: 5,
    errors,
    checkedAt: new Date().toISOString(),
  }
  await writeFile(new URL('live-verification.json', folder), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
} finally {
  await browser.close()
}
