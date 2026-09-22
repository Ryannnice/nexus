import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { members } from '../data'
import { createDiscussionPicker, type DiscussionTopic } from '../data/discussions'
import { memberSeatAngle } from './seating'

type Rect = { x: number; y: number; width: number; height: number }
const origin = () => [0, 0]
const overlap = (a: Rect, b: Rect, gap = 10) =>
  Math.max(0, Math.min(a.x + a.width + gap, b.x + b.width) - Math.max(a.x - gap, b.x)) *
  Math.max(0, Math.min(a.y + a.height + gap, b.y + b.height) - Math.max(a.y - gap, b.y))
const topics: DiscussionTopic[] = ['后训练', 'Agent', '具身智能', '推荐系统']

export function TableThoughts({
  paused,
  reveal,
}: {
  paused: MutableRefObject<boolean>
  reveal: MutableRefObject<number>
}) {
  const group = useRef<THREE.Group>(null)
  const labels = useRef<(HTMLDivElement | null)[]>([])
  const paths = useRef<(SVGPathElement | null)[]>([])
  const { camera, size, gl } = useThree()
  const compact = size.width < 760 || size.height < 540
  const count = compact ? 4 : 5
  const width = size.width < 760 ? 145 : size.height < 540 ? 164 : 202
  const pick = useMemo(createDiscussionPicker, [])
  const slots = useRef(
    Array.from({ length: 5 }, () => ({
      member: -1,
      next: 0,
      height: 90,
      x: 0,
      y: 0,
      tx: 0,
      ty: 0,
      initialized: false,
    }))
  )
  const points = useMemo(() => members.map(() => ({ x: 0, y: 0 })), [])
  const vector = useMemo(() => new THREE.Vector3(), [])
  const layout = useRef({ next: 0, active: false, dirty: true, obstacles: [] as Rect[] })
  useEffect(() => {
    layout.current.dirty = true
  }, [size.width, size.height])

  useFrame(({ clock }, delta) => {
    if (!group.current || labels.current.filter(Boolean).length < count) return
    const active = !paused.current && reveal.current >= 0.99
    gl.domElement.dataset.activeSpeakers = active ? String(count) : '0'
    if (!active) {
      labels.current.forEach((label) => {
        if (label) label.style.opacity = '0'
      })
      paths.current.forEach((path) => {
        if (path) path.style.opacity = '0'
      })
      if (layout.current.active)
        slots.current.forEach((slot) => {
          slot.next = 0
          slot.initialized = false
        })
      layout.current.active = false
      return
    }
    const now = clock.elapsedTime
    const initial = !layout.current.active
    layout.current.active = true
    group.current.updateWorldMatrix(true, false)
    for (let i = 0; i < members.length; i++) {
      const a = memberSeatAngle(i, members.length)
      vector
        .set(Math.sin(a) * 7.35, -0.62, Math.cos(a) * 7.35)
        .applyMatrix4(group.current.matrixWorld)
        .project(camera)
      points[i].x = ((vector.x + 1) * size.width) / 2
      points[i].y = ((1 - vector.y) * size.height) / 2
    }
    const food: Rect =
      size.width < 760
        ? {
            x: size.width * 0.28,
            y: size.height * 0.35,
            width: size.width * 0.44,
            height: size.height * 0.23,
          }
        : {
            x: size.width * 0.35,
            y: size.height * 0.14,
            width: size.width * 0.3,
            height: size.height * 0.49,
          }
    let changed = initial || layout.current.dirty
    if (changed) {
      // Fixed UI geometry is read only on entrance or viewport resize.
      layout.current.obstacles = ['.chapter-nav', '.reunion-caption'].map((selector) => {
        const r = document.querySelector(selector)!.getBoundingClientRect()
        return { x: r.x, y: r.y, width: r.width, height: r.height }
      })
      layout.current.dirty = false
    }
    slots.current.forEach((slot, i) => {
      const label = labels.current[i]
      if (!label) return
      if (i >= count) {
        label.style.opacity = '0'
        paths.current[i]!.style.opacity = '0'
        return
      }
      if (initial || now >= slot.next || slot.member < 0) {
        const occupied = slots.current.filter((_, j) => j !== i).map((other) => other.member)
        const available = points
          .map((p, index) => ({ ...p, index }))
          .filter(
            (p) =>
              !occupied.includes(p.index) &&
              p.index !== slot.member &&
              p.x > 12 &&
              p.x < size.width - 12 &&
              p.y > 90 &&
              p.y < size.height - 20 &&
              !overlap({ x: p.x, y: p.y, width: 1, height: 1 }, food, -10)
          )
        const candidates = available.length
          ? available
          : points.map((p, index) => ({ ...p, index })).filter((p) => !occupied.includes(p.index))
        slot.member = candidates[Math.floor(Math.random() * candidates.length)].index
        const topic =
          i === 4
            ? Math.random() < 0.65
              ? 'Infra'
              : '饭桌闲聊'
            : !initial && Math.random() < 0.08
              ? '饭桌闲聊'
              : topics[i]
        const entry = pick(topic)
        label.querySelector('.thought-topic')!.textContent = entry.topic
        label.querySelector('.thought-text')!.textContent = entry.text
        const code = label.querySelector('code')!
        code.textContent = entry.code || ''
        code.hidden = !entry.code
        label.dataset.thoughtId = entry.id
        label.dataset.member = String(slot.member)
        label.dataset.topic = entry.topic
        slot.height = label.offsetHeight
        slot.next =
          now +
          (initial ? 4.5 + i * 1.6 : Math.max(7, entry.text.length * 0.12) + Math.random() * 3)
        changed = true
      }
    })
    if (changed || now >= layout.current.next) {
      layout.current.next = now + 0.3
      const placed: Rect[] = []
      for (let i = 0; i < count; i++) {
        const slot = slots.current[i],
          head = points[slot.member]
        const top = size.height < 540 ? 66 : 88,
          bottom = size.height - slot.height - 12
        const candidates = [
          { x: slot.tx, y: slot.ty },
          { x: head.x - width / 2, y: head.y - slot.height - 32 },
          { x: head.x - width - 30, y: head.y - slot.height / 2 },
          { x: head.x + 30, y: head.y - slot.height / 2 },
          { x: head.x - width / 2, y: head.y + 32 },
        ]
        for (let y = top; y <= bottom; y += 32)
          for (let x = 12; x <= size.width - width - 12; x += 40) candidates.push({ x, y })
        let best = { x: 12, y: top },
          bestScore = Infinity
        for (const candidate of candidates) {
          const rect = {
            x: THREE.MathUtils.clamp(candidate.x, 12, size.width - width - 12),
            y: THREE.MathUtils.clamp(candidate.y, top, bottom),
            width,
            height: slot.height,
          }
          const dx = head.x - THREE.MathUtils.clamp(head.x, rect.x, rect.x + width)
          const dy = head.y - THREE.MathUtils.clamp(head.y, rect.y, rect.y + slot.height)
          const distance = Math.hypot(dx, dy)
          const score =
            (distance - 38) ** 2 +
            (head.x - rect.x - width / 2) ** 2 * 0.08 +
            [...layout.current.obstacles, ...placed].reduce(
              (sum, obstacle) => sum + overlap(rect, obstacle) * 10000,
              0
            ) +
            overlap(rect, food, 0) * 12 +
            (slot.initialized ? Math.hypot(slot.tx - rect.x, slot.ty - rect.y) * 4 : 0)
          if (score < bestScore) {
            bestScore = score
            best = rect
          }
        }
        slot.tx = best.x
        slot.ty = best.y
        if (!slot.initialized) {
          slot.x = best.x
          slot.y = best.y
          slot.initialized = true
        }
        placed.push({ x: best.x, y: best.y, width, height: slot.height })
      }
    }
    for (let i = 0; i < count; i++) {
      const slot = slots.current[i],
        head = points[slot.member],
        label = labels.current[i]!,
        path = paths.current[i]!
      slot.x = THREE.MathUtils.damp(slot.x, slot.tx, 12, Math.min(delta, 0.06))
      slot.y = THREE.MathUtils.damp(slot.y, slot.ty, 12, Math.min(delta, 0.06))
      label.style.transform = `translate3d(${slot.x}px,${slot.y}px,0)`
      label.style.opacity = '1'
      const x = THREE.MathUtils.clamp(head.x, slot.x + 10, slot.x + width - 10)
      const y = THREE.MathUtils.clamp(head.y, slot.y + 10, slot.y + slot.height - 10)
      path.setAttribute('d', `M ${x} ${y} Q ${(x + head.x) / 2} ${y} ${head.x} ${head.y}`)
      path.style.opacity = '.6'
    }
  })

  return (
    <group ref={group}>
      <Html calculatePosition={origin} zIndexRange={[5, 2]} pointerEvents="none">
        <div
          className="table-conversation"
          style={{ width: size.width, height: size.height }}
          aria-label="圆桌技术讨论，情景演绎"
        >
          <svg width={size.width} height={size.height} aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <path
                key={i}
                ref={(el) => {
                  paths.current[i] = el
                }}
              />
            ))}
          </svg>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              ref={(el) => {
                labels.current[i] = el
              }}
              className="member-thought"
              style={{ width, opacity: 0 }}
            >
              <span className="thought-topic" />
              <span className="thought-text" />
              <code hidden />
            </div>
          ))}
        </div>
      </Html>
    </group>
  )
}
