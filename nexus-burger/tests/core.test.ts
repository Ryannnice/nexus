import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { getSceneState, layerPose, layerBase, progressAt } from '../src/scene/timeline.ts'
import { guestAngle, memberSeatAngle, tableYaw } from '../src/scene/seating.ts'
import { arrivalPose, arrivalMotion } from '../src/scene/arrival.ts'

const content = JSON.parse(
  readFileSync(new URL('../src/data/content.json', import.meta.url), 'utf8')
)
const original = readFileSync(new URL('../../index.html', import.meta.url), 'utf8').replace(
  /<!--.*?-->/gs,
  ''
)

test('all public resources preserve the original destination and category', () => {
  assert.equal(content.resources.length, 107)
  assert.equal(new Set(content.resources.map((r: { id: string }) => r.id)).size, 107)
  const expected = {
    foundations: 16,
    infra: 26,
    posttraining: 16,
    agent: 23,
    recsys: 8,
    humanoid: 18,
  }
  for (const [category, count] of Object.entries(expected))
    assert.equal(
      content.resources.filter((r: { category: string }) => r.category === category).length,
      count
    )
  for (const resource of content.resources) {
    assert.match(resource.url, /^https:\/\//)
    assert.ok(
      original.includes(resource.url.replaceAll('&', '&amp;')) || original.includes(resource.url),
      `Missing source link: ${resource.id}`
    )
  }
})

test('only visible institutions are public; every logo resolves locally', () => {
  const cards = original.match(/class="card has-corner member-card"/g) || []
  assert.equal(content.schools.length, cards.length)
  assert.equal(content.schools.length, 22)
  assert.equal(
    content.schools.reduce((n: number, s: { count: number }) => n + s.count, 0),
    46
  )
  assert.ok(!content.schools.some((s: { abbr: string }) => s.abbr === 'HAUT'))
  const sourceMembers = [
    ...original.matchAll(/<article class="card has-corner member-card">(.*?)<\/article>/gs),
  ].map(([, card]) => ({
    name: card.match(/class="member-cn">(.*?)<\//s)![1],
    count: Number(card.match(/class="member-count">[×x](\d+)/)?.[1] || 1),
  }))
  assert.deepEqual(
    content.schools.map((s: { name: string; count: number }) => ({ name: s.name, count: s.count })),
    sourceMembers
  )
  for (const school of content.schools)
    assert.ok(existsSync(new URL(`../public/${school.logo}`, import.meta.url)))
})

test('scroll endpoints close every ingredient exactly and expose the round table', () => {
  assert.equal(getSceneState(0).spread, 0)
  assert.equal(getSceneState(1).spread, 0)
  assert.equal(getSceneState(1).table, 1)
  for (let i = 0; i < 6; i++) {
    assert.equal(layerPose(i, 0).y, layerBase[i])
    assert.equal(Math.abs(layerPose(i, 0).x), 0)
    assert.equal(Math.abs(layerPose(i, 0).rotation), 0)
  }
})

test('timeline is deterministic, continuous, reversible, and safe under invalid progress', () => {
  const forward = Array.from({ length: 1001 }, (_, i) => getSceneState(i / 1000))
  for (let i = 1000; i >= 0; i--) {
    assert.deepEqual(getSceneState(i / 1000), forward[i])
    assert.ok(Object.values(forward[i]).every(Number.isFinite))
    assert.ok(forward[i].spread >= 0 && forward[i].spread <= 1)
    if (i > 0)
      for (const key of ['spread', 'dock', 'table'] as const)
        assert.ok(
          Math.abs(forward[i][key] - forward[i - 1][key]) < 0.1,
          `Discontinuity at ${i}: ${key}`
        )
  }
  assert.deepEqual(getSceneState(NaN), getSceneState(0))
  assert.deepEqual(getSceneState(-9), getSceneState(0))
  assert.deepEqual(getSceneState(9), getSceneState(1))
})

test('expanded layers keep their vertical order without intersecting', () => {
  for (let focus = 0; focus < 6; focus++) {
    for (let i = 0; i < 6; i++) {
      const pose = layerPose(i, 1, i === focus ? 1 : 0)
      assert.equal(pose.x, 0)
      assert.ok(pose.scale >= 1 && pose.scale <= 1.3)
      if (i > 0) assert.ok(pose.y - layerPose(i - 1, 1).y > 0.6)
    }
  }
})

test('46 members have distinct seats and leave a separate foreground invitation', () => {
  const angles = Array.from({ length: 46 }, (_, i) => memberSeatAngle(i, 46))
  assert.equal(new Set(angles).size, 46)
  const positions = [guestAngle, ...angles]
  const ordered = positions.map((a) => (a + tableYaw) % (2 * Math.PI)).sort((a, b) => a - b)
  assert.ok(Math.abs(guestAngle + tableYaw) < 0.001)
  for (let i = 1; i < ordered.length; i++) assert.ok(ordered[i] - ordered[i - 1] > 0.12)
  assert.ok(2 * Math.PI - ordered.at(-1)! + ordered[0] > 0.12)
})

test('document positions control progress without a fixed page height', () => {
  const anchors = [
    { y: 0, value: 0 },
    { y: 900, value: 0.17 },
    { y: 2450, value: 0.24 },
    { y: 2800, value: 0.27 },
  ]
  assert.equal(progressAt(900, anchors), 0.17)
  assert.equal(progressAt(2450, anchors), 0.24)
  assert.equal(progressAt(-100, anchors), 0)
  assert.equal(progressAt(3000, anchors), 1)
  assert.equal(progressAt(10, []), 0)
})

test('random entrance paths are reversible and every ingredient settles exactly onto the burger', () => {
  for (let i = 0; i < 6; i++) {
    const path = Array.from({ length: 101 }, (_, n) => arrivalPose(i, n / 100, 42))
    for (let n = 100; n >= 0; n--) {
      assert.deepEqual(arrivalPose(i, n / 100, 42), path[n])
      assert.ok(
        Object.values(path[n]).every(
          (value) => typeof value === 'boolean' || Number.isFinite(value)
        )
      )
    }
    assert.notEqual(arrivalPose(i, 0.1, 42).x, arrivalPose(i, 0.1, 729).x)
    assert.equal(Math.abs(path[100].x), 0)
    assert.equal(path[100].y, layerBase[i])
    assert.equal(path[100].squash, 1)
    assert.equal(path[100].landed, true)
  }
  assert.equal(arrivalMotion(1).lift, 0)
  assert.equal(arrivalMotion(1).glow, 1)
  assert.ok(arrivalMotion(0.7).spin > Math.PI * 4)
})
