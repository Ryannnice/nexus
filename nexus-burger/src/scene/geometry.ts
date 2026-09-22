import * as THREE from 'three'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'

export function random(seed = 428) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function surface(
  uSteps: number,
  vSteps: number,
  fn: (u: number, v: number) => THREE.Vector3,
  reverse = false
) {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = []
  for (let v = 0; v <= vSteps; v++)
    for (let u = 0; u <= uSteps; u++) {
      const p = fn(u / uSteps, v / vSteps)
      positions.push(p.x, p.y, p.z)
      uvs.push(u / uSteps, v / vSteps)
    }
  for (let v = 0; v < vSteps; v++)
    for (let u = 0; u < uSteps; u++) {
      const a = v * (uSteps + 1) + u,
        b = a + uSteps + 1
      if (reverse) indices.push(a, a + 1, b, b, a + 1, b + 1)
      else indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function bunGeometry(top: boolean) {
  const noise = new SimplexNoise({ random: random(top ? 211 : 419) })
  const points = top
    ? [
        [0, -0.055],
        [0.8, -0.055],
        [1.24, -0.045],
        [1.41, 0.015],
        [1.47, 0.14],
        [1.4, 0.36],
        [1.22, 0.63],
        [0.91, 0.84],
        [0.48, 0.98],
        [0, 1.035],
      ]
    : [
        [0, -0.245],
        [0.95, -0.245],
        [1.3, -0.21],
        [1.42, -0.12],
        [1.45, 0.05],
        [1.39, 0.19],
        [1.22, 0.25],
        [0.7, 0.26],
        [0, 0.265],
      ]
  const curve = new THREE.SplineCurve(points.map((p) => new THREE.Vector2(p[0], p[1])))
  const geometry = new THREE.LatheGeometry(curve.getPoints(70), 160)
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i),
      y = position.getY(i),
      z = position.getZ(i)
    const theta = Math.atan2(z, x),
      r = Math.hypot(x, z)
    const irregular = 1 + 0.012 * Math.sin(theta * 5 + 0.9) + 0.008 * Math.sin(theta * 9 - y * 2)
    const grain =
      0.003 * noise.noise3d(x * 58, y * 58, z * 58) + 0.008 * noise.noise3d(x * 8, y * 8, z * 8)
    const wrinkles =
      0.006 *
      Math.sin(theta * 47 + noise.noise3d(x * 6, y * 6, z * 6) * 2) *
      Math.exp(-(((y - 0.1) * 7) ** 2))
    position.setXYZ(
      i,
      x * (irregular + wrinkles),
      (y + grain * Math.min(1, r * 4) + 0.012 * Math.sin(x * 3) * Math.cos(z * 4)) *
        (top ? 0.72 : 1),
      z * (irregular + wrinkles)
    )
  }
  geometry.computeVertexNormals()
  return geometry
}

export function pattyGeometry() {
  const noise = new SimplexNoise({ random: random(281) })
  return surface(
    160,
    110,
    (u, v) => {
      const a = u * Math.PI * 2
      const edge = 1.42 + 0.025 * Math.sin(a * 11 + 0.8) + 0.015 * Math.sin(a * 29)
      let r: number, y: number
      if (v < 0.42) {
        r = (v / 0.42) * edge
        y = 0.176 + 0.026 * (1 - (r / edge) ** 2)
      } else if (v > 0.58) {
        r = (1 - (v - 0.58) / 0.42) * edge
        y = -0.176
      } else {
        const t = ((v - 0.42) / 0.16) * Math.PI
        r = edge + Math.sin(t) * 0.014
        y = Math.cos(t) * 0.176
      }
      const x = Math.cos(a) * r,
        z = Math.sin(a) * r
      y +=
        (0.012 * noise.noise3d(x * 21, y * 21, z * 21) +
          0.006 * noise.noise3d(x * 57, y * 57, z * 57)) *
        Math.min(1, r * 3)
      return new THREE.Vector3(x, y, z)
    },
    true
  )
}

export function cheeseGeometry() {
  return surface(
    192,
    80,
    (u, v) => {
      const a = u * Math.PI * 2
      const edge = 1.34 / (Math.abs(Math.cos(a)) ** 10 + Math.abs(Math.sin(a)) ** 10) ** 0.1
      const t = v < 0.48 ? v / 0.48 : v > 0.52 ? (1 - v) / 0.48 : 1
      const r = t * edge
      const x = Math.cos(a) * r,
        z = Math.sin(a) * r
      const thickness =
        v < 0.48 ? 0.014 : v > 0.52 ? -0.014 : 0.014 * Math.cos(((v - 0.48) / 0.04) * Math.PI)
      const sag = Math.max(0, r - 1.06) ** 1.5 * 0.36
      const wrinkle =
        0.018 * Math.sin(x * 3.6 + 0.4) * Math.cos(z * 3) + 0.004 * Math.sin(a * 17) * t ** 6
      return new THREE.Vector3(x, 0.035 - sag + wrinkle + thickness, z)
    },
    true
  )
}

export function leafGeometry(seed: number) {
  return surface(
    112,
    36,
    (u, v) => {
      const a = u * Math.PI * 2,
        r = v
      const edge = 1 + 0.1 * Math.sin(a * 5 + seed) + 0.04 * Math.sin(a * 13 - seed)
      const x = Math.cos(a) * r * edge * 0.84
      const z = Math.sin(a) * r * edge * 0.88
      const curl = 0.11 * r * r * Math.sin(a * 5 + seed) + 0.038 * r ** 5 * Math.sin(a * 19 + r * 6)
      const ribs = 0.009 * Math.sin(a * 27 + r * 15) * r ** 2
      return new THREE.Vector3(x, 0.055 * r + curl + ribs - 0.1 * r * r, z)
    },
    true
  )
}

export function eggGeometry() {
  const noise = new SimplexNoise({ random: random(370) })
  return surface(
    128,
    56,
    (u, v) => {
      const a = u * Math.PI * 2,
        t = v * Math.PI
      const r =
        Math.sin(t) *
        (1.04 + 0.085 * Math.sin(a * 3 + 1) + 0.055 * Math.sin(a * 7) + 0.023 * Math.sin(a * 13))
      return new THREE.Vector3(
        Math.cos(a) * r,
        Math.cos(t) * 0.064 +
          0.019 * Math.sin(a * 9) * Math.sin(t) +
          0.009 *
            noise.noise3d(Math.cos(a) * r * 12, Math.cos(t) * 3, Math.sin(a) * r * 12) *
            Math.sin(t),
        Math.sin(a) * r * 0.9
      )
    },
    true
  )
}

export function veinGeometry(angle: number, seed: number) {
  const points = Array.from({ length: 16 }, (_, i) => {
    const r = 0.05 + (i / 15) * 0.79
    const edge = 1 + 0.1 * Math.sin(angle * 5 + seed) + 0.04 * Math.sin(angle * 13 - seed)
    const y =
      0.055 * r +
      0.11 * r * r * Math.sin(angle * 5 + seed) +
      0.038 * r ** 5 * Math.sin(angle * 19 + r * 6) +
      0.009 * Math.sin(angle * 27 + r * 15) * r * r -
      0.1 * r * r
    return new THREE.Vector3(
      Math.cos(angle) * r * edge * 0.84,
      y + 0.005,
      Math.sin(angle) * r * edge * 0.88
    )
  })
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.0035, 4, false)
}

export function sesameTransforms() {
  const rng = random(41),
    dummy = new THREE.Object3D(),
    matrices: THREE.Matrix4[] = [],
    colors: THREE.Color[] = []
  const profile = new THREE.SplineCurve(
    [
      [0, -0.055],
      [0.8, -0.055],
      [1.24, -0.045],
      [1.41, 0.015],
      [1.47, 0.14],
      [1.4, 0.36],
      [1.22, 0.63],
      [0.91, 0.84],
      [0.48, 0.98],
      [0, 1.035],
    ].map((p) => new THREE.Vector2(...(p as [number, number])))
  )
    .getPoints(600)
    .filter((p) => p.y > 0.15)
  for (let i = 0; i < 205; i++) {
    const a = rng() * Math.PI * 2,
      r = Math.sqrt(rng()) * 1.33
    const y = profile.reduce((best, p) => (Math.abs(p.x - r) < Math.abs(best.x - r) ? p : best)).y
    const theta = a
    const irregular = 1 + 0.012 * Math.sin(theta * 5 + 0.9) + 0.008 * Math.sin(theta * 9 - y * 2)
    const x = Math.cos(a) * r,
      z = Math.sin(a) * r
    dummy.position.set(
      x * irregular,
      (y + 0.012 * Math.sin(x * 3) * Math.cos(z * 4)) * 0.72 + 0.013,
      z * irregular
    )
    const normal = new THREE.Vector3(Math.cos(a) * r * 0.65, 1, Math.sin(a) * r * 0.65).normalize()
    dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
    dummy.rotateY(rng() * Math.PI)
    dummy.scale.set(0.012 + rng() * 0.006, 0.007, 0.035 + rng() * 0.018)
    dummy.updateMatrix()
    matrices.push(dummy.matrix.clone())
    colors.push(new THREE.Color().setHSL(0.1, 0.34 + rng() * 0.24, 0.49 + rng() * 0.3))
  }
  return { matrices, colors }
}
