import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { schools, members, assetUrl } from '../data'
import { memberSeatAngle, tableYaw } from './seating'
import { GuestSeat } from './GuestSeat'
import { Avatars } from './Avatars'
import { TableThoughts } from './TableThoughts'
import type { MutableRefObject } from 'react'

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
      <TableThoughts paused={paused} reveal={reveal} />
    </group>
  )
}
