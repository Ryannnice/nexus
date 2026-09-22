export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
export const mix = (a: number, b: number, t: number) => a + (b - a) * t
export const smooth = (v: number) => {
  const t = clamp(v)
  return t * t * (3 - 2 * t)
}

export type ScrollAnchor = { y: number; value: number }
export function progressAt(y: number, anchors: ScrollAnchor[]) {
  if (!anchors.length || y <= anchors[0].y) return 0
  const i = anchors.findIndex((anchor) => anchor.y >= y)
  if (i < 0) return 1
  const a = anchors[i - 1],
    b = anchors[i]
  return mix(a.value, b.value, clamp((y - a.y) / Math.max(1, b.y - a.y)))
}

export type SceneState = { spread: number; dock: number; table: number; focus: number }
export function getSceneState(progress: number): SceneState {
  const p = clamp(Number.isFinite(progress) ? progress : 0)
  const opening = smooth((p - 0.035) / 0.135)
  const closing = smooth((p - 0.755) / 0.1)
  const focusOrder = [0, 5, 2, 4, 1, 3]
  const section = Math.min(5, Math.max(0, Math.floor((p - 0.155) / 0.1)))
  return {
    spread: opening * (1 - closing),
    dock: smooth((p - 0.035) / 0.125) * (1 - smooth((p - 0.77) / 0.09)),
    table: smooth((p - 0.941) / 0.037),
    focus: p >= 0.155 && p < 0.755 ? focusOrder[section] : -1,
  }
}

export const layerBase = [-0.98, -0.48, -0.17, -0.03, 0.29, 0.53]
export const layerGap = [-2.25, -1.45, -0.58, 0.65, 1.72, 2.75]
export function layerPose(index: number, spread: number, emphasis = 0) {
  const stagger = (0.06 * (5 - index)) / 5
  const t = smooth(clamp((spread - stagger) / (1 - stagger)))
  return {
    x: 0,
    y: layerBase[index] + layerGap[index] * t,
    z: 1.4 * emphasis * t,
    scale: 1 + 0.3 * emphasis * t,
    rotation: (index % 2 ? -0.025 : 0.025) * t,
  }
}
