import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { categories, resources, type CategoryId } from '../data'
import { Block, Can, PropModel, propName } from './PropModels'
import { clamp, smooth } from './timeline'
import type { StageView } from './Backdrop'
import { resourcesPerScene } from './recipes'

type Resource = (typeof resources)[number]
const grouped = categories.map((category) =>
  resources.filter((resource) => resource.category === category.id)
)

function PegHoles({ height, rows }: { height: number; rows: number }) {
  const geometry = useMemo(() => {
    const positions: number[] = []
    for (let i = 0; i < rows * 7; i++)
      for (let j = 0; j < 14; j++)
        positions.push(
          (j - 6.5) * 0.28,
          (i / (rows * 7 - 1) - 0.5) * (height - 0.25) + 0.38,
          -0.345
        )
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return g
  }, [height, rows])
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#354336" size={0.034} sizeAttenuation />
    </points>
  )
}

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

function RecipeItem({
  resource,
  index,
  kind,
}: {
  resource: Resource
  index: number
  kind: CategoryId
}) {
  const texture = useMemo(() => labelTexture(resource, index), [resource, index])
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

function Rack({ kind, rows }: { kind: CategoryId; rows: number }) {
  const farm = kind === 'humanoid',
    fridge = kind === 'recsys'
  const tools = kind === 'foundations' || kind === 'infra'
  const height = rows * 1.72 + 0.5
  const metal = kind === 'posttraining' || fridge
  const color = farm ? '#866a42' : metal ? '#aabbbb' : '#ad7748'
  return (
    <group>
      {fridge ? (
        <group>
          <Block at={[0, 0.38, -0.62]} size={[4.3, height, 0.14]} color="#dae8e2" />
          {[-2.1, 2.1].map((x) => (
            <Block key={x} at={[x, 0.38, -0.18]} size={[0.14, height, 1.05]} color="#f2f0df" />
          ))}
          <Block at={[0, height / 2 + 0.33, -0.14]} size={[4.3, 0.13, 1.12]} color="#f4f1df" />
          <mesh position={[0, height / 2 + 0.23, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.8, 0.14]} />
            <meshBasicMaterial color="#e3ffff" />
          </mesh>
          <group position={[2.17, 0.4, -0.3]} rotation={[0, -1.08, 0]}>
            <Block at={[1.03, 0, 0]} size={[2.02, height, 0.2]} color="#b6cec7" radius={0.09} />
            <Block at={[1.03, 0, 0.16]} size={[1.76, height - 0.32, 0.2]} color="#edf0dd" />
            <Block at={[1.84, 0.3, -0.19]} size={[0.09, 1.05, 0.1]} color="#a2b7b4" metal={0.75} />
          </group>
        </group>
      ) : tools ? (
        <group>
          <Block
            at={[0, 0.38, -0.42]}
            size={[4.15, height, 0.12]}
            color={kind === 'infra' ? '#b49468' : '#586a5a'}
          />
          <PegHoles height={height} rows={rows} />
        </group>
      ) : (
        <group>
          {[-2.04, 2.04].map((x) => (
            <Block
              key={x}
              at={[x, 0.15, -0.32]}
              size={[0.1, height + 0.55, 0.12]}
              color={color}
              metal={metal ? 0.7 : 0}
            />
          ))}
          {farm && (
            <Block at={[0, -0.15, -0.55]} size={[4.15, height + 0.2, 0.11]} color="#a89c66" />
          )}
        </group>
      )}
      {Array.from({ length: rows }, (_, row) => {
        const y = ((rows - 1) / 2 - row) * 1.72
        return (
          <group key={row}>
            <Block
              at={[0, y - 0.07, 0.02]}
              size={[4.2, 0.09, 0.95]}
              color={fridge ? '#a6cbc6' : color}
              metal={metal ? 0.5 : 0}
            />
            {tools &&
              [-1.32, 0, 1.32].map((x) => (
                <group key={x}>
                  <Can
                    at={[x, y + 1.33, -0.3]}
                    radius={0.026}
                    height={0.12}
                    color={steelColor}
                    metal={0.9}
                  />
                  <Block
                    at={[x, y + 1.37, -0.22]}
                    size={[0.03, 0.04, 0.22]}
                    color={steelColor}
                    metal={0.9}
                  />
                </group>
              ))}
          </group>
        )
      })}
    </group>
  )
}
const steelColor = '#9fafab'

// The recipes are meshes on real shelves. DOM anchors are transparent hit regions
// projected from those meshes, preserving normal links and keyboard access.
export function RecipeObjects({ view }: { view: MutableRefObject<StageView> }) {
  const root = useRef<THREE.Group>(null)
  const racks = useRef<(THREE.Group | null)[]>([])
  const entries = useRef<
    {
      group: THREE.Group
      materials: { material: THREE.Material; opacity: number }[]
      link: HTMLAnchorElement
      index: number
      theme: number
    }[]
  >([])
  const { camera, size, gl } = useThree()
  const mobile = size.width < 760,
    capacity = resourcesPerScene(size.width, size.height),
    rows = capacity / 3
  const math = useMemo(
    () => ({
      p: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      forward: new THREE.Vector3(),
      corner: new THREE.Vector3(),
    }),
    []
  )
  const sections = useRef<HTMLElement[]>([])
  useLayoutEffect(() => {
    sections.current = [...document.querySelectorAll<HTMLElement>('.resource-section')]
    entries.current = []
    racks.current.forEach((rack, theme) => {
      grouped[theme].forEach((resource, index) => {
        const group = rack?.getObjectByName(`recipe-${resource.id}`) as THREE.Group
        const link = document.querySelector<HTMLAnchorElement>(`[data-resource="${resource.id}"]`)!
        if (!group || !link) return
        const found = new Set<THREE.Material>()
        group.traverse((object) => {
          const mesh = object as THREE.Mesh
          if (mesh.isMesh)
            (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) =>
              found.add(m)
            )
        })
        const materials = [...found].map((material) => ({ material, opacity: material.opacity }))
        entries.current.push({ group, materials, link, index, theme })
      })
    })
    return () =>
      entries.current.forEach(({ link }) => {
        link.removeAttribute('style')
        delete link.dataset.projected
      })
  }, [capacity])
  useFrame(() => {
    const state = view.current,
      section = sections.current[state.theme]
    const active = state.recipes && state.table < 0.01 && section
    root.current!.visible = Boolean(active)
    const pages = Math.ceil(grouped[state.theme].length / capacity)
    const top = section?.getBoundingClientRect().top ?? 0
    const travel = Math.max(1, (section?.offsetHeight ?? size.height) - size.height)
    const raw = clamp(-top / travel) * (pages - 0.001)
    const page = Math.min(pages - 1, Math.floor(raw) + smooth(((raw % 1) - 0.68) / 0.32))
    const h = state.height,
      w = (h * size.width) / size.height
    const distance =
      (h / (2 * Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2)))) *
      0.85
    camera.getWorldDirection(math.forward)
    math.right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    math.up.set(0, 1, 0).applyQuaternion(camera.quaternion)
    root
      .current!.position.copy(camera.position)
      .addScaledVector(math.forward, distance)
      .addScaledVector(math.right, mobile ? 0 : w * 0.305 * 0.85)
      .addScaledVector(math.up, h * (mobile ? -0.325 : -0.055) * 0.85)
    root.current!.quaternion.copy(camera.quaternion)
    root.current!.rotateX(0.13)
    root.current!.rotateY(mobile ? -0.025 : -0.08)
    const scale = mobile
      ? Math.min((w * 0.9) / 4.7, h * 0.113)
      : Math.min(h * (rows === 2 ? 0.18 : 0.133), (w * 0.34) / 4.7)
    root.current!.scale.setScalar(scale * 0.85)
    racks.current.forEach((rack, theme) => {
      if (rack) rack.visible = active && theme === state.theme
    })
    root.current!.updateMatrixWorld(true)
    let visible = 0
    const targets: { id: string; min: number[]; max: number[]; meshes: number }[] = []
    entries.current.forEach((entry) => {
      const batch = Math.floor(entry.index / capacity),
        weight = Math.max(0, 1 - Math.abs(batch - page))
      const show = active && entry.theme === state.theme && weight > 0.015
      entry.group.visible = Boolean(show)
      entry.link.dataset.projected = show && weight > 0.6 ? 'true' : 'false'
      if (!show) {
        entry.link.style.opacity = '0'
        entry.link.style.pointerEvents = 'none'
        entry.link.style.transform = 'translate(-200vw, -200vh)'
        return
      }
      visible++
      const n = entry.index % capacity,
        col = n % 3,
        row = Math.floor(n / 3)
      entry.group.position.set(
        (col - 1) * 1.32 + (batch - page) * 0.55,
        ((rows - 1) / 2 - row) * 1.72,
        0
      )
      const hovered = entry.link.matches(':hover, :focus-visible')
      entry.group.rotation.y = hovered ? -0.16 : ((entry.index % 3) - 1) * 0.035
      entry.group.position.z = hovered ? 0.12 : 0
      entry.materials.forEach(({ material, opacity }) => {
        material.transparent = true
        material.opacity = opacity * weight
        material.depthWrite = weight > 0.97 && opacity > 0.9
      })
      entry.group.updateMatrixWorld(true)
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity
      for (const x of [-0.59, 0.59])
        for (const y of [-0.53, 1.4])
          for (const z of [-0.2, 0.67]) {
            math.corner.set(x, y, z).applyMatrix4(entry.group.matrixWorld).project(camera)
            const px = ((math.corner.x + 1) * size.width) / 2,
              py = ((1 - math.corner.y) * size.height) / 2
            minX = Math.min(minX, px)
            minY = Math.min(minY, py)
            maxX = Math.max(maxX, px)
            maxY = Math.max(maxY, py)
          }
      const frameTop = sections.current[entry.theme]
        .querySelector('.chapter-frame')!
        .getBoundingClientRect().top
      entry.link.style.transform = `translate(${minX}px, ${minY - frameTop}px)`
      entry.link.style.width = `${maxX - minX}px`
      entry.link.style.height = `${maxY - minY}px`
      entry.link.style.opacity = weight > 0.6 ? '1' : '0'
      entry.link.style.pointerEvents = weight > 0.6 ? 'auto' : 'none'
      if (weight > 0.6)
        targets.push({
          id: entry.link.dataset.resource!,
          min: [minX, minY],
          max: [maxX, maxY],
          meshes: entry.materials.length,
        })
    })
    gl.domElement.dataset.recipeObjects = String(visible)
    gl.domElement.dataset.recipePage = String(Math.round(page))
    gl.domElement.dataset.recipeKinds = [
      ...new Set(
        entries.current
          .filter((e) => e.group.visible && e.theme === state.theme)
          .map((e) => propName(categories[e.theme].id, e.index))
      ),
    ].join(',')
    if (location.search.includes('qa'))
      gl.domElement.dataset.recipeTargets = JSON.stringify(targets)
  })
  return (
    <group ref={root} visible={false}>
      {categories.map((category, theme) => (
        <group
          key={category.id}
          ref={(el) => {
            racks.current[theme] = el
          }}
        >
          <Rack kind={category.id} rows={rows} />
          {grouped[theme].map((resource, index) => (
            <RecipeItem key={resource.id} resource={resource} index={index} kind={category.id} />
          ))}
        </group>
      ))}
    </group>
  )
}
