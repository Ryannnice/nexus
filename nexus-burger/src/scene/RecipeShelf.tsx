import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { categories, resources, type CategoryId } from '../data'
import { Block } from './PropModels'
import { RecipeItem } from './RecipeObjects'
import { clamp } from './timeline'
import { resourcesPerScene } from './recipes'
import type { StageView } from './Backdrop'

const grouped = categories.map((c) => resources.filter((r) => r.category === c.id))
const stride = 1.48

function LongShelf({ kind, width }: { kind: CategoryId; width: number }) {
  const fridge = kind === 'recsys',
    tools = kind === 'foundations' || kind === 'infra'
  const metal = fridge || kind === 'posttraining'
  const color = fridge ? '#d7e5db' : metal ? '#a4b3ad' : kind === 'humanoid' ? '#957044' : '#b88046'
  return (
    <group>
      <Block
        at={[0, -0.08, 0]}
        size={[width + 0.4, 0.16, 1.05]}
        color={color}
        metal={metal ? 0.55 : 0}
      />
      <Block
        at={[0, -0.66, -0.19]}
        size={[width + 0.3, 1.05, 0.48]}
        color={fridge ? '#b3cec5' : kind === 'humanoid' ? '#80633f' : '#8c5734'}
      />
      {tools && (
        <>
          <Block
            at={[0, 0.72, -0.44]}
            size={[width + 0.3, 1.73, 0.07]}
            color={kind === 'infra' ? '#b4936d' : '#64765e'}
          />
          <Block
            at={[0, 1.35, -0.27]}
            size={[width + 0.3, 0.06, 0.1]}
            color="#adb8a9"
            metal={0.75}
          />
        </>
      )}
      {fridge && (
        <>
          <Block at={[0, 0.71, -0.58]} size={[width + 0.4, 1.76, 0.12]} color="#dce9e0" />
          <Block at={[0, 1.61, -0.06]} size={[width + 0.55, 0.15, 1.14]} color="#e9eee0" />
          <mesh position={[0, 1.51, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width, 0.12]} />
            <meshBasicMaterial color="#e0fff9" />
          </mesh>
        </>
      )}
      {[-1, 1].map((sign) => (
        <Block
          key={sign}
          at={[sign * (width / 2 + 0.1), 0.32, -0.25]}
          size={[0.11, fridge || tools ? 2.65 : 1.75, 0.78]}
          color={color}
          metal={metal ? 0.5 : 0}
        />
      ))}
    </group>
  )
}

// A single, continuous row. Scroll moves the same objects along the shelf;
// the two physical ends clip off-screen objects, without page swaps or fades.
export function RecipeShelf({ view }: { view: MutableRefObject<StageView> }) {
  const root = useRef<THREE.Group>(null)
  const { camera, size, gl, invalidate } = useThree()
  const [theme, setTheme] = useState(0)
  const count = grouped[theme].length,
    slots = resourcesPerScene(size.width, size.height)
  const width = slots * stride,
    mobile = size.width < 760
  const offset = useRef(0)
  const metrics = useRef<{ top: number; height: number }[]>([])
  const entries = useRef<
    { group: THREE.Group; link: HTMLAnchorElement; index: number; meshes: number; shown: boolean }[]
  >([])
  const planes = useMemo(() => [new THREE.Plane(), new THREE.Plane()], [])
  const v = useMemo(
    () => ({
      forward: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      p: new THREE.Vector3(),
      corner: new THREE.Vector3(),
    }),
    []
  )
  const qa = useMemo(() => new URLSearchParams(location.search).has('qa'), [])

  useEffect(() => {
    gl.localClippingEnabled = true
    const story = document.querySelector('.scroll-story')!
    const measure = () => {
      metrics.current = [...document.querySelectorAll<HTMLElement>('.resource-section')].map(
        (el) => ({ top: el.getBoundingClientRect().top + scrollY, height: el.offsetHeight })
      )
      invalidate()
    }
    const observer = new ResizeObserver(measure)
    observer.observe(story)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [gl, invalidate])

  useLayoutEffect(() => {
    const section = metrics.current[theme]
    offset.current = section
      ? clamp((scrollY - section.top) / Math.max(1, section.height - size.height)) *
        Math.max(0, count - slots)
      : 0
    entries.current = grouped[theme].map((resource, index) => {
      const group = root.current!.getObjectByName(`recipe-${resource.id}`) as THREE.Group
      const link = document.querySelector<HTMLAnchorElement>(`[data-resource="${resource.id}"]`)!
      let meshes = 0
      group.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        meshes++
        ;(Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => {
          material.clippingPlanes = planes
          material.clipShadows = true
        })
      })
      link.style.opacity = '1'
      return { group, link, index, meshes, shown: false }
    })
    return () =>
      entries.current.forEach(({ link }) => {
        link.style.transform = 'translate(-200vw,-200vh)'
        link.style.pointerEvents = 'none'
        link.dataset.projected = 'false'
        link.dataset.fullyVisible = 'false'
      })
  }, [theme, slots, count, planes, size.height])

  useFrame((_, delta) => {
    const state = view.current
    if (state.theme !== theme) {
      setTheme(state.theme)
      root.current!.visible = false
      return
    }
    const section = metrics.current[theme]
    const active = Boolean(state.recipes && state.table < 0.01 && section)
    root.current!.visible = active
    if (!section) return
    const goal =
      clamp((scrollY - section.top) / Math.max(1, section.height - size.height)) *
      Math.max(0, count - slots)
    offset.current = state.reduced
      ? goal
      : THREE.MathUtils.damp(offset.current, goal, 15, Math.min(delta, 0.05))
    const h = state.height,
      w = (h * size.width) / size.height
    const distance =
      (h / (2 * Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2)))) *
      0.8
    camera.getWorldDirection(v.forward)
    v.right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    v.up.set(0, 1, 0).applyQuaternion(camera.quaternion)
    root
      .current!.position.copy(camera.position)
      .addScaledVector(v.forward, distance)
      .addScaledVector(v.right, mobile ? 0 : w * 0.055 * 0.8)
      .addScaledVector(v.up, h * (mobile ? -0.325 : -0.32) * 0.8)
    root.current!.quaternion.copy(camera.quaternion)
    root.current!.rotateX(0.12)
    const scale =
      Math.min((w * (mobile ? 0.91 : 0.78)) / (width + 0.6), h * (mobile ? 0.14 : 0.175)) * 0.8
    root.current!.scale.setScalar(scale)
    root.current!.updateWorldMatrix(true, false)
    v.normal.set(1, 0, 0).applyQuaternion(root.current!.quaternion)
    v.p.set(-width / 2, 0, 0).applyMatrix4(root.current!.matrixWorld)
    planes[0].setFromNormalAndCoplanarPoint(v.normal, v.p)
    v.p.set(width / 2, 0, 0).applyMatrix4(root.current!.matrixWorld)
    planes[1].setFromNormalAndCoplanarPoint(v.normal.clone().negate(), v.p)
    const frameTop = Math.max(
      section.top - scrollY,
      Math.min(0, section.top + section.height - size.height - scrollY)
    )
    const targets: { id: string; min: number[]; max: number[]; meshes: number; center: number }[] =
      []
    let visible = 0
    for (const entry of entries.current) {
      const x = (entry.index - offset.current - (slots - 1) / 2) * stride
      const shown = active && Math.abs(x) < width / 2 + 0.6
      entry.group.visible = shown
      if (!shown) {
        if (entry.shown || entry.link.dataset.projected !== 'false') {
          entry.link.style.transform = 'translate(-200vw,-200vh)'
          entry.link.style.pointerEvents = 'none'
          entry.link.dataset.projected = 'false'
          entry.link.dataset.fullyVisible = 'false'
        }
        entry.shown = false
        continue
      }
      visible++
      entry.shown = true
      entry.group.position.set(x, 0.025, 0)
      entry.group.rotation.y = ((entry.index % 3) - 1) * 0.04
      entry.group.updateWorldMatrix(false, false)
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity
      const left = Math.max(-0.6, -width / 2 - x),
        right = Math.min(0.6, width / 2 - x)
      for (const cx of [left, right])
        for (const cy of [-0.53, 1.38])
          for (const cz of [-0.2, 0.67]) {
            v.corner.set(cx, cy, cz).applyMatrix4(entry.group.matrixWorld).project(camera)
            const px = ((v.corner.x + 1) * size.width) / 2,
              py = ((1 - v.corner.y) * size.height) / 2
            minX = Math.min(minX, px)
            minY = Math.min(minY, py)
            maxX = Math.max(maxX, px)
            maxY = Math.max(maxY, py)
          }
      const clickable = maxX - minX > 28
      entry.link.style.transform = `translate3d(${minX}px,${minY - frameTop}px,0)`
      entry.link.style.width = `${Math.max(0, maxX - minX)}px`
      entry.link.style.height = `${maxY - minY}px`
      entry.link.style.pointerEvents = clickable ? 'auto' : 'none'
      entry.link.dataset.projected = String(clickable)
      entry.link.dataset.fullyVisible = String(left === -0.6 && right === 0.6)
      if (qa && clickable)
        targets.push({
          id: entry.link.dataset.resource!,
          min: [minX, minY],
          max: [maxX, maxY],
          meshes: entry.meshes,
          center: x,
        })
    }
    if (qa) {
      gl.domElement.dataset.recipeTargets = JSON.stringify(targets)
      gl.domElement.dataset.recipeOffset = offset.current.toFixed(4)
      gl.domElement.dataset.recipeMode = 'continuous-shelf'
      gl.domElement.dataset.recipeObjects = String(visible)
    }
  })
  return (
    <group ref={root} visible={false}>
      <LongShelf kind={categories[theme].id} width={width} />
      {grouped[theme].map((resource, index) => (
        <RecipeItem
          key={resource.id}
          resource={resource}
          index={index}
          kind={categories[theme].id}
        />
      ))}
    </group>
  )
}
