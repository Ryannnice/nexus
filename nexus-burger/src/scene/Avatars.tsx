import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { members } from '../data'
import { memberSeatAngle } from './seating'

type V = [number, number, number]
export function avatarStyle(index: number, school: string) {
  const purdue = school === '普渡大学'
  return {
    hair: purdue ? 'long' : ['short', 'bob', 'curly', 'long', 'bun'][index % 5],
    outfit: ['hoodie', 'suit', 'tee', 'jacket'][index % 4],
    hat: purdue ? 'none' : index % 7 === 0 ? 'cap' : index % 11 === 0 ? 'beanie' : 'none',
    glasses: index % 4 === 2,
  }
}
const definitions = [
  ['heads', 1, 'sphere'],
  ['hair', 1, 'sphere'],
  ['longhair', 1, 'capsule'],
  ['sidehair', 2, 'capsule'],
  ['buns', 3, 'sphere'],
  ['hat', 1, 'sphere'],
  ['brim', 1, 'sphere'],
  ['torsos', 1, 'capsule'],
  ['necks', 1, 'sphere'],
  ['fronts', 1, 'box'],
  ['ties', 1, 'box'],
  ['hoods', 1, 'sphere'],
  ['eyes', 2, 'sphere'],
  ['ears', 2, 'sphere'],
  ['glasses', 2, 'ring'],
  ['bridge', 1, 'box'],
  ['upper', 2, 'cylinder'],
  ['forearm', 2, 'cylinder'],
  ['hands', 2, 'sphere'],
  ['thighs', 2, 'cylinder'],
  ['shins', 2, 'cylinder'],
  ['shoes', 2, 'sphere'],
  ['seats', 1, 'box'],
  ['backs', 1, 'box'],
  ['chairlegs', 4, 'box'],
] as const

export function Avatars({ paused }: { paused: MutableRefObject<boolean> }) {
  const refs = useRef<Record<string, THREE.InstancedMesh>>({})
  const { gl } = useThree()
  const poses = useMemo(
    () =>
      members.map((m, i) => {
        const a = memberSeatAngle(i, members.length)
        return {
          x: Math.sin(a) * 7.35,
          z: Math.cos(a) * 7.35,
          a: a + Math.PI,
          style: avatarStyle(i, m.name),
          skin: new THREE.Color(['#dfab80', '#b77d56', '#e4b796', '#c79169'][i % 4]),
          hair: new THREE.Color(['#34251e', '#513827', '#242423', '#75503b'][i % 4]),
          shirt: new THREE.Color(i % 4 === 1 ? '#35464b' : m.color),
        }
      }),
    []
  )
  const math = useMemo(
    () => ({
      object: new THREE.Object3D(),
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      axis: new THREE.Vector3(0, 1, 0),
      direction: new THREE.Vector3(),
    }),
    []
  )
  const put = (
    name: string,
    instance: number,
    i: number,
    at: V,
    scale: V,
    color?: THREE.Color | string,
    rz = 0
  ) => {
    const p = poses[i],
      o = math.object,
      mesh = refs.current[name],
      k = 0.6
    o.position.set(
      p.x + (Math.cos(p.a) * at[0] + Math.sin(p.a) * at[2]) * k,
      at[1] * k - 0.5,
      p.z + (-Math.sin(p.a) * at[0] + Math.cos(p.a) * at[2]) * k
    )
    o.rotation.set(0, p.a, rz)
    o.scale.set(scale[0] * k, scale[1] * k, scale[2] * k)
    o.updateMatrix()
    mesh.setMatrixAt(instance, o.matrix)
    if (color) mesh.setColorAt(instance, typeof color === 'string' ? new THREE.Color(color) : color)
  }
  const segment = (
    name: string,
    instance: number,
    i: number,
    from: V,
    to: V,
    radius: number,
    color?: THREE.Color | string
  ) => {
    const p = poses[i],
      o = math.object,
      k = 0.6
    const world = (v: THREE.Vector3, a: V) =>
      v.set(
        p.x + (Math.cos(p.a) * a[0] + Math.sin(p.a) * a[2]) * k,
        a[1] * k - 0.5,
        p.z + (-Math.sin(p.a) * a[0] + Math.cos(p.a) * a[2]) * k
      )
    world(math.a, from)
    world(math.b, to)
    o.position.copy(math.a).add(math.b).multiplyScalar(0.5)
    math.direction.subVectors(math.b, math.a)
    const length = math.direction.length()
    o.quaternion.setFromUnitVectors(math.axis, math.direction.normalize())
    o.scale.set(radius * k, length, radius * k)
    o.updateMatrix()
    refs.current[name].setMatrixAt(instance, o.matrix)
    if (color)
      refs.current[name].setColorAt(
        instance,
        typeof color === 'string' ? new THREE.Color(color) : color
      )
  }
  const poseArm = (i: number, j: number, wave = 0, wiggle = 0) => {
    const sign = j ? 1 : -1,
      p = poses[i],
      n = i * 2 + j
    const shoulder: V = [sign * 0.28, -0.86, 0.02]
    const elbow: V = [sign * (0.4 + wave * 0.12), -1.1 + wave * 0.46, 0.28 * (1 - wave)]
    const wrist: V = [
      sign * (0.33 + wave * (0.35 + wiggle)),
      -1.17 + wave * 1.03,
      0.83 * (1 - wave) + wave * 0.04,
    ]
    segment('upper', n, i, shoulder, elbow, 0.104, p.shirt)
    segment('forearm', n, i, elbow, wrist, 0.083, i % 4 === 2 ? p.skin : p.shirt)
    put('hands', n, i, wrist, [0.096, 0.105, 0.094], p.skin)
  }
  useLayoutEffect(() => {
    poses.forEach((p, i) => {
      const { style } = p
      put('heads', i, i, [0, -0.45, 0.015], [0.235, 0.265, 0.227], p.skin)
      put('necks', i, i, [0, -0.73, 0.015], [0.08, 0.095, 0.077], p.skin)
      put('hair', i, i, [0, -0.29, -0.025], [0.244, 0.135, 0.225], p.hair)
      const long = style.hair === 'long',
        bob = style.hair === 'bob'
      put(
        'longhair',
        i,
        i,
        [0, long ? -0.64 : -0.48, -0.127],
        long ? [0.235, 0.24, 0.135] : bob ? [0.24, 0.14, 0.14] : [0, 0, 0],
        p.hair
      )
      for (let j = 0; j < 2; j++)
        put(
          'sidehair',
          i * 2 + j,
          i,
          [j ? 0.211 : -0.211, long ? -0.68 : -0.5, 0.012],
          long ? [0.07, 0.2, 0.13] : bob ? [0.073, 0.12, 0.13] : [0, 0, 0],
          p.hair
        )
      for (let j = 0; j < 3; j++)
        put(
          'buns',
          i * 3 + j,
          i,
          [(j - 1) * 0.13, style.hair === 'bun' ? -0.15 : -0.25, -0.08],
          style.hair === 'curly' || (style.hair === 'bun' && j === 1)
            ? [0.125, 0.12, 0.12]
            : [0, 0, 0],
          p.hair
        )
      const hat = style.hat !== 'none'
      put(
        'hat',
        i,
        i,
        [0, -0.245, -0.01],
        hat ? [0.264, style.hat === 'beanie' ? 0.19 : 0.105, 0.248] : [0, 0, 0],
        members[i].color
      )
      put(
        'brim',
        i,
        i,
        [0, -0.235, 0.2],
        style.hat === 'cap' ? [0.285, 0.025, 0.21] : [0, 0, 0],
        members[i].color
      )
      put('torsos', i, i, [0, -1.11, -0.005], [0.275, 0.255, 0.195], p.shirt)
      put(
        'fronts',
        i,
        i,
        [0, -1.08, 0.193],
        style.outfit === 'suit' || style.outfit === 'jacket'
          ? [0.19, 0.52, 0.022]
          : style.outfit === 'tee'
            ? [0.38, 0.055, 0.025]
            : [0, 0, 0],
        '#f3ead5'
      )
      put(
        'ties',
        i,
        i,
        [0, -1.08, 0.214],
        style.outfit === 'suit' ? [0.048, 0.26, 0.018] : [0, 0, 0],
        members[i].color
      )
      put(
        'hoods',
        i,
        i,
        [0, -0.79, -0.16],
        style.outfit === 'hoodie' ? [0.23, 0.14, 0.105] : [0, 0, 0],
        p.shirt
      )
      for (let j = 0; j < 2; j++) {
        const sign = j ? 1 : -1,
          n = i * 2 + j
        put('eyes', n, i, [sign * 0.08, -0.45, 0.226], [0.025, 0.031, 0.016], '#2b261f')
        put('ears', n, i, [sign * 0.223, -0.46, 0.015], [0.044, 0.07, 0.04], p.skin)
        put(
          'glasses',
          n,
          i,
          [sign * 0.084, -0.44, 0.249],
          style.glasses ? [1, 1, 1] : [0, 0, 0],
          '#3e3027'
        )
        poseArm(i, j)
        segment(
          'thighs',
          n,
          i,
          [sign * 0.15, -1.43, -0.04],
          [sign * 0.17, -1.84, 0.42],
          0.12,
          '#3b4241'
        )
        segment(
          'shins',
          n,
          i,
          [sign * 0.17, -1.84, 0.42],
          [sign * 0.17, -2.57, 0.43],
          0.099,
          '#3b4241'
        )
        put(
          'shoes',
          n,
          i,
          [sign * 0.17, -2.62, 0.5],
          [0.122, 0.093, 0.195],
          i % 3 ? '#e4dcc8' : '#302b25'
        )
      }
      put(
        'bridge',
        i,
        i,
        [0, -0.44, 0.25],
        style.glasses ? [0.051, 0.016, 0.012] : [0, 0, 0],
        '#3e3027'
      )
      put('seats', i, i, [0, -1.72, -0.07], [0.72, 0.12, 0.67], '#ad482d')
      put('backs', i, i, [0, -1.15, -0.36], [0.7, 0.8, 0.1], '#bd5839')
      for (let j = 0; j < 4; j++)
        put(
          'chairlegs',
          i * 4 + j,
          i,
          [j % 2 ? 0.27 : -0.27, -2.26, j < 2 ? -0.31 : 0.19],
          [0.053, 1.03, 0.053],
          '#71513b'
        )
    })
    Object.values(refs.current).forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      mesh.computeBoundingSphere()
    })
    gl.domElement.dataset.memberInstances = String(members.length)
    gl.domElement.dataset.avatarStyles = JSON.stringify(
      poses.map((p, i) => ({ school: members[i].name, ...p.style }))
    )
  }, [poses])
  useFrame(({ clock }) => {
    if (paused.current) return
    for (const i of [0, 7, 12, 18, 25, 31, 38, 44]) {
      const wave = Math.max(0, Math.sin(clock.elapsedTime * 0.43 + i * 0.91)) ** 8
      poseArm(i, 1, wave, Math.sin(clock.elapsedTime * 4 + i) * 0.075)
    }
    for (const key of ['upper', 'forearm', 'hands'])
      refs.current[key].instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      {definitions.map(([name, multiple, geometry]) => (
        <instancedMesh
          key={name}
          ref={(mesh) => {
            if (mesh) refs.current[name] = mesh
          }}
          args={[undefined, undefined, members.length * multiple]}
          castShadow
        >
          {geometry === 'sphere' ? (
            <sphereGeometry args={[1, 16, 12]} />
          ) : geometry === 'capsule' ? (
            <capsuleGeometry args={[1, 1, 4, 12]} />
          ) : geometry === 'cylinder' ? (
            <cylinderGeometry args={[1, 1, 1, 10]} />
          ) : geometry === 'ring' ? (
            <torusGeometry args={[0.064, 0.01, 6, 16]} />
          ) : (
            <boxGeometry />
          )}
          <meshStandardMaterial roughness={0.75} />
        </instancedMesh>
      ))}
    </group>
  )
}
