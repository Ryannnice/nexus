import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { resources, type CategoryId } from '../data'
import { Block, PropModel, propName } from './PropModels'
type Resource = (typeof resources)[number]

function labelTexture(resource: Resource, index: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 128
  const c = canvas.getContext('2d')!
  c.fillStyle = '#f9f0dc'
  c.fillRect(0, 0, 320, 128)
  c.fillStyle = '#ac5436'
  c.font = 'bold 18px Arial'
  c.fillText(String(index + 1).padStart(2, '0'), 17, 23)
  c.fillText('↗', 293, 23)
  c.fillStyle = '#352a20'
  c.font = '600 29px Arial, "Microsoft YaHei", sans-serif'
  let line = '',
    row = 0
  for (const char of resource.title) {
    if (c.measureText(line + char).width > 286) {
      c.fillText(line, 17, 59 + row * 34)
      row++
      line = char
      if (row === 2) break
    } else line += char
  }
  if (row < 2) c.fillText(line, 17, 59 + row * 34)
  if (row === 2) {
    c.fillStyle = '#f9f0dc'
    c.fillRect(277, 72, 38, 29)
    c.fillStyle = '#352a20'
    c.fillText('…', 277, 93)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function RecipeItem({
  resource,
  index,
  kind,
}: {
  resource: Resource
  index: number
  kind: CategoryId
}) {
  const texture = useMemo(() => labelTexture(resource, index), [resource, index])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <group
      name={`recipe-${resource.id}`}
      userData={{ resource: resource.id, kind: propName(kind, index) }}
    >
      <group position={[0, 0.035, 0]}>
        <PropModel kind={kind} index={index} />
      </group>
      <group position={[0, -0.29, 0.62]} rotation={[-0.1, 0, 0]}>
        <Block size={[1.14, 0.46, 0.035]} color="#deceaa" radius={0.008} />
        <mesh position={[0, 0, 0.019]}>
          <planeGeometry args={[1.12, 0.448]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
