import { useLayoutEffect, useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { random } from './geometry'
import type { CategoryId } from '../data'

type V = [number, number, number]
const steel = '#bac9cd'
const wood = '#995529'

export function Block({
  at = [0, 0, 0],
  size,
  color,
  metal = 0,
  radius = 0.03,
  rotation,
}: {
  at?: V
  size: V
  color: string
  metal?: number
  radius?: number
  rotation?: V
}) {
  return (
    <RoundedBox
      position={at}
      args={size}
      radius={Math.min(radius, ...size.map((v) => v / 2.1))}
      smoothness={2}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={metal ? 0.28 : 0.66} metalness={metal} />
    </RoundedBox>
  )
}
export function Can({
  at = [0, 0, 0],
  radius,
  height,
  color,
  metal = 0,
}: {
  at?: V
  radius: number
  height: number
  color: string
  metal?: number
}) {
  return (
    <mesh position={at} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, 32]} />
      <meshStandardMaterial color={color} metalness={metal} roughness={metal ? 0.3 : 0.65} />
    </mesh>
  )
}
function Orb({
  at,
  size,
  color,
  roughness = 0.5,
}: {
  at: V
  size: V
  color: string
  roughness?: number
}) {
  return (
    <mesh position={at} scale={size} castShadow receiveShadow>
      <sphereGeometry args={[1, 24, 16]} />
      <meshPhysicalMaterial color={color} roughness={roughness} clearcoat={0.15} />
    </mesh>
  )
}
function Wire({
  points,
  radius = 0.015,
  color = steel,
}: {
  points: V[]
  radius?: number
  color?: string
}) {
  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        28,
        radius,
        7,
        false
      ),
    [points, radius]
  )
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.24} />
    </mesh>
  )
}
function ToolHead({ knife = false }: { knife?: boolean }) {
  const geometry = useMemo(() => {
    const s = new THREE.Shape()
    if (knife) {
      s.moveTo(-0.06, 0.03)
      s.lineTo(-0.09, -0.63)
      s.quadraticCurveTo(0.24, -0.48, 0.29, -0.05)
      s.lineTo(0.29, 0.03)
      s.closePath()
    } else {
      s.moveTo(-0.19, 0.02)
      s.quadraticCurveTo(-0.25, 0.02, -0.25, -0.04)
      s.lineTo(-0.25, -0.43)
      s.quadraticCurveTo(0, -0.49, 0.25, -0.43)
      s.lineTo(0.25, -0.04)
      s.quadraticCurveTo(0.25, 0.02, 0.19, 0.02)
      s.closePath()
      for (const x of [-0.135, 0, 0.135]) {
        const hole = new THREE.Path()
        hole.moveTo(x - 0.023, -0.09)
        hole.lineTo(x - 0.023, -0.34)
        hole.absarc(x, -0.34, 0.023, Math.PI, 0, false)
        hole.lineTo(x + 0.023, -0.09)
        hole.absarc(x, -0.09, 0.023, 0, Math.PI, false)
        s.holes.push(hole)
      }
    }
    return new THREE.ExtrudeGeometry(s, {
      depth: 0.024,
      bevelEnabled: true,
      bevelSize: 0.009,
      bevelThickness: 0.008,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 12,
    })
  }, [knife])
  return (
    <mesh geometry={geometry} position={[0, 0.56, 0]} castShadow>
      <meshStandardMaterial color={steel} metalness={0.9} roughness={0.25} />
    </mesh>
  )
}
function Utensil({ variant, color }: { variant: number; color: string }) {
  const v = variant % 6
  if (v === 5)
    return (
      <group rotation={[0, 0, -0.28]}>
        <Can at={[0, 0.63, 0]} radius={0.145} height={0.71} color="#c78b47" />
        <Can at={[0, 0.63, 0]} radius={0.055} height={1.21} color={wood} />
        {[-0.25, 0.25].map((y) => (
          <Can key={y} at={[0, 0.63 + y, 0]} radius={0.15} height={0.025} color="#ab6e31" />
        ))}
      </group>
    )
  return (
    <group rotation={[0.03, -0.18, v % 2 ? 0.1 : -0.1]}>
      <Block at={[0, 1, 0]} size={[0.13, 0.53, 0.095]} color={color} radius={0.05} />
      <Can at={[0, 0.64, 0]} radius={0.038} height={0.25} color={steel} metal={0.85} />
      {[0.86, 1.14].map((y) => (
        <Orb key={y} at={[0, y, 0.05]} size={[0.025, 0.025, 0.008]} color={steel} />
      ))}
      {v < 2 && <ToolHead knife={v === 1} />}
      {v === 2 && (
        <group>
          <Block at={[0, 0.47, 0]} size={[0.3, 0.17, 0.045]} color={steel} metal={0.85} />
          {[-0.12, -0.04, 0.04, 0.12].map((x) => (
            <Block
              key={x}
              at={[x, 0.27, 0.02]}
              size={[0.035, 0.32, 0.033]}
              color={steel}
              metal={0.85}
              radius={0.016}
            />
          ))}
        </group>
      )}
      {v === 3 && (
        <group>
          <Orb at={[0, 0.32, 0]} size={[0.21, 0.29, 0.09]} color={steel} roughness={0.2} />
          <mesh position={[0, 0.34, 0.068]} scale={[0.175, 0.235, 0.029]}>
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial color="#778f94" metalness={0.92} roughness={0.17} />
          </mesh>
        </group>
      )}
      {v === 4 &&
        Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI) / 3,
            x = Math.cos(a) * 0.19,
            z = Math.sin(a) * 0.19
          return (
            <Wire
              key={i}
              radius={0.011}
              points={[
                [0, 0.57, 0],
                [x, 0.3, z],
                [x * 0.8, 0.1, z * 0.8],
                [0, 0.05, 0],
                [-x * 0.8, 0.1, -z * 0.8],
                [-x, 0.3, -z],
                [0, 0.57, 0],
              ]}
            />
          )
        })}
    </group>
  )
}

function Grains({ pepper = false }: { pepper?: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const rng = random(47),
      o = new THREE.Object3D()
    for (let i = 0; i < 110; i++) {
      const a = rng() * Math.PI * 2,
        r = Math.sqrt(rng()) * 0.18
      o.position.set(Math.cos(a) * r, 0.12 + rng() * 0.52, Math.sin(a) * r)
      o.rotation.set(rng() * 3, rng() * 3, rng() * 3)
      o.scale.setScalar(pepper ? 0.026 + rng() * 0.017 : 0.024)
      o.updateMatrix()
      mesh.current!.setMatrixAt(i, o.matrix)
      mesh.current!.setColorAt(
        i,
        new THREE.Color(
          pepper ? ['#2b201a', '#4f3929', '#6b4932'][i % 3] : ['#fff8e6', '#e3daca'][i % 2]
        )
      )
    }
    mesh.current!.instanceMatrix.needsUpdate = true
  }, [pepper])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 110]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  )
}
function Bottle({ variant, color }: { variant: number; color: string }) {
  const v = variant % 6
  const oil = v === 0,
    shaker = v === 1 || v === 2,
    mill = v === 3
  const profile = useMemo(() => {
    const p = oil
      ? [
          [0, 0],
          [0.21, 0],
          [0.23, 0.07],
          [0.23, 0.66],
          [0.18, 0.77],
          [0.075, 0.86],
          [0.07, 1.17],
          [0, 1.17],
        ]
      : mill
        ? [
            [0, 0],
            [0.24, 0],
            [0.24, 0.12],
            [0.13, 0.35],
            [0.13, 0.59],
            [0.23, 0.72],
            [0.25, 0.9],
            [0.19, 1.02],
            [0, 1.06],
          ]
        : [
            [0, 0],
            [0.2, 0],
            [0.23, 0.06],
            [0.23, 0.65],
            [0.19, 0.77],
            [0.16, 0.8],
            [0, 0.8],
          ]
    return new THREE.LatheGeometry(
      p.map(([x, y]) => new THREE.Vector2(x, y)),
      40
    )
  }, [oil, mill])
  return (
    <group rotation={[0, 0.08, 0]}>
      <mesh geometry={profile} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={oil ? '#7b792e' : mill ? '#643315' : shaker ? '#dce6df' : color}
          metalness={0.04}
          roughness={mill ? 0.36 : 0.19}
          clearcoat={0.5}
          clearcoatRoughness={0.18}
          transparent={shaker}
          opacity={shaker ? 0.28 : 1}
          depthWrite={!shaker}
        />
      </mesh>
      {shaker && (
        <>
          <Can
            at={[0, 0.32, 0]}
            radius={0.172}
            height={0.49}
            color={v === 1 ? '#ece6d5' : '#49352a'}
          />
          <Grains pepper={v === 2} />
        </>
      )}
      {!mill && (
        <Can
          at={[0, oil ? 1.18 : 0.82, 0]}
          radius={oil ? 0.085 : 0.215}
          height={oil ? 0.13 : 0.12}
          color={oil ? '#a68b45' : v === 4 ? '#c13e22' : steel}
          metal={oil ? 0.55 : 0.7}
        />
      )}
      {mill && <Orb at={[0, 1.11, 0]} size={[0.045, 0.025, 0.045]} color={steel} />}
      {shaker &&
        [0, 1, 2, 3, 4].map((i) => (
          <Orb
            key={i}
            at={[Math.cos(i * 1.25) * 0.09, 0.882, Math.sin(i * 1.25) * 0.09]}
            size={[0.02, 0.005, 0.02]}
            color="#333733"
          />
        ))}
      {!mill && (
        <Block
          at={[0, oil ? 0.43 : 0.4, 0.225]}
          size={[0.29, 0.27, 0.01]}
          color={v === 4 ? '#f6d274' : '#fff0cf'}
          radius={0.005}
        />
      )}
      {!mill && (
        <Block
          at={[0, oil ? 0.43 : 0.4, 0.235]}
          size={[0.16, 0.018, 0.008]}
          color={oil ? '#586435' : '#a1542c'}
          radius={0.002}
        />
      )}
      {oil && (
        <Wire
          points={[
            [0.065, 1.2, 0],
            [0.18, 1.25, 0],
            [0.22, 1.18, 0],
          ]}
          radius={0.028}
          color="#b2a375"
        />
      )}
    </group>
  )
}
function Garden({ variant }: { variant: number }) {
  const v = variant % 5
  if (v === 0 || v === 4)
    return (
      <group rotation={[0, v === 4 ? -0.22 : 0.18, -0.035]}>
        <Orb
          at={[0, 0.45, 0]}
          size={[0.32, 0.45, 0.22]}
          color={v === 4 ? '#a4aa74' : '#d9bf85'}
          roughness={0.94}
        />
        <Block at={[0, 0.89, 0]} size={[0.51, 0.055, 0.13]} color="#aa8c56" />
        <Block at={[0, 0.49, 0.207]} size={[0.34, 0.35, 0.025]} color="#eee6c7" />
        <Orb at={[-0.045, 0.54, 0.235]} size={[0.07, 0.12, 0.018]} color="#598749" />
        <Orb at={[0.05, 0.49, 0.238]} size={[0.065, 0.1, 0.017]} color="#7a9e4b" />
        {[-0.18, 0.18].map((x) => (
          <Wire
            key={x}
            color="#b69967"
            radius={0.005}
            points={[
              [x, 0.13, 0.14],
              [x * 1.3, 0.45, 0.17],
              [x, 0.83, 0.1],
            ]}
          />
        ))}
      </group>
    )
  if (v === 1)
    return (
      <group>
        <Can at={[0, 0.35, 0]} radius={0.26} height={0.55} color="#498788" metal={0.3} />
        <Wire
          points={[
            [-0.21, 0.45, 0],
            [-0.45, 0.63, 0],
            [-0.52, 0.4, 0],
            [-0.27, 0.19, 0],
          ]}
          radius={0.042}
          color="#427d7e"
        />
        <group position={[0.24, 0.33, 0]} rotation={[0, 0, -0.65]}>
          <Can at={[0, 0.25, 0]} radius={0.045} height={0.52} color="#5d9b97" metal={0.35} />
          <Can at={[0, 0.54, 0]} radius={0.11} height={0.06} color="#9caaa0" metal={0.7} />
        </group>
        <Wire
          points={[
            [-0.15, 0.62, 0],
            [-0.12, 0.82, 0],
            [0.17, 0.82, 0],
            [0.19, 0.61, 0],
          ]}
          radius={0.034}
          color="#427d7e"
        />
      </group>
    )
  if (v === 2)
    return (
      <group>
        <Block at={[0, 0.25, 0]} size={[0.68, 0.12, 0.5]} color="#a17243" />
        {[-0.22, 0.22].map((z) => (
          <Block key={z} at={[0, 0.39, z]} size={[0.68, 0.24, 0.055]} color="#bc925c" />
        ))}
        {[-0.32, 0.32].map((x) => (
          <Block key={x} at={[x, 0.39, 0]} size={[0.055, 0.24, 0.5]} color="#bc925c" />
        ))}
        {[-0.19, 0.01, 0.2].map((x, i) => (
          <group key={x}>
            <Orb
              at={[x, 0.57, (i % 2) * 0.16 - 0.09]}
              size={[0.13, 0.13, 0.14]}
              color={i % 2 ? '#c44526' : '#cc702a'}
            />
            <Orb
              at={[x, 0.72, (i % 2) * 0.16 - 0.09]}
              size={[0.06, 0.045, 0.075]}
              color="#477240"
            />
          </group>
        ))}
      </group>
    )
  return (
    <group>
      <Can at={[0, 0.23, 0]} radius={0.23} height={0.4} color="#b36643" />
      <Can at={[0, 0.44, 0]} radius={0.25} height={0.09} color="#cc8055" />
      <Can at={[0, 0.49, 0]} radius={0.2} height={0.013} color="#4b3928" />
      <Wire
        points={[
          [0, 0.49, 0],
          [0.015, 0.75, 0],
          [-0.035, 1.13, 0],
        ]}
        color="#5f8448"
        radius={0.017}
      />
      {Array.from({ length: 5 }, (_, i) => (
        <group
          key={i}
          position={[i % 2 ? -0.09 : 0.1, 0.65 + i * 0.075, 0]}
          rotation={[0.15, i * 0.7, i % 2 ? 0.75 : -0.8]}
        >
          <Orb at={[0, 0, 0]} size={[0.095, 0.2, 0.03]} color={i % 2 ? '#518242' : '#81a754'} />
        </group>
      ))}
    </group>
  )
}
export function EggBox({ small = false }: { small?: boolean }) {
  return (
    <group scale={small ? 0.8 : 1}>
      <Block at={[0, 0.13, 0]} size={[0.78, 0.14, 0.48]} color="#b7a28d" />
      <Block
        at={[0, 0.48, -0.28]}
        size={[0.8, 0.62, 0.065]}
        color="#d1bfa6"
        rotation={[-0.24, 0, 0]}
      />
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[((i % 3) - 1) * 0.25, 0.18, i < 3 ? -0.125 : 0.125]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.105, 0.035, 8, 20]} />
            <meshStandardMaterial color="#ad967c" roughness={1} />
          </mesh>
          <Orb
            at={[0, 0.135, 0]}
            size={[0.098, 0.16, 0.097]}
            color={['#efdcba', '#f8eddb', '#bc8e62'][i % 3]}
            roughness={0.72}
          />
        </group>
      ))}
    </group>
  )
}
function Chilled({ variant }: { variant: number }) {
  const v = variant % 4
  if (v === 0 || v === 3) return <EggBox />
  if (v === 1)
    return (
      <group>
        <Block at={[0, 0.41, 0]} size={[0.4, 0.72, 0.36]} color="#efeada" />
        <Block at={[0, 0.42, 0.185]} size={[0.38, 0.32, 0.01]} color="#3e818b" />
        <Block at={[0, 0.81, 0]} size={[0.4, 0.2, 0.27]} color="#b6d4ce" rotation={[0.3, 0, 0]} />
        <Block at={[0, 0.94, -0.04]} size={[0.4, 0.03, 0.035]} color="#eee8d8" />
        <Can at={[0.08, 0.92, 0.05]} radius={0.052} height={0.045} color="#fff8e4" />
      </group>
    )
  return (
    <group>
      <Block at={[0, 0.08, 0]} size={[0.7, 0.08, 0.46]} color="#dae0d5" radius={0.04} />
      <Block at={[0, 0.23, 0]} size={[0.5, 0.22, 0.33]} color="#f5d874" radius={0.02} />
      <Block
        at={[-0.19, 0.28, 0.01]}
        size={[0.1, 0.28, 0.35]}
        color="#e8debf"
        radius={0.02}
        rotation={[0, 0, 0.3]}
      />
    </group>
  )
}

export const propName = (kind: CategoryId, index: number) => {
  if (kind === 'foundations' || kind === 'infra')
    return ['spatula', 'knife', 'fork', 'spoon', 'whisk', 'rolling-pin'][index % 6]
  if (kind === 'humanoid')
    return ['seed-sack', 'watering-can', 'vegetable-crate', 'seedling', 'compost-sack'][index % 5]
  if (kind === 'recsys')
    return ['egg-carton', 'milk-carton', 'butter-dish', 'brown-eggs'][index % 4]
  return ['olive-oil', 'salt-shaker', 'pepper-jar', 'pepper-mill', 'tomato-sauce', 'mustard'][
    index % 6
  ]
}

export function PropModel({ kind, index }: { kind: CategoryId; index: number }) {
  const color = ['#923b24', '#e2b356', '#477d72', '#9e5529', '#e2d6bb', '#48677b'][index % 6]
  if (kind === 'foundations' || kind === 'infra') return <Utensil variant={index} color={color} />
  if (kind === 'humanoid') return <Garden variant={index} />
  if (kind === 'recsys') return <Chilled variant={index} />
  return <Bottle variant={index} color={index % 2 ? '#c18a24' : '#ab3825'} />
}
