import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { guestAngle } from './seating'
import { clamp, smooth } from './timeline'

export function GuestSeat({ reveal }: { reveal: MutableRefObject<number> }) {
  const anchor = useRef<THREE.Group>(null)
  const label = useRef<HTMLDivElement>(null)
  const line = useRef<SVGPathElement>(null)
  const text = useRef<SVGTextElement>(null)
  const { gl, camera, size } = useThree()
  const point = useMemo(() => new THREE.Vector3(), [])
  const geometry = useMemo(
    () => ({
      sphere: new THREE.SphereGeometry(1, 24, 16),
      capsule: new THREE.CapsuleGeometry(1, 1, 6, 16),
      box: new THREE.BoxGeometry(),
      cylinder: new THREE.CylinderGeometry(1, 1, 1, 16),
    }),
    []
  )
  const material = useMemo(
    () => ({
      glass: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        roughness: 0.1,
        metalness: 0.12,
        clearcoat: 1,
        envMapIntensity: 1.6,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      }),
      chair: new THREE.MeshPhysicalMaterial({
        color: '#eaf6f2',
        roughness: 0.12,
        clearcoat: 1,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
    }),
    []
  )
  useLayoutEffect(() => {
    gl.domElement.dataset.guestSeats = '1'
    gl.domElement.dataset.guestMaterial = 'white-glass'
  }, [gl])
  useFrame(() => {
    if (!label.current || !anchor.current || !line.current || !text.current) return
    anchor.current.getWorldPosition(point)
    const front = smooth((point.z + 1.5) / 3)
    const opacity = smooth((reveal.current - 0.75) / 0.25) * front
    label.current.style.opacity = String(opacity)
    label.current.style.visibility = opacity > 0.01 ? 'visible' : 'hidden'
    point.project(camera)
    const x = ((point.x + 1) * size.width) / 2,
      y = ((1 - point.y) * size.height) / 2
    const compact = size.width < 1100 && size.height > 540
    const direction = x < size.width * 0.46 ? -1 : 1
    const labelX = clamp(
      x + (compact ? 55 : direction * Math.min(size.width * 0.34, 560)),
      70,
      size.width - 130
    )
    const labelY = compact
      ? clamp(y + 64, size.height * 0.42, size.height * 0.76)
      : clamp(y - 74, size.height * 0.5, size.height * 0.84)
    const dx = labelX - x,
      dy = labelY - y
    text.current.setAttribute('x', String(dx))
    text.current.setAttribute('y', String(dy))
    text.current.setAttribute('text-anchor', direction < 0 && !compact ? 'end' : 'start')
    line.current.setAttribute(
      'd',
      `M${dx} ${dy + (dy > 0 ? -14 : 12)} C${dx * 0.9} ${dy * 0.6} ${dx * 0.24} 8 ${Math.sign(dx) * 8} 0`
    )
    gl.domElement.dataset.guestAnchor = JSON.stringify([x, y])
  })
  const part = (
    key: string,
    kind: 'sphere' | 'capsule',
    position: [number, number, number],
    scale: [number, number, number],
    angle = 0
  ) => (
    <mesh
      key={key}
      position={position}
      scale={scale}
      rotation={[0, 0, angle]}
      geometry={geometry[kind]}
      material={material.glass}
    />
  )
  const segment = (
    key: string,
    from: [number, number, number],
    to: [number, number, number],
    radius: number
  ) => {
    const a = new THREE.Vector3(...from),
      b = new THREE.Vector3(...to),
      direction = b.clone().sub(a)
    return (
      <mesh
        key={key}
        geometry={geometry.cylinder}
        material={material.glass}
        position={a.clone().add(b).multiplyScalar(0.5)}
        quaternion={new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.clone().normalize()
        )}
        scale={[radius, direction.length(), radius]}
      />
    )
  }
  return (
    <group
      name="invitation-seat"
      position={[Math.sin(guestAngle) * 7.45, 0, Math.cos(guestAngle) * 7.45]}
      rotation={[0, guestAngle + Math.PI, 0]}
    >
      <mesh position={[0, -2.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.43, 0.46, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <group position={[0, -0.42, 0]} scale={0.67}>
        {part('head', 'sphere', [0, -0.52, 0], [0.245, 0.28, 0.245])}
        {part('body', 'capsule', [0, -1.17, 0], [0.3, 0.255, 0.22])}
        {[-1, 1].flatMap((sign) => [
          segment(`upper-${sign}`, [sign * 0.28, -0.88, 0.03], [sign * 0.43, -1.12, 0.3], 0.1),
          segment(`forearm-${sign}`, [sign * 0.43, -1.12, 0.3], [sign * 0.33, -1.17, 0.8], 0.083),
          part(`hand-${sign}`, 'sphere', [sign * 0.33, -1.17, 0.8], [0.1, 0.11, 0.1]),
          part(`leg-${sign}`, 'capsule', [sign * 0.16, -2.07, 0.15], [0.12, 0.39, 0.13]),
        ])}
        <mesh
          geometry={geometry.box}
          material={material.chair}
          position={[0, -1.78, -0.07]}
          scale={[0.76, 0.13, 0.68]}
        />
        <mesh
          geometry={geometry.box}
          material={material.chair}
          position={[0, -1.23, -0.35]}
          scale={[0.76, 0.76, 0.12]}
        />
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((z) => (
            <mesh
              key={`${x}-${z}`}
              geometry={geometry.box}
              material={material.chair}
              position={[x * 0.27, -2.31, z * 0.23 - 0.07]}
              scale={[0.055, 1.05, 0.055]}
            />
          ))
        )}
        <group ref={anchor} position={[0, -0.52, 0]}>
          <Html zIndexRange={[4, 1]} pointerEvents="none">
            <div ref={label} className="seat-callout" style={{ opacity: 0, visibility: 'hidden' }}>
              <svg width="1" height="1" aria-hidden="true">
                <defs>
                  <marker
                    id="welcome-arrow"
                    markerWidth="9"
                    markerHeight="9"
                    refX="8"
                    refY="4.5"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                  >
                    <path d="M0 0 9 4.5 0 9" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </marker>
                </defs>
                <path ref={line} className="leader-line" markerEnd="url(#welcome-arrow)" />
                <text ref={text} className="leader-text">
                  欢迎入席
                </text>
                <circle className="guest-anchor" r="3" fill="currentColor" />
              </svg>
            </div>
          </Html>
        </group>
      </group>
    </group>
  )
}
