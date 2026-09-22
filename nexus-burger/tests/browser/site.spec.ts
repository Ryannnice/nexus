import { test, expect, type Page } from '@playwright/test'
import content from '../../src/data/content.json' with { type: 'json' }

async function open(page: Page) {
  await page.goto('./?qa', { waitUntil: 'networkidle' })
  await expect(page.locator('.app')).toHaveAttribute('data-scene-ready', 'true')
}
async function readSection(page: Page, id: string) {
  await page.evaluate((selector) => {
    const el = document.querySelector(selector)!
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' })
  }, `#${id}`)
  await page.waitForTimeout(1600)
}
async function checkLayers(page: Page, mobile = false) {
  const bounds = await page.locator('canvas').getAttribute('data-layers')
  expect(bounds).toBeTruthy()
  const layers = JSON.parse(bounds!)
  expect(layers).toHaveLength(6)
  for (let i = 0; i < 6; i++) {
    const layer = layers[i]
    expect(layer.x).toBe(0)
    expect(layer.scale).toBeGreaterThanOrEqual(1)
    expect(layer.scale).toBeLessThanOrEqual(1.3)
    if (i > 0) expect(layer.y).toBeGreaterThan(layers[i - 1].y)
  }
  const active = Number(await page.locator('canvas').getAttribute('data-focus-layer'))
  const subject = layers[active]
  expect(subject.scale).toBeGreaterThan(1.28)
  expect(subject.min[0]).toBeGreaterThan(-0.06)
  expect(subject.max[0]).toBeLessThan(mobile ? 1.12 : 0.84)
  expect(subject.max[0] - subject.min[0]).toBeGreaterThan(mobile ? 0.35 : 0.3)
  expect((subject.min[1] + subject.max[1]) / 2).toBeGreaterThan(0.15)
  expect((subject.min[1] + subject.max[1]) / 2).toBeLessThan(0.7)
}

test('all 107 original links are inline, with no menus, filters, or expandable controls', async ({
  page,
  context,
}) => {
  await open(page)
  await expect(page).toHaveTitle('汉堡王 Burger King · NEXUS')
  await expect(page.locator('#hero-title')).toHaveText('BURGER KING')
  await expect(page.locator('.brand .wordmark')).toHaveText(['BURGER KING', 'BURGER KING'])
  await expect(page.locator('.hero-alias')).toContainText('NEXUS 的别称')
  await expect(page.locator('.resource-link')).toHaveCount(107)
  await expect(page.locator('dialog, button, input, details')).toHaveCount(0)
  const links = await page.locator('.resource-link').evaluateAll((els) =>
    els.map((el) => ({
      href: (el as HTMLAnchorElement).href,
      title: el.querySelector('.resource-title')!.textContent,
      target: (el as HTMLAnchorElement).target,
    }))
  )
  expect(links.map((l) => l.href).sort()).toEqual(content.resources.map((r) => r.url).sort())
  expect(links.every((l) => l.target === '_blank')).toBe(true)
  const first = content.resources[0]
  await context.route(first.url, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>Resource destination</title>' })
  )
  await readSection(page, 'foundations')
  const popup = page.waitForEvent('popup')
  await page.locator('.resource-link').first().click()
  const destination = await popup
  await expect(destination).toHaveURL(first.url)
  await destination.close()
})

test('desktop: camera close-ups follow six themes while preserving the ingredient stack', async ({
  page,
}) => {
  const errors: string[] = [],
    failed: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('requestfailed', (r) => failed.push(r.url()))
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page)
  for (const [id, layer, backdrop] of [
    ['foundations', 0, 'oven'],
    ['infra', 5, 'bakery'],
    ['agent', 2, 'deli'],
    ['humanoid', 4, 'farm'],
    ['posttraining', 1, 'griddle'],
    ['recsys', 3, 'fridge'],
    ['agent', 2, 'deli'],
    ['foundations', 0, 'oven'],
  ] as const) {
    await readSection(page, id)
    await expect(page.locator('canvas')).toHaveAttribute('data-focus-layer', String(layer))
    await expect(page.locator('canvas')).toHaveAttribute('data-backdrop', backdrop)
    await checkLayers(page)
    await expect(page.locator(`#${id} h2`)).toBeInViewport()
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(page.locator('canvas')).toHaveAttribute('data-scene-progress', '0.0000')
  await expect(page.locator('h1')).toBeInViewport()
  expect(errors).toEqual([])
  expect(failed).toEqual([])
})

test('1920-wide layout keeps the burger dominant beside physical recipes and renders every member logo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await open(page)
  await readSection(page, 'agent')
  await checkLayers(page)
  const layers = JSON.parse((await page.locator('canvas').getAttribute('data-layers'))!)
  expect(
    Math.max(...layers.map((l: { min: number[]; max: number[] }) => l.max[0] - l.min[0]))
  ).toBeGreaterThan(0.3)
  const footprint = await page.locator('canvas').evaluate((el) => {
    const targets = JSON.parse(el.dataset.recipeTargets!) as { min: number[]; max: number[] }[]
    const width =
      Math.max(...targets.map((t) => t.max[0])) - Math.min(...targets.map((t) => t.min[0]))
    const height =
      Math.max(...targets.map((t) => t.max[1])) - Math.min(...targets.map((t) => t.min[1]))
    return {
      width: width / innerWidth,
      area: (width * height) / (innerWidth * innerHeight),
    }
  })
  expect(footprint.width).toBeGreaterThan(0.27)
  expect(footprint.width).toBeLessThan(0.4)
  expect(footprint.area).toBeLessThan(0.3)
  await readSection(page, 'join')
  await expect(page.locator('canvas')).toHaveAttribute('data-table-reveal', '1.0000')
  await expect(page.locator('canvas')).toHaveAttribute('data-member-instances', '46')
  await expect(page.locator('canvas')).toHaveAttribute('data-logo-instances', '46')
  await expect(page.locator('canvas')).toHaveAttribute('data-loaded-member-logos', '46')
  const assigned = JSON.parse((await page.locator('canvas').getAttribute('data-logo-assignments'))!)
  expect(assigned).toEqual(content.schools.flatMap((s) => Array(s.count).fill(s.id)))
  await expect(page.locator('canvas')).toHaveAttribute('data-guest-seats', '1')
  await expect(page.locator('canvas')).toHaveAttribute('data-guest-material', 'white-glass')
  await expect(page.locator('.seat-callout')).toHaveCSS('opacity', '1')
  await expect(page.locator('#reunion-title')).toHaveText('一起入席，成为新的汉堡王！')
  const error = await page.evaluate(() => {
    const ghost = JSON.parse(document.querySelector('canvas')!.dataset.guestAnchor!)
    const marker = document.querySelector('.guest-anchor')!.getBoundingClientRect()
    return Math.hypot(
      marker.x + marker.width / 2 - ghost[0],
      marker.y + marker.height / 2 - ghost[1]
    )
  })
  expect(error).toBeLessThan(4)
  await expect(page.locator('.school-item')).toHaveCount(22)
  expect(
    await page
      .locator('.school-count')
      .evaluateAll((els) => els.reduce((n, el) => n + Number(el.textContent), 0))
  ).toBe(46)
  await expect(page.locator('#reunion-title')).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  await page.locator('.site-footer').scrollIntoViewIfNeeded()
  const ending = await page.evaluate(() => ({
    scene: document.querySelector('.scene-stage')!.getBoundingClientRect().bottom,
    footer: document.querySelector('.site-footer')!.getBoundingClientRect().top,
  }))
  expect(ending.scene).toBeLessThanOrEqual(ending.footer + 1)
})

test('mobile preserves focused food and direct prop links without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page)
  for (const id of ['foundations', 'infra', 'agent', 'humanoid', 'posttraining', 'recsys']) {
    await readSection(page, id)
    await checkLayers(page, true)
    const heading = await page.locator(`#${id} h2`).boundingBox()
    expect(heading!.y).toBeGreaterThan(68)
    const links = await page.locator(`#${id} [data-projected="true"]`).evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect()
        return { y: r.y, bottom: r.bottom, width: r.width }
      })
    )
    expect(links.length).toBe(6)
    for (const link of links) {
      expect(link.y).toBeGreaterThan(844 * 0.5)
      expect(link.bottom).toBeLessThan(844)
      expect(link.width).toBeGreaterThan(85)
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  await readSection(page, 'join')
  await expect(page.locator('canvas')).toHaveAttribute('data-member-instances', '46')
  await expect(page.locator('.school-item')).toHaveCount(22)
  await expect(page.locator('canvas')).toHaveAttribute('data-loaded-member-logos', '46')
  await expect(page.locator('.seat-callout')).toHaveCSS('opacity', '1')
  const label = await page.locator('.leader-text').boundingBox()
  expect(label!.x).toBeGreaterThan(0)
  expect(label!.x + label!.width).toBeLessThan(390)
  expect(label!.y + label!.height).toBeLessThan(844)
  await page
    .locator('.schools')
    .evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }))
  const firstSchool = await page.locator('.school-item').first().boundingBox()
  expect(firstSchool!.y).toBeGreaterThanOrEqual(68)
})

test('round table auto-rotates, responds to dragging and keeps native vertical scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page)
  await readSection(page, 'join')
  const angle = async () => Number(await page.locator('canvas').getAttribute('data-table-angle'))
  const start = await angle()
  await page.waitForTimeout(1000)
  expect((await angle()) - start).toBeGreaterThan(0.025)
  const before = await angle()
  await page.mouse.move(600, 500)
  await page.mouse.down()
  await expect(page.locator('canvas')).toHaveAttribute('data-dragging', 'true')
  await page.mouse.move(780, 500, { steps: 12 })
  await page.mouse.up()
  expect((await angle()) - before).toBeGreaterThan(0.9)
  await expect(page.locator('canvas')).toHaveAttribute('data-dragging', 'false')
  const y = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, -160)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(y - 100)
})

test('native scrolling exposes all 107 physical recipes and keyboard focus reaches later shelves', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await open(page)
  const seen = new Set<string>()
  for (const id of ['foundations', 'infra', 'agent', 'humanoid', 'posttraining', 'recsys']) {
    const count = content.resources.filter((r) => r.category === id).length
    const pages = Math.ceil(count / 9)
    for (let batch = 0; batch < pages; batch++) {
      await page.evaluate(
        ({ id, batch, pages }) => {
          const section = document.getElementById(id)!
          scrollTo({
            top:
              section.getBoundingClientRect().top +
              scrollY +
              ((batch + 0.2) / pages) * (section.offsetHeight - innerHeight),
            behavior: 'instant',
          })
        },
        { id, batch, pages }
      )
      await expect(page.locator('canvas')).toHaveAttribute('data-recipe-page', String(batch))
      await page.waitForTimeout(350)
      const targets = JSON.parse(
        (await page.locator('canvas').getAttribute('data-recipe-targets'))!
      ) as { id: string; min: number[]; max: number[]; meshes: number }[]
      expect(targets.length).toBe(Math.min(9, count - batch * 9))
      for (const target of targets) {
        seen.add(target.id)
        expect(target.meshes).toBeGreaterThanOrEqual(4)
        const bounds = await page.locator(`[data-resource="${target.id}"]`).boundingBox()
        expect(Math.abs(bounds!.x - target.min[0])).toBeLessThan(2)
        expect(Math.abs(bounds!.y - target.min[1])).toBeLessThan(2)
        expect(bounds!.x).toBeGreaterThan(1440 * 0.58)
        expect(bounds!.x + bounds!.width).toBeLessThan(1440)
        expect(bounds!.y + bounds!.height).toBeLessThan(900)
      }
    }
  }
  expect([...seen].sort()).toEqual(content.resources.map((r) => r.id).sort())
  await page.locator('#infra .resource-link').last().focus()
  await expect(page.locator('#infra .resource-link').last()).toHaveAttribute(
    'data-projected',
    'true'
  )
  await expect(page.locator('#infra .resource-link').last()).toBeInViewport()
  await page.locator('#members').evaluate((el) => el.scrollIntoView({ behavior: 'instant' }))
  await expect(page.locator('.schools-heading')).toBeInViewport()
  await expect(page.locator('.table-transition')).toHaveCSS('background-color', 'rgb(51, 86, 74)')
})

test('icon navigation and reduced motion still follow the document', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  await open(page)
  await expect(page.locator('.app')).toHaveClass(/is-reduced/)
  await page.getByRole('link', { name: '我们的配方', exact: true }).click()
  await expect(page.locator('#foundations h2')).toBeInViewport()
  await checkLayers(page)
  await page.getByRole('link', { name: '成员院校', exact: true }).click()
  await expect(page.locator('.school-item').first()).toBeInViewport()
  await readSection(page, 'join')
  await expect(page.locator('canvas')).toHaveAttribute('data-table-reveal', '1.0000')
  await expect(page.locator('canvas')).toHaveAttribute('data-member-instances', '46')
  await expect(page.locator('.seat-callout')).toHaveCSS('opacity', '1')
  const before = Number(await page.locator('canvas').getAttribute('data-table-angle'))
  await page.waitForTimeout(400)
  expect(Number(await page.locator('canvas').getAttribute('data-table-angle'))).toBe(before)
  await page.locator('.scene-stage').focus()
  await page.keyboard.press('ArrowRight')
  await expect
    .poll(async () => Number(await page.locator('canvas').getAttribute('data-table-angle')))
    .toBeGreaterThan(before + 0.15)
  await page.getByRole('link', { name: '汉堡王 首页' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-scene-progress', '0.0000')
  await context.close()
})

test('WebGL fallback leaves all resources and institutions readable without interaction', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith('webgl') || type === 'experimental-webgl') return null
      return Reflect.apply(getContext, this, [type, ...args])
    } as typeof getContext
  })
  await open(page)
  await expect(page.locator('.app')).toHaveClass(/scene-unavailable/)
  await expect(page.locator('.scene-poster')).toBeVisible()
  await expect(page.locator('.resource-link')).toHaveCount(107)
  await expect(page.locator('.school-item')).toHaveCount(22)
  await expect(page.locator('dialog, button')).toHaveCount(0)
  await expect(page.getByRole('link', { name: '原站', exact: true })).toHaveAttribute(
    'href',
    '../index.html'
  )
})
