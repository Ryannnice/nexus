import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  bunGeometry,
  cheeseGeometry,
  eggGeometry,
  leafGeometry,
  pattyGeometry,
  random,
  sesameTransforms,
  veinGeometry,
} from './geometry'
import { foodMaterial } from './materials'
import { layerPose } from './timeline'
import { arrivalPose } from './arrival'
import type { MutableRefObject } from 'react'

export type MotionState = {
  spread: number
  reduced: boolean
  focus: number
  arrival?: number
  seed?: number
}

function Sesame() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(sesameTransforms, [])
  useLayoutEffect(() => {
    seeds.matrices.forEach((m, i) => {
      mesh.current!.setMatrixAt(i, m)
      mesh.current!.setColorAt(i, seeds.colors[i])
    })
    mesh.current!.instanceMatrix.needsUpdate = true
    if (mesh.current!.instanceColor) mesh.current!.instanceColor.needsUpdate = true
  }, [seeds])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, seeds.matrices.length]} castShadow>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial roughness={0.68} />
    </instancedMesh>
  )
}

function PattyCrumbs() {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const rng = random(923),
      dummy = new THREE.Object3D()
    for (let i = 0; i < 580; i++) {
      const theta = rng() * Math.PI * 2,
        r = Math.sqrt(rng()) * 1.39
      const height = 0.177 + 0.026 * (1 - (r / 1.42) ** 2)
      dummy.position.set(Math.cos(theta) * r, height + 0.002, Math.sin(theta) * r)
      dummy.rotation.set(rng(), rng() * 3, rng())
      const scale = 0.009 + rng() * 0.017
      dummy.scale.set(scale, scale * 0.35, scale * 0.78)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
      ref.current!.setColorAt(
        i,
        new THREE.Color().setHSL(0.055, 0.42 + rng() * 0.16, 0.025 + rng() * 0.055)
      )
    }
    ref.current!.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 580]} castShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.73} />
    </instancedMesh>
  )
}

function EggBlisters() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const rng = random(408),
      o = new THREE.Object3D()
    for (let i = 0; i < 90; i++) {
      const a = rng() * Math.PI * 2,
        r = 0.55 + rng() * 0.39
      o.position.set(Math.cos(a) * r, 0.03 + 0.027 * Math.sqrt(1 - r * r), Math.sin(a) * r * 0.9)
      const s = 0.007 + rng() * 0.018
      o.scale.set(s, s * 0.18, s * 0.9)
      o.updateMatrix()
      mesh.current!.setMatrixAt(i, o.matrix)
      mesh.current!.setColorAt(i, new THREE.Color(r > 0.86 && i % 3 === 0 ? '#cb8a3c' : '#f4e8c9'))
    }
    mesh.current!.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 90]} castShadow>
      <sphereGeometry args={[1, 10, 8]} />
      <meshPhysicalMaterial roughness={0.61} clearcoat={0.1} />
    </instancedMesh>
  )
}

let cutTomato: THREE.CanvasTexture | undefined
function tomatoTexture() {
  if (cutTomato) return cutTomato
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const c = canvas.getContext('2d')!,
    rng = random(152)
  const gradient = c.createRadialGradient(250, 241, 12, 256, 256, 252)
  gradient.addColorStop(0, '#f9a06c')
  gradient.addColorStop(0.23, '#e87948')
  gradient.addColorStop(0.76, '#c84a25')
  gradient.addColorStop(0.94, '#e85e31')
  gradient.addColorStop(1, '#a92613')
  c.fillStyle = gradient
  c.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 6; i++) {
    c.save()
    c.translate(256, 256)
    c.rotate((i * Math.PI) / 3 + 0.11)
    c.beginPath()
    c.ellipse(0, -145, 72, 67, 0, 0, Math.PI * 2)
    c.fillStyle = '#c14721'
    c.fill()
    c.lineWidth = 8
    c.strokeStyle = '#ed9054'
    c.stroke()
    for (let j = 0; j < 12; j++) {
      const x = (rng() - 0.5) * 91,
        y = -145 + (rng() - 0.5) * 86
      c.beginPath()
      c.ellipse(x, y, 4 + rng() * 3, 7 + rng() * 3, rng() * 2, 0, Math.PI * 2)
      c.fillStyle = '#e5b65b'
      c.shadowBlur = 6
      c.shadowColor = '#95441b'
      c.fill()
      c.shadowBlur = 0
    }
    c.restore()
  }
  const pixels = c.getImageData(0, 0, 512, 512)
  for (let i = 0; i < pixels.data.length; i += 4) {
    const noise = (rng() - 0.5) * 14
    pixels.data[i] += noise
    pixels.data[i + 1] += noise
    pixels.data[i + 2] += noise
  }
  c.putImageData(pixels, 0, 0)
  cutTomato = new THREE.CanvasTexture(canvas)
  cutTomato.colorSpace = THREE.SRGBColorSpace
  cutTomato.anisotropy = 4
  return cutTomato
}

function Lettuce({ material }: { material: THREE.Material }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        geometry: leafGeometry(i * 1.71),
        veins: [0, 1.2, 2.3, 3.3, 4.5, 5.5].map((a) => veinGeometry(a, i * 1.71)),
      })),
    []
  )
  return (
    <group>
      {leaves.map((leaf, i) => {
        const angle = (i / leaves.length) * Math.PI * 2
        return (
          <group
            key={i}
            position={[Math.cos(angle) * 0.64, (i % 2) * 0.035, Math.sin(angle) * 0.62]}
            rotation={[0.06 * Math.sin(i), angle, 0.08 * Math.cos(i)]}
          >
            <mesh geometry={leaf.geometry} material={material} castShadow receiveShadow />
            {leaf.veins.map((vein, j) => (
              <mesh key={j} geometry={vein}>
                <meshStandardMaterial color="#9caf4f" roughness={0.8} />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

function Tomato({ angle }: { angle: number }) {
  const map = useMemo(tomatoTexture, [])
  return (
    <group
      position={[Math.cos(angle) * 0.6, -0.1, Math.sin(angle) * 0.6]}
      rotation={[0.02, angle, 0.015]}
    >
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.54, 0.55, 0.11, 72]} />
        <meshPhysicalMaterial color="#b62a15" roughness={0.42} clearcoat={0.3} />
      </mesh>
      <mesh position={[0, 0.057, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.526, 64]} />
        <meshPhysicalMaterial
          map={map}
          roughness={0.38}
          clearcoat={0.32}
          clearcoatRoughness={0.35}
        />
      </mesh>
    </group>
  )
}

export function Burger({ motion }: { motion: MutableRefObject<MotionState> }) {
  const groups = useRef<(THREE.Group | null)[]>([])
  const { gl, camera, scene } = useThree()
  const point = useMemo(() => new THREE.Vector3(), [])
  const qa = useMemo(() => new URLSearchParams(location.search).has('qa'), [])
  const matrix = useMemo(() => new THREE.Matrix4(), [])
  const instance = useMemo(() => new THREE.Matrix4(), [])
  const nextReport = useRef(0)
  const geometries = useMemo(
    () => ({
      bun: bunGeometry(true),
      base: bunGeometry(false),
      meat: pattyGeometry(),
      cheese: cheeseGeometry(),
      egg: eggGeometry(),
    }),
    []
  )
  const materials = useMemo(
    () => ({
      bun: foodMaterial('bun'),
      base: foodMaterial('base'),
      meat: foodMaterial('meat'),
      cheese: foodMaterial('cheese'),
      leaf: foodMaterial('leaf'),
      egg: foodMaterial('egg'),
      yolk: foodMaterial('yolk'),
    }),
    []
  )
  const focusWeights = useRef([0, 0, 0, 0, 0, 0])
  useFrame(({ clock }, delta) => {
    groups.current.forEach((group, i) => {
      if (!group) return
      if (
        motion.current.arrival !== undefined &&
        motion.current.arrival >= 0 &&
        !motion.current.reduced
      ) {
        const flight = arrivalPose(i, motion.current.arrival, motion.current.seed ?? 1)
        group.position.set(flight.x, flight.y, flight.z)
        group.rotation.set(flight.rx, flight.ry, flight.rz)
        group.scale.set(flight.stretch, flight.squash, flight.stretch)
        return
      }
      const targetWeight = motion.current.focus === i ? 1 : 0
      focusWeights.current[i] = motion.current.reduced
        ? targetWeight
        : THREE.MathUtils.damp(focusWeights.current[i], targetWeight, 8, delta)
      const pose = layerPose(i, motion.current.spread, focusWeights.current[i])
      const sway = motion.current.reduced
        ? 0
        : Math.sin(clock.elapsedTime * 0.8 + i * 0.8) * 0.008 * motion.current.spread
      group.position.set(pose.x, pose.y + sway, pose.z)
      group.rotation.set(0, pose.rotation, i === 4 ? sway * 0.2 : 0)
      group.scale.setScalar(pose.scale)
    })
    // Opt-in QA reports actual projected mesh bounds, not just requested animation state.
    if (qa && (motion.current.reduced || clock.elapsedTime >= nextReport.current)) {
      nextReport.current = clock.elapsedTime + 0.2
      scene.updateMatrixWorld(true)
      gl.domElement.dataset.layers = JSON.stringify(
        groups.current.map((group) => {
          if (!group) return null
          const min = [Infinity, Infinity],
            max = [-Infinity, -Infinity]
          group.traverse((object) => {
            const mesh = object as THREE.Mesh
            if (!mesh.isMesh) return
            const vertices = mesh.geometry.getAttribute('position')
            const instanced = mesh as THREE.InstancedMesh
            for (let n = 0; n < (instanced.isInstancedMesh ? instanced.count : 1); n++) {
              matrix.copy(mesh.matrixWorld)
              if (instanced.isInstancedMesh) {
                instanced.getMatrixAt(n, instance)
                matrix.multiply(instance)
              }
              for (let i = 0; i < vertices.count; i++) {
                point.fromBufferAttribute(vertices, i).applyMatrix4(matrix).project(camera)
                min[0] = Math.min(min[0], (point.x + 1) / 2)
                max[0] = Math.max(max[0], (point.x + 1) / 2)
                min[1] = Math.min(min[1], (1 - point.y) / 2)
                max[1] = Math.max(max[1], (1 - point.y) / 2)
              }
            }
          })
          return {
            x: group.position.x,
            y: group.position.y,
            z: group.position.z,
            scale: group.scale.x,
            min,
            max,
          }
        })
      )
    }
  })
  return (
    <group dispose={null}>
      <group
        ref={(el) => {
          groups.current[0] = el
        }}
      >
        <mesh geometry={geometries.base} material={materials.base} castShadow receiveShadow />
      </group>
      <group
        ref={(el) => {
          groups.current[1] = el
        }}
      >
        <mesh geometry={geometries.meat} material={materials.meat} castShadow receiveShadow />
        <PattyCrumbs />
      </group>
      <group
        ref={(el) => {
          groups.current[2] = el
        }}
        rotation={[0, 0.26, 0]}
      >
        <mesh geometry={geometries.cheese} material={materials.cheese} castShadow receiveShadow />
      </group>
      <group
        ref={(el) => {
          groups.current[3] = el
        }}
      >
        <mesh geometry={geometries.egg} material={materials.egg} castShadow receiveShadow />
        <EggBlisters />
        <mesh
          position={[0.23, 0.09, 0.04]}
          scale={[0.42, 0.25, 0.4]}
          material={materials.yolk}
          castShadow
        >
          <sphereGeometry args={[1, 48, 32]} />
        </mesh>
      </group>
      <group
        ref={(el) => {
          groups.current[4] = el
        }}
      >
        <Tomato angle={0.1} />
        <Tomato angle={2.2} />
        <Tomato angle={4.2} />
        <Lettuce material={materials.leaf} />
      </group>
      <group
        ref={(el) => {
          groups.current[5] = el
        }}
      >
        <mesh geometry={geometries.bun} material={materials.bun} castShadow receiveShadow />
        <Sesame />
      </group>
    </group>
  )
}
