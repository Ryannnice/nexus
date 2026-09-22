import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { arrivalMotion } from './arrival'

export function ArrivalFX({
  progress,
  reduced,
}: {
  progress: MutableRefObject<number>
  reduced: boolean
}) {
  const beams = useRef<THREE.Group>(null),
    glow = useRef<THREE.Mesh>(null),
    sparkles = useRef<THREE.Points>(null),
    light = useRef<THREE.PointLight>(null)
  const dust = useMemo(() => {
    const positions = new Float32Array(56 * 3)
    const colors = new Float32Array(56 * 3)
    return { positions, colors }
  }, [])
  const starTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const ctx = canvas.getContext('2d')!
    const halo = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    halo.addColorStop(0, 'rgba(255,245,206,1)')
    halo.addColorStop(0.2, 'rgba(255,223,153,.6)')
    halo.addColorStop(1, 'rgba(255,194,63,0)')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, 64, 64)
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4
      const radius = i % 2 === 0 ? 29 : 5
      const x = 32 + Math.cos(angle) * radius,
        y = 32 + Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = '#fff1bc'
    ctx.fill()
    return new THREE.CanvasTexture(canvas)
  }, [])
  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!,
      g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,224,142,.75)')
    g.addColorStop(0.45, 'rgba(255,203,91,.23)')
    g.addColorStop(1, 'rgba(255,189,79,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  useEffect(
    () => () => {
      texture.dispose()
      starTexture.dispose()
    },
    [texture, starTexture]
  )
  useFrame(({ clock }) => {
    const active = progress.current >= 0
    const s = arrivalMotion(Math.max(0, progress.current))
    const rays = s.beams * 1.65 + s.glow * 0.05
    beams.current!.visible = active && !reduced && rays > 0.001
    beams.current!.rotation.y = clock.elapsedTime * 0.3
    beams.current!.children.forEach((child) => {
      ;((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = rays
    })
    glow.current!.visible = active
    ;(glow.current!.material as THREE.MeshBasicMaterial).opacity = active
      ? s.glow * (reduced ? 0.55 : 0.76 + Math.sin(clock.elapsedTime * 1.1) * 0.055)
      : 0
    light.current!.intensity = active ? s.glow * 3.8 : 0
    sparkles.current!.visible = active && !reduced && progress.current > 0.35
    if (sparkles.current!.visible) {
      const time = clock.elapsedTime
      for (let i = 0; i < 56; i++) {
        const angle = i * 2.39996 + time * (0.08 + (i % 3) * 0.018)
        const radius = 2.65 + (i % 7) * 0.3
        dust.positions[i * 3] = Math.cos(angle) * radius
        dust.positions[i * 3 + 1] = ((i * 0.618 + time * 0.13) % 5.6) + s.lift * 0.65 - 0.4
        dust.positions[i * 3 + 2] = Math.sin(angle) * radius
        const brightness = 0.35 + 0.65 * ((Math.sin(time * 1.5 + i * 1.9) + 1) / 2) ** 3
        dust.colors.set([brightness, brightness * 0.79, brightness * 0.31], i * 3)
      }
      sparkles.current!.geometry.attributes.position.needsUpdate = true
      sparkles.current!.geometry.attributes.color.needsUpdate = true
      ;(sparkles.current!.material as THREE.PointsMaterial).opacity = Math.min(
        0.9,
        s.beams * 4 + s.glow * 0.8
      )
    }
  })
  return (
    <>
      <group ref={beams} visible={false}>
        {Array.from({ length: 14 }, (_, i) => (
          <mesh
            key={i}
            position={[0, 2, 0]}
            rotation={[0, (i * Math.PI) / 7, -0.24 - (i % 3) * 0.09]}
          >
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([-0.04, -3, 0, 0.04, -3, 0, 1.1, 13, 0, -0.85, 13, 0]), 3]}
              />
              <bufferAttribute attach="index" args={[new Uint16Array([0, 1, 2, 0, 2, 3]), 1]} />
            </bufferGeometry>
            <meshBasicMaterial
              color="#ffd16b"
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      <points ref={sparkles} visible={false} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dust.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={starTexture}
          vertexColors
          size={0.28}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
      <mesh ref={glow} position={[0, -1.225, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 11]} />
        <meshBasicMaterial
          map={texture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 0.8, 0]}
        color="#ffe0a8"
        intensity={0}
        distance={10}
        decay={2}
      />
    </>
  )
}
