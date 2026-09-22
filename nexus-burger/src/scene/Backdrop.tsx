import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Block, PropModel } from './PropModels'

export type StageView = {
  theme: number
  height: number
  targetY: number
  table: number
  reduced: boolean
  recipes: boolean
}
type V = [number, number, number]

function Box({
  at,
  size,
  color,
  metal = 0,
  rotation,
}: {
  at: V
  size: V
  color: string
  metal?: number
  rotation?: V
}) {
  return (
    <mesh position={at} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={metal} roughness={metal ? 0.36 : 0.78} />
    </mesh>
  )
}
function Cylinder({
  at,
  radius,
  height,
  color,
  metal = 0,
}: {
  at: V
  radius: number
  height: number
  color: string
  metal?: number
}) {
  return (
    <mesh position={at} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, 24]} />
      <meshStandardMaterial color={color} roughness={metal ? 0.28 : 0.7} metalness={metal} />
    </mesh>
  )
}
function Counter({ color = '#b78959', top = '#dfc29b' }: { color?: string; top?: string }) {
  return (
    <group>
      <Box at={[0, -2.65, -3]} size={[19, 1.6, 7]} color={color} />
      <Box at={[0, -1.79, -3]} size={[19, 0.18, 7.2]} color={top} />
      {Array.from({ length: 10 }, (_, i) => (
        <Box key={i} at={[-8.5 + i * 1.9, -1.69, -3]} size={[0.012, 0.008, 7]} color="#906c4a" />
      ))}
    </group>
  )
}
function Tiles({ dark = false }: { dark?: boolean }) {
  return (
    <group>
      <Box at={[0, 1, -6.1]} size={[24, 10, 0.3]} color={dark ? '#364440' : '#e6dac0'} />
      {Array.from({ length: 10 }, (_, i) => (
        <Box
          key={i}
          at={[0, -3 + i * 0.8, -5.935]}
          size={[24, 0.022, 0.012]}
          color={dark ? '#55605a' : '#cfc1a8'}
        />
      ))}
      {Array.from({ length: 17 }, (_, i) => (
        <Box
          key={i}
          at={[-12 + i * 1.5, 1, -5.93]}
          size={[0.018, 10, 0.012]}
          color={dark ? '#55605a' : '#cfc1a8'}
        />
      ))}
    </group>
  )
}

function Oven({ bakery = false }: { bakery?: boolean }) {
  const coils = useMemo(
    () =>
      [-1, 2.35].map(
        (y) =>
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(
              Array.from(
                { length: 84 },
                (_, i) =>
                  new THREE.Vector3(-5.1 + (i / 83) * 6.7, y + Math.sin(i * 0.9) * 0.085, -4.7)
              )
            ),
            160,
            0.025,
            6,
            false
          )
      ),
    []
  )
  if (bakery)
    return (
      <group>
        <Tiles />
        <Counter color="#866047" top="#c59a63" />
        <Block at={[-2.3, 1.3, -5.8]} size={[9.1, 6.2, 0.3]} color="#b98962" radius={0.25} />
        <Block at={[-2.3, 1.3, -5.57]} size={[8.6, 5.7, 0.15]} color="#cad9ba" radius={0.6} />
        {[-5.2, -2.3, 0.6].map((x) => (
          <Block key={x} at={[x, 1.3, -5.4]} size={[0.11, 5.6, 0.12]} color="#e7d3b4" />
        ))}
        <Block at={[-2.3, 1.3, -5.4]} size={[8.6, 0.12, 0.12]} color="#e7d3b4" />
        <group position={[-5.7, -1.6, -2.2]} scale={1.3}>
          <Block at={[0, 0.12, 0]} size={[1.8, 0.25, 1.3]} color="#933d2c" radius={0.1} />
          <Block at={[-0.6, 0.95, -0.15]} size={[0.55, 1.75, 0.6]} color="#ac4932" radius={0.18} />
          <Block at={[0.1, 1.85, -0.08]} size={[1.9, 0.7, 0.8]} color="#a9412c" radius={0.3} />
          <Cylinder at={[0.68, 1.18, 0]} radius={0.04} height={0.7} color="#aeb6b1" metal={0.9} />
          <mesh position={[0.52, 0.47, 0.07]} scale={[0.66, 0.53, 0.65]}>
            <sphereGeometry args={[1, 40, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial
              color="#b5c6bf"
              metalness={0.8}
              roughness={0.24}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
        <group position={[-6.8, -1.67, -0.4]} scale={1.6}>
          <PropModel kind="humanoid" index={0} />
        </group>
        <group position={[-4.1, -1.67, -2.5]} scale={1.4} rotation={[0, 0, -0.3]}>
          <PropModel kind="infra" index={5} />
        </group>
      </group>
    )
  return (
    <group>
      <Tiles />
      <Counter color="#815a3c" top="#bc915a" />
      <Block at={[-1.7, 1, -5.4]} size={[9.3, 6.4, 1.15]} color="#883c2c" radius={0.19} />
      <Block at={[-1.7, 0.65, -4.76]} size={[7.6, 4.7, 0.22]} color="#252722" radius={0.15} />
      <Box at={[-1.7, 0.65, -4.58]} size={[7.1, 4.25, 0.08]} color="#4c3020" metal={0.3} />
      {[-5.25, 1.85].map((x) => (
        <Box key={x} at={[x, 0.65, -4.12]} size={[0.11, 4.25, 1]} color="#706653" metal={0.7} />
      ))}
      {[-0.78, 0.46, 1.7].map((y) => (
        <group key={y}>
          {Array.from({ length: 22 }, (_, i) => (
            <Box
              key={i}
              at={[-5.1 + i * 0.32, y, -4.06]}
              size={[0.025, 0.028, 1.24]}
              color="#a09b87"
              metal={0.85}
            />
          ))}
          <Box at={[-1.7, y, -3.4]} size={[7, 0.04, 0.04]} color="#b7b2a1" metal={0.9} />
        </group>
      ))}
      {coils.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshStandardMaterial color="#d16c25" emissive="#e9731b" emissiveIntensity={1.9} />
        </mesh>
      ))}
      <Block at={[-1.7, 3.9, -4.72]} size={[8.4, 0.45, 0.15]} color="#ae7a4a" metal={0.55} />
      {[-4.8, -3.8, -0.25, 0.75, 1.75].map((x) => (
        <group key={x} position={[x, 3.9, -4.51]} rotation={[Math.PI / 2, 0, 0]}>
          <Cylinder at={[0, 0, 0]} radius={0.18} height={0.19} color="#31352f" metal={0.3} />
          <Box at={[0, -0.12, 0.08]} size={[0.025, 0.008, 0.11]} color="#ebd7a7" />
        </group>
      ))}
      <group position={[-1.7, -1.5, -3.8]} rotation={[-0.65, 0, 0]}>
        <Block at={[0, -0.85, 0]} size={[7.75, 1.7, 0.17]} color="#6b3024" radius={0.1} />
        <Block at={[0, -0.75, 0.12]} size={[6.6, 1.12, 0.03]} color="#2f2c21" metal={0.35} />
        <Block at={[0, -1.46, 0.25]} size={[6, 0.13, 0.16]} color="#c4ac80" metal={0.7} />
      </group>
      <group position={[-7, -1.7, -2]} scale={1.5}>
        <PropModel kind="humanoid" index={0} />
      </group>
    </group>
  )
}
function Deli() {
  return (
    <group>
      <Box at={[0, 1, -6]} size={[24, 10, 0.2]} color="#557668" />
      {Array.from({ length: 16 }, (_, i) => (
        <Box key={i} at={[-12 + i * 1.5, 1, -5.85]} size={[0.035, 10, 0.01]} color="#81977c" />
      ))}
      <Counter color="#ad6245" top="#edddbd" />
      {Array.from({ length: 16 }, (_, i) => (
        <Box
          key={i}
          at={[-9 + i * 1.2, 3.6, -4.6]}
          size={[1.17, 0.55, 2]}
          color={i % 2 ? '#eee1bd' : '#bb573e'}
          rotation={[0.1, 0, 0]}
        />
      ))}
      <Block at={[-1.5, -1.54, -2.1]} size={[9, 0.18, 3.8]} color="#b48b50" radius={0.15} />
      <Cylinder at={[-5.8, -1.4, -2.3]} radius={1.1} height={0.6} color="#dda632" />
      <Cylinder at={[-5.8, -1.05, -2.3]} radius={0.9} height={0.1} color="#efc44e" />
      <group position={[-5.4, -0.98, -2.3]} scale={1.8}>
        <PropModel kind="infra" index={1} />
      </group>
    </group>
  )
}
function Farm() {
  return (
    <group>
      <mesh position={[0, -2.2, -10]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[65, 45]} />
        <meshStandardMaterial color="#7b9759" roughness={1} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <Box
          key={i}
          at={[-13 + i * 2.7, -2.13, -11]}
          size={[1.55, 0.13, 30]}
          color={i % 2 ? '#718943' : '#8c7045'}
          rotation={[0, -0.15, 0]}
        />
      ))}
      {[-9, -5, 3, 7, 11].map((x, i) => (
        <group key={x} position={[x, 3.8 + (i % 2), -13]} scale={[2, 0.65, 0.65]}>
          <mesh>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#eef1da" roughness={1} />
          </mesh>
          <mesh position={[0.7, 0.2, 0]}>
            <sphereGeometry args={[0.8, 12, 8]} />
            <meshStandardMaterial color="#eef1da" roughness={1} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 17 }, (_, i) => (
        <Box key={i} at={[-12 + i * 1.5, -0.85, -6.5]} size={[0.2, 2.7, 0.15]} color="#d5ce9f" />
      ))}
      <Box at={[0, -0.2, -6.4]} size={[25, 0.17, 0.14]} color="#d5ce9f" />
      <Box at={[0, -1.2, -6.4]} size={[25, 0.17, 0.14]} color="#d5ce9f" />
      <group position={[-6.8, -0.8, -10.2]}>
        <Block at={[0, 1.25, 0]} size={[4.6, 3.1, 2.9]} color="#ab4934" />
        <mesh position={[0, 3.17, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[3.35, 1.85, 4]} />
          <meshStandardMaterial color="#634b3d" roughness={0.9} />
        </mesh>
        <Block at={[0, 0.87, 1.5]} size={[1.65, 2.22, 0.08]} color="#e3ca9e" />
        <Block at={[0, 0.87, 1.56]} size={[0.055, 2.22, 0.02]} color="#895d38" />
        {[-0.38, 0.38].map((x) => (
          <Block
            key={x}
            at={[x, 0.85, 1.58]}
            size={[0.06, 2.34, 0.025]}
            color="#9c7750"
            rotation={[0, 0, x > 0 ? 0.6 : -0.6]}
          />
        ))}
      </group>
      <Box at={[-6, -1.7, -2]} size={[2.4, 0.8, 1.3]} color="#9c774b" />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-6.8 + i * 0.5, -1.1, -2]} scale={[0.34, 0.27, 0.35]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={i % 2 ? '#769333' : '#5a812a'} roughness={1} />
        </mesh>
      ))}
      <Cylinder at={[-5.1, -1.15, -1.7]} radius={0.27} height={0.6} color="#778c80" metal={0.55} />
      <group position={[-6.5, -1.35, -1.5]} scale={2}>
        <PropModel kind="humanoid" index={1} />
      </group>
    </group>
  )
}
function Griddle() {
  const steam = useMemo(
    () =>
      [-4.5, 4.5].map(
        (x) =>
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(
              Array.from(
                { length: 12 },
                (_, i) => new THREE.Vector3(x + Math.sin(i * 0.7) * 0.17, -1 + i * 0.3, -2.8)
              )
            ),
            32,
            0.017,
            5,
            false
          )
      ),
    []
  )
  return (
    <group>
      <Tiles dark />
      <Counter color="#46504a" top="#74796c" />
      <Block
        at={[-1, 3.6, -4.6]}
        size={[11, 1.6, 3.6]}
        color="#87938e"
        metal={0.75}
        radius={0.18}
      />
      <Box at={[-1, 2.86, -3.8]} size={[7.2, 0.08, 0.8]} color="#d9c999" metal={0.5} />
      <Block
        at={[-1, -1.5, -2.6]}
        size={[10.5, 0.45, 4.8]}
        color="#202827"
        metal={0.75}
        radius={0.1}
      />
      {Array.from({ length: 22 }, (_, i) => (
        <Box
          key={i}
          at={[-4.7 + i * 0.35, -1.24, -2.6]}
          size={[0.065, 0.05, 3.8]}
          color="#59645c"
          metal={0.85}
        />
      ))}
      <Box at={[-1, -1.65, -0.44]} size={[7.7, 0.11, 0.03]} color="#e78d43" />
      <group position={[-6.3, -0.8, -3.8]} scale={1.5}>
        <PropModel kind="posttraining" index={0} />
      </group>
      <group position={[-5.4, -0.8, -4.1]} scale={1.4}>
        <PropModel kind="foundations" index={0} />
      </group>
      {steam.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshBasicMaterial color="#f2e8cc" transparent opacity={0.23} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
function Eggs() {
  return (
    <group>
      <Box at={[0, 0, -7]} size={[26, 20, 0.2]} color="#82a8a3" />
      <Block at={[-1, 0.55, -5.9]} size={[16, 9, 1]} color="#568980" radius={0.55} />
      <Block at={[-1, 0.55, -5.3]} size={[14.8, 8.1, 0.2]} color="#e0eee1" radius={0.3} />
      {[-8.4, 6.4].map((x) => (
        <Block key={x} at={[x, 0.55, -3.8]} size={[0.22, 8.1, 3]} color="#c5dad0" radius={0.06} />
      ))}
      {[-2.85, -0.92, 1.15, 3.3].map((y) => (
        <group key={y}>
          <Block at={[-1, y, -3.8]} size={[14.8, 0.075, 3.1]} color="#b6d6cf" metal={0.35} />
          <Block at={[-1, y, -2.2]} size={[14.8, 0.12, 0.1]} color="#eff7e9" metal={0.55} />
        </group>
      ))}
      <Block at={[-1, 4.55, -3.8]} size={[14.8, 0.22, 3.2]} color="#cedfd3" />
      <mesh position={[-1, 4.4, -4.1]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 0.2]} />
        <meshBasicMaterial color="#d7ffff" />
      </mesh>
      <group position={[-8.5, 0.55, -2.45]} rotation={[0, 0.95, 0]}>
        <Block at={[-2.7, 0, 0]} size={[5.4, 8.8, 0.38]} color="#5e9286" radius={0.3} />
        <Block at={[-2.7, 0, 0.26]} size={[4.9, 8.2, 0.15]} color="#d7e6d4" radius={0.18} />
        {[-2.5, -0.3, 2].map((y) => (
          <Block key={y} at={[-2.7, y, 0.7]} size={[4.65, 0.5, 0.8]} color="#b6d1c4" />
        ))}
        <Block
          at={[-4.7, 0.9, -0.33]}
          size={[0.16, 2.5, 0.21]}
          color="#c6d4ca"
          metal={0.8}
          radius={0.08}
        />
      </group>
      <group position={[-6, -0.83, -3.5]} scale={1.5}>
        <PropModel kind="recsys" index={0} />
      </group>
      <group position={[-6.5, 1.2, -3.8]} scale={1.5}>
        <PropModel kind="recsys" index={1} />
      </group>
      <group position={[-4.9, 1.2, -3.8]} scale={1.5}>
        <PropModel kind="recsys" index={1} />
      </group>
    </group>
  )
}

export function Backdrop({ view }: { view: MutableRefObject<StageView> }) {
  const root = useRef<THREE.Group>(null)
  const groups = useRef<(THREE.Group | null)[]>([])
  const materials = useRef<{ material: THREE.Material; opacity: number }[][]>([])
  const weights = useRef([1, 0, 0, 0, 0, 0])
  const { gl } = useThree()
  useLayoutEffect(() => {
    materials.current = groups.current.map((group) => {
      const found = new Set<THREE.Material>()
      group?.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (mesh.isMesh)
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) =>
            found.add(m)
          )
      })
      return [...found].map((material) => {
        material.transparent = true
        return { material, opacity: material.opacity }
      })
    })
  }, [])
  useFrame((_, delta) => {
    const state = view.current
    root.current!.position.y = state.targetY
    root.current!.scale.setScalar(state.height / 6.5)
    root.current!.visible = state.table < 0.995
    gl.domElement.dataset.backdrop = ['oven', 'bakery', 'deli', 'farm', 'griddle', 'fridge'][
      state.theme
    ]
    groups.current.forEach((group, i) => {
      if (!group) return
      const target = (state.theme === i ? 1 : 0) * (1 - state.table)
      weights.current[i] = state.reduced
        ? target
        : THREE.MathUtils.damp(weights.current[i], target, 4, delta)
      const opacity = weights.current[i]
      group.visible = opacity > 0.01
      group.position.y = (1 - opacity) * -0.4
      if (group.visible)
        materials.current[i]?.forEach(({ material, opacity: base }) => {
          material.opacity = opacity * base
          material.depthWrite = opacity > 0.95
        })
    })
  })
  return (
    <group ref={root}>
      {[<Oven />, <Oven bakery />, <Deli />, <Farm />, <Griddle />, <Eggs />].map((scene, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el
          }}
          visible={i === 0}
        >
          {scene}
        </group>
      ))}
    </group>
  )
}
