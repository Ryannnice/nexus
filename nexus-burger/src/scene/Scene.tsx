import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { Burger, type MotionState } from './Burger'
import { getSceneState, layerPose, mix, clamp, smooth } from './timeline'
import { Backdrop, type StageView } from './Backdrop'
import { RecipeShelf } from './RecipeShelf'
import { ArrivalFX } from './ArrivalFX'
import { arrivalMotion } from './arrival'

const RoundTable = lazy(() => import('./RoundTable'))
export type StoryProgress = { value: number }
type SceneProps = {
  progress: MutableRefObject<StoryProgress>
  reduced: boolean
  onReady: () => void
  onError: () => void
}

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function World(props: SceneProps) {
  const root = useRef<THREE.Group>(null)
  const food = useRef<THREE.Group>(null)
  const table = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const paused = useRef(false)
  const tableReveal = useRef(0)
  const focusY = useRef(0)
  const arrival = useRef(-1)
  const entrance = useRef({ previous: 0, seed: Math.random() * 10000 })
  const renderedProgress = useRef(0)
  const shadowTick = useRef(0)
  const turn = useRef({ angle: 0, dragging: false, x: 0, until: 0 })
  const view = useRef<StageView>({
    theme: 0,
    height: 6,
    targetY: 0,
    table: 0,
    reduced: false,
    recipes: false,
  })
  const motion = useRef<MotionState>({ spread: 0, reduced: false, focus: -1 })
  const { camera, size, gl, invalidate } = useThree()
  const [tableLoaded, setTableLoaded] = useState(false)
  const mobile = size.width < 760
  const shadowMap = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 128
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(70,36,19,.24)')
    gradient.addColorStop(0.4, 'rgba(70,36,19,.09)')
    gradient.addColorStop(1, 'rgba(70,36,19,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(canvas)
  }, [])
  useEffect(() => {
    props.onReady()
    const update = () => invalidate()
    window.addEventListener('nexus:scene-update', update)
    return () => window.removeEventListener('nexus:scene-update', update)
  }, [props.onReady, invalidate])
  useEffect(() => {
    const canvas = gl.domElement
    const stage = canvas.closest<HTMLElement>('.scene-stage')!
    const down = (event: PointerEvent) => {
      if (getSceneState(props.progress.current.value).table < 0.85 || event.button > 0) return
      turn.current.dragging = true
      turn.current.x = event.clientX
      canvas.setPointerCapture(event.pointerId)
      gl.domElement.dataset.dragging = 'true'
      stage.focus({ preventScroll: true })
    }
    const move = (event: PointerEvent) => {
      if (!turn.current.dragging) return
      turn.current.angle += (event.clientX - turn.current.x) * 0.006
      turn.current.x = event.clientX
      invalidate()
    }
    const up = () => {
      turn.current.dragging = false
      turn.current.until = performance.now() + 1600
      gl.domElement.dataset.dragging = 'false'
    }
    const key = (event: KeyboardEvent) => {
      if (
        !['ArrowLeft', 'ArrowRight'].includes(event.key) ||
        getSceneState(props.progress.current.value).table < 0.85
      )
        return
      event.preventDefault()
      turn.current.angle += event.key === 'ArrowLeft' ? -0.18 : 0.18
      turn.current.until = performance.now() + 1600
      invalidate()
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    stage.addEventListener('keydown', key)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      stage.removeEventListener('keydown', key)
    }
  }, [gl, invalidate, props.progress])
  useFrame(({ clock }, delta) => {
    const raw = props.progress.current.value
    renderedProgress.current =
      props.reduced || Math.abs(raw - renderedProgress.current) > 0.3
        ? raw
        : THREE.MathUtils.damp(renderedProgress.current, raw, 13, Math.min(delta, 0.06))
    const p = Math.abs(renderedProgress.current - raw) < 0.00002 ? raw : renderedProgress.current
    const s = getSceneState(p)
    if (props.reduced || clock.elapsedTime - shadowTick.current > 1 / 24) {
      gl.shadowMap.needsUpdate = true
      shadowTick.current = clock.elapsedTime
    }
    if (p >= 0.86 && entrance.current.previous < 0.86) entrance.current.seed = Math.random() * 10000
    entrance.current.previous = p
    arrival.current = p >= 0.86 ? (props.reduced ? 1 : clamp((p - 0.86) / 0.12)) : -1
    const flight = arrivalMotion(Math.max(0, arrival.current))
    const framing = Math.max(s.table, smooth((p - 0.855) / 0.085))
    if (props.reduced) {
      s.spread = p > 0.1 && p < 0.81 ? 1 : 0
      s.dock = s.spread
      s.table = p > 0.9 ? 1 : 0
    }
    gl.domElement.dataset.sceneProgress = raw.toFixed(4)
    gl.domElement.dataset.tableReveal = s.table.toFixed(4)
    gl.domElement.dataset.focusLayer = String(s.focus)
    if (p > 0.74 && !tableLoaded) setTableLoaded(true)
    paused.current = props.reduced || s.table < 0.01
    tableReveal.current = s.table
    motion.current = {
      spread: s.spread,
      reduced: props.reduced,
      focus: s.focus,
      arrival: arrival.current,
      seed: entrance.current.seed,
    }
    gl.domElement.dataset.assembly = arrival.current.toFixed(4)
    gl.domElement.dataset.assemblySeed = entrance.current.seed.toFixed(4)
    gl.domElement.dataset.burgerSpin = arrival.current >= 0 ? flight.spin.toFixed(4) : '0'

    const aspect = size.width / size.height
    // The camera now follows each ingredient. Other layers retain their vertical stack.
    const readingScale = (mobile ? 1.02 : Math.min(1.3, aspect * 0.95 + 0.3)) * 0.92
    const heroScale = mobile ? 1.3 : 1.55
    const heroHeight = mobile ? Math.max(6.8, 4.6 / aspect) : Math.max(5.9, 4.9 / (aspect * 0.68))
    const libraryHeight = mobile ? Math.max(10.4, 5.3 / aspect) : Math.max(5.8, 5 / (aspect * 0.7))
    const tableHeight = Math.max(14.9, 17.5 / aspect)
    const worldHeight = mix(mix(heroHeight, libraryHeight, s.dock), tableHeight, framing)
    const pitch = mix(mix(0.24, 0.51, s.dock), 0.82, framing)
    const fov = mix(36, 18, framing)
    const perspective = camera as THREE.PerspectiveCamera
    if (perspective.fov !== fov) {
      perspective.fov = fov
      perspective.updateProjectionMatrix()
    }
    const distance = worldHeight / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)))
    const focusTarget = s.focus < 0 ? 0 : layerPose(s.focus, s.spread, 1).y * readingScale
    focusY.current = props.reduced
      ? focusTarget
      : THREE.MathUtils.damp(focusY.current, focusTarget, 5.5, delta)
    const targetY =
      mix(mix(0, focusY.current - worldHeight * (mobile ? 0.13 : 0.14), s.dock), -0.9, framing) +
      (arrival.current >= 0 && !props.reduced ? flight.lift * 1.2 * framing : 0)
    const targetZ = 1.4 * readingScale * s.dock * (1 - framing)
    camera.position.set(
      0,
      targetY + Math.sin(pitch) * distance,
      targetZ + Math.cos(pitch) * distance
    )
    camera.lookAt(0, targetY, targetZ)
    camera.updateMatrixWorld()

    if (
      s.table > 0.85 &&
      !props.reduced &&
      !turn.current.dragging &&
      performance.now() > turn.current.until
    )
      turn.current.angle += Math.min(delta, 0.05) * 0.065
    gl.domElement.dataset.tableAngle = turn.current.angle.toFixed(4)
    root.current!.position.set(
      mobile ? 0 : worldHeight * aspect * mix(0.105, 0.035, s.dock) * (1 - framing),
      0,
      0
    )
    root.current!.rotation.y = turn.current.angle * s.table
    const heroY = mobile ? -0.5 : 0.05
    food.current!.position.y =
      mix(mix(heroY, 0, s.dock), 1.515, framing) +
      (arrival.current >= 0 && !props.reduced ? flight.lift : 0)
    if (!props.reduced && s.dock < 0.01 && s.table < 0.01)
      food.current!.position.y += Math.sin(clock.elapsedTime * 0.7) * 0.018
    food.current!.scale.setScalar(mix(mix(heroScale, readingScale, s.dock), 2.25, framing))
    food.current!.rotation.set(
      0,
      arrival.current >= 0
        ? props.reduced
          ? 0
          : flight.spin
        : props.reduced
          ? -0.18
          : -0.18 + Math.sin(clock.elapsedTime * 0.13) * 0.2 + p * 0.9,
      0
    )
    view.current = {
      theme: Math.max(0, [0, 5, 2, 4, 1, 3].indexOf(s.focus)),
      height: worldHeight,
      targetY,
      table: Math.max(framing, smooth((p - 0.825) / 0.03)),
      reduced: props.reduced,
      recipes: s.focus >= 0 && s.spread > 0.8,
    }
    table.current!.visible = s.table > 0.002
    table.current!.position.y = -(1 - s.table) * 7
    shadow.current!.position.set(root.current!.position.x, mix(-1.85, -2.3, s.table), 0)
    shadow.current!.scale.setScalar(mix(6, 21, s.table))
    ;(shadow.current!.material as THREE.MeshBasicMaterial).opacity = mix(1 - s.dock, 0.8, s.table)
  }, -1)

  return (
    <>
      <ambientLight intensity={0.32} color="#ffefdc" />
      <hemisphereLight args={['#fff9e8', '#946844', 0.65]} />
      <directionalLight
        position={[-5, 8, 6]}
        intensity={2.1}
        color="#fff0d5"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-normalBias={0.025}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[5, 4, -6]} intensity={1.3} color="#fff5e4" />
      <Environment resolution={64} frames={1}>
        <Lightformer
          form="rect"
          intensity={3}
          color="#fff2dc"
          scale={6}
          position={[-5, 4, 5]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          color="#ffffff"
          scale={4}
          position={[4, 3, -3]}
          target={[0, 0, 0]}
        />
      </Environment>
      <Backdrop view={view} />
      <RecipeShelf view={view} />
      <group ref={root}>
        <ArrivalFX progress={arrival} reduced={props.reduced} />
        <group ref={food}>
          <Burger motion={motion} />
        </group>
        <group ref={table} visible={false}>
          <Suspense fallback={null}>
            {tableLoaded && <RoundTable paused={paused} reveal={tableReveal} />}
          </Suspense>
        </group>
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry />
        <meshBasicMaterial map={shadowMap} transparent depthWrite={false} />
      </mesh>
    </>
  )
}

export default function Scene(props: SceneProps) {
  const [documentVisible, setDocumentVisible] = useState(!document.hidden)
  const [inView, setInView] = useState(true)
  const [supported] = useState(() => {
    try {
      const probe = document.createElement('canvas').getContext('webgl2')
      if (!probe) return false
      probe.getExtension('WEBGL_lose_context')?.loseContext()
      return true
    } catch {
      return false
    }
  })
  useEffect(() => {
    if (!supported) props.onError()
    const stage = document.querySelector('.scene-stage')
    if (!stage) return
    const observer = new IntersectionObserver((entries) => setInView(entries[0].isIntersecting))
    observer.observe(stage)
    return () => observer.disconnect()
  }, [supported, props.onError])
  useEffect(() => {
    const change = () => setDocumentVisible(!document.hidden)
    document.addEventListener('visibilitychange', change)
    return () => document.removeEventListener('visibilitychange', change)
  }, [])
  if (!supported) return null
  return (
    <SceneBoundary onError={props.onError}>
      <Canvas
        frameloop={props.reduced || !documentVisible || !inView ? 'demand' : 'always'}
        shadows
        dpr={[1, 1.25]}
        camera={{ position: [0, 3, 10], fov: 34, near: 0.1, far: 180 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.04
          gl.shadowMap.autoUpdate = false
          gl.setClearColor(0x000000, 0)
          gl.domElement.addEventListener(
            'webglcontextlost',
            (event) => {
              event.preventDefault()
              props.onError()
            },
            { once: true }
          )
        }}
        fallback={<span>3D 暂不可用</span>}
      >
        <Suspense fallback={null}>
          <World {...props} />
        </Suspense>
      </Canvas>
    </SceneBoundary>
  )
}
