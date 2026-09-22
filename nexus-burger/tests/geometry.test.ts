import test from 'node:test'
import assert from 'node:assert/strict'
import { bunGeometry, eggGeometry, pattyGeometry } from '../src/scene/geometry.ts'

test('solid food meshes have outward top and bottom surfaces, with finite geometry', () => {
  for (const [name, geometry] of [
    ['bun', bunGeometry(true)],
    ['base', bunGeometry(false)],
    ['patty', pattyGeometry()],
    ['egg', eggGeometry()],
  ] as const) {
    const positions = geometry.getAttribute('position'),
      normals = geometry.getAttribute('normal')
    let topY = -Infinity,
      bottomY = Infinity
    for (let i = 0; i < positions.count; i++) {
      assert.ok(
        Number.isFinite(positions.getX(i)) &&
          Number.isFinite(positions.getY(i)) &&
          Number.isFinite(positions.getZ(i)),
        name
      )
      topY = Math.max(topY, positions.getY(i))
      bottomY = Math.min(bottomY, positions.getY(i))
    }
    let topNormal = 0,
      bottomNormal = 0
    for (let i = 0; i < positions.count; i++) {
      if (positions.getY(i) > topY - 0.03) topNormal += normals.getY(i)
      if (positions.getY(i) < bottomY + 0.03) bottomNormal += normals.getY(i)
    }
    assert.ok(topNormal > 0, `${name}: top points outwards`)
    assert.ok(bottomNormal < 0, `${name}: bottom points outwards`)
    geometry.dispose()
  }
})
