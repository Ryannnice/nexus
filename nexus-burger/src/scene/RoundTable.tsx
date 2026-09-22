import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { schools, members, assetUrl } from '../data'
import { memberSeatAngle, tableYaw } from './seating'
import { GuestSeat } from './GuestSeat'
import type { MutableRefObject } from 'react'

function Avatars({ paused }: { paused: MutableRefObject<boolean> }) {
  const count = members.length
  const { gl } = useThree()
  const heads = useRef<THREE.InstancedMesh>(null),
    torsos = useRef<THREE.InstancedMesh>(null)
  const hair = useRef<THREE.InstancedMesh>(null),
    eyes = useRef<THREE.InstancedMesh>(null)
  const arms = useRef<THREE.InstancedMesh>(null),
    hands = useRef<THREE.InstancedMesh>(null)
  const legs = useRef<THREE.InstancedMesh>(null),
    seats = useRef<THREE.InstancedMesh>(null)
  const backs = useRef<THREE.InstancedMesh>(null),
    chairLegs = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const transforms = useMemo(
    () =>
      members.map((_, i) => {
        const a = memberSeatAngle(i, count)
        return { x: Math.sin(a) * 7.45, z: Math.cos(a) * 7.45, a: a + Math.PI }
      }),
    [count]
  )
  function place(
    mesh: THREE.InstancedMesh,
    index: number,
    person: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rz = 0
  ) {
    const p = transforms[person]
    const size = 0.6
    dummy.position.set(
      p.x + (Math.cos(p.a) * x + Math.sin(p.a) * z) * size,
      y * size - 0.5,
      p.z + (-Math.sin(p.a) * x + Math.cos(p.a) * z) * size
    )
    dummy.rotation.set(0, p.a, rz)
    dummy.scale.set(sx * size, sy * size, sz * size)
    dummy.updateMatrix()
    mesh.setMatrixAt(index, dummy.matrix)
  }
  useLayoutEffect(() => {
    for (let i = 0; i < count; i++) {
      const skin = new THREE.Color(['#e6af80', '#ba825e', '#e0a476', '#d8a27e'][i % 4])
      place(heads.current!, i, i, 0, -0.52, 0, 0.235, 0.27, 0.235)
      heads.current!.setColorAt(i, skin)
      place(hair.current!, i, i, 0, -0.35, -0.035, 0.247, 0.16, 0.237)
      hair.current!.setColorAt(i, new THREE.Color(i % 5 === 0 ? '#74503b' : '#33251d'))
      place(torsos.current!, i, i, 0, -1.17, 0, 0.3, 0.43, 0.22)
      torsos.current!.setColorAt(i, new THREE.Color(members[i].color))
      for (let j = 0; j < 2; j++) {
        const sign = j === 0 ? -1 : 1,
          index = i * 2 + j
        place(eyes.current!, index, i, sign * 0.08, -0.5, 0.207, 0.026, 0.03, 0.017)
        place(arms.current!, index, i, sign * 0.36, -1.07, 0.03, 0.115, 0.33, 0.115, sign * -0.25)
        arms.current!.setColorAt(index, new THREE.Color(members[i].color))
        place(hands.current!, index, i, sign * 0.42, -1.35, 0.11, 0.11, 0.13, 0.1)
        hands.current!.setColorAt(index, skin)
        place(legs.current!, index, i, sign * 0.16, -2.07, 0.15, 0.12, 0.39, 0.13)
      }
      place(seats.current!, i, i, 0, -1.78, -0.07, 0.71, 0.13, 0.64)
      place(backs.current!, i, i, 0, -1.23, -0.33, 0.7, 0.74, 0.12)
      for (let j = 0; j < 4; j++)
        place(
          chairLegs.current!,
          i * 4 + j,
          i,
          j % 2 ? 0.26 : -0.26,
          -2.31,
          j < 2 ? -0.3 : 0.17,
          0.055,
          1.05,
          0.055
        )
    }
    ;[heads, torsos, hair, eyes, arms, hands, legs, seats, backs, chairLegs].forEach((ref) => {
      ref.current!.instanceMatrix.needsUpdate = true
      if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true
      ref.current!.computeBoundingSphere()
    })
    gl.domElement.dataset.memberInstances = String(heads.current!.count)
  }, [transforms])
  useFrame(({ clock }) => {
    if (paused.current) return
    // A few partners wave; the rest stay calm so that the scene remains readable.
    for (const i of [0, 8, 16, 25, 34, 42]) {
      const phase = Math.sin(clock.elapsedTime * 1.7 + i)
      place(arms.current!, i * 2 + 1, i, 0.4, -0.77, 0.04, 0.115, 0.33, 0.115, -0.6 + phase * 0.12)
      place(hands.current!, i * 2 + 1, i, 0.57 + phase * 0.025, -0.54, 0.04, 0.11, 0.13, 0.1)
    }
    arms.current!.instanceMatrix.needsUpdate = true
    hands.current!.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      <instancedMesh ref={heads} args={[undefined, undefined, count]} castShadow>
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>
      <instancedMesh ref={hair} args={[undefined, undefined, count]} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={torsos} args={[undefined, undefined, count]} castShadow>
        <capsuleGeometry args={[1, 1, 4, 12]} />
        <meshStandardMaterial roughness={0.86} />
      </instancedMesh>
      <instancedMesh ref={arms} args={[undefined, undefined, count * 2]} castShadow>
        <capsuleGeometry args={[1, 1, 4, 10]} />
        <meshStandardMaterial roughness={0.82} />
      </instancedMesh>
      <instancedMesh ref={hands} args={[undefined, undefined, count * 2]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>
      <instancedMesh ref={eyes} args={[undefined, undefined, count * 2]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#2e251d" />
      </instancedMesh>
      <instancedMesh ref={legs} args={[undefined, undefined, count * 2]} castShadow>
        <capsuleGeometry args={[1, 1, 4, 8]} />
        <meshStandardMaterial color="#343b37" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={seats} args={[undefined, undefined, count]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#a84127" roughness={0.66} />
      </instancedMesh>
      <instancedMesh ref={backs} args={[undefined, undefined, count]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#b55333" roughness={0.66} />
      </instancedMesh>
      <instancedMesh ref={chairLegs} args={[undefined, undefined, count * 4]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#694029" roughness={0.75} />
      </instancedMesh>
    </group>
  )
}

function SchoolSigns() {
  const group = useRef<THREE.Group>(null)
  const { gl } = useThree()
  const [textures, setTextures] = useState<(THREE.Texture | null)[]>([])
  useLayoutEffect(() => {
    gl.domElement.dataset.logoInstances = String(group.current!.children.length)
    gl.domElement.dataset.logoAssignments = JSON.stringify(members.map((school) => school.id))
  }, [])
  useEffect(() => {
    gl.domElement.dataset.loadedMemberLogos = String(
      members.filter((school) => textures[schools.findIndex((s) => s.id === school.id)]).length
    )
  }, [textures, gl])
  useEffect(() => {
    let cancelled = false
    const loaded: (THREE.Texture | null)[] = new Array(schools.length).fill(null)
    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const image = new Image()
        image.onload = () => {
          if (!cancelled) {
            // Small table badges do not need full-resolution GPU textures.
            const canvas = document.createElement('canvas')
            canvas.width = canvas.height = 128
            const context = canvas.getContext('2d')!,
              ratio = Math.min(128 / image.width, 128 / image.height)
            const width = image.width * ratio,
              height = image.height * ratio
            context.drawImage(image, (128 - width) / 2, (128 - height) / 2, width, height)
            const texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace
            loaded[i] = texture
          }
          resolve()
        }
        image.onerror = () => resolve() // A missing badge must not remove the whole 3D story.
        image.src = assetUrl(schools[i].logo)
      })
    void (async () => {
      for (let i = 0; i < schools.length && !cancelled; i += 3) {
        await Promise.all(schools.slice(i, i + 3).map((_, offset) => load(i + offset)))
        if (!cancelled) setTextures([...loaded])
      }
    })()
    return () => {
      cancelled = true
      loaded.forEach((texture) => texture?.dispose())
    }
  }, [])
  return (
    <group ref={group}>
      {members.map((school, i) => {
        const texture = textures[schools.findIndex((s) => s.id === school.id)]
        const a = memberSeatAngle(i, members.length)
        return (
          <group
            key={`${school.id}-${i}`}
            position={[Math.sin(a) * 6.5, -1.0, Math.cos(a) * 6.5]}
            rotation={[0, a, -0.06]}
          >
            <mesh castShadow>
              <boxGeometry args={[0.56, 0.44, 0.045]} />
              <meshStandardMaterial color="#fff8e8" roughness={0.8} />
            </mesh>
            {texture && (
              <mesh position={[0, 0, 0.025]}>
                <planeGeometry args={[0.37, 0.37]} />
                <meshBasicMaterial map={texture} transparent toneMapped={false} />
              </mesh>
            )}
            {texture && (
              <mesh position={[0, 0, -0.025]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.37, 0.37]} />
                <meshBasicMaterial map={texture} transparent toneMapped={false} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

export default function RoundTable({
  paused,
  reveal,
}: {
  paused: MutableRefObject<boolean>
  reveal: MutableRefObject<number>
}) {
  const mat = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f6e8cc'
    ctx.fillRect(0, 0, 512, 512)
    ctx.fillStyle = '#ca7252'
    for (let x = 0; x < 16; x++)
      for (let y = 0; y < 16; y++) if ((x + y) % 2 === 0) ctx.fillRect(x * 32, y * 32, 32, 32)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
  return (
    <group rotation={[0, tableYaw, 0]}>
      <mesh position={[0, -1.38, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[6.9, 6.9, 0.23, 128]} />
        <meshStandardMaterial color="#a05b35" roughness={0.68} />
      </mesh>
      <mesh position={[0, -1.257, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6.82, 128]} />
        <meshStandardMaterial color="#dfb17d" roughness={0.8} />
      </mesh>
      <mesh position={[0, -1.85, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.75, 1.05, 48]} />
        <meshStandardMaterial color="#855037" roughness={0.8} />
      </mesh>
      <mesh position={[0, -2.36, 0]}>
        <cylinderGeometry args={[3.5, 3.5, 0.1, 64]} />
        <meshStandardMaterial color="#855037" roughness={0.8} />
      </mesh>
      <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
        <planeGeometry args={[8.2, 8.2]} />
        <meshStandardMaterial map={mat} roughness={0.9} />
      </mesh>
      <SchoolSigns />
      <Avatars paused={paused} />
      <GuestSeat reveal={reveal} />
    </group>
  )
}
