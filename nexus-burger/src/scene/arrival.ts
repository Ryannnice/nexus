import { clamp, layerBase, smooth } from './timeline.ts'

const noise = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Random once per entrance, deterministic while scrubbing that entrance backwards.
export function arrivalPose(index: number, progress: number, seed: number) {
  const t = clamp((progress - 0.025 - index * 0.048) / 0.33)
  const remaining = (1 - t) ** 3
  const arc = Math.sin(Math.PI * t) * (1 - t)
  const n = seed + index * 73.3
  const bounce =
    t > 0.65 && t < 1 ? Math.sin((t - 0.65) * 34) * Math.exp(-(t - 0.65) * 11) * (1 - t) * 0.45 : 0
  const squash =
    t > 0.65 && t < 1 ? Math.sin((t - 0.65) * 24) * Math.exp(-(t - 0.65) * 10) * (1 - t) * 0.2 : 0
  return {
    x: (noise(n) - 0.5) * 12 * remaining + (noise(n + 4) - 0.5) * 4 * arc,
    y: layerBase[index] + (6 + noise(n + 1) * 5) * remaining + arc * 2.2 + bounce,
    z: (noise(n + 2) - 0.5) * 9 * remaining,
    rx: (noise(n + 3) - 0.5) * 5 * remaining,
    ry: (noise(n + 5) - 0.5) * Math.PI * 7 * remaining,
    rz: (noise(n + 6) - 0.5) * 4 * remaining,
    squash: 1 - squash,
    stretch: 1 + squash * 0.5,
    landed: t === 1,
  }
}

export function arrivalMotion(progress: number) {
  const p = clamp(progress)
  const touchdown = smooth((p - 0.76) / 0.22)
  const impact =
    p > 0.93 ? Math.sin((p - 0.93) * 100) * Math.exp(-(p - 0.93) * 35) * (1 - p) * 1.9 : 0
  return {
    lift: 3.6 * (1 - touchdown) + impact,
    spin: Math.PI * 6 * smooth((p - 0.39) / 0.43),
    beams: Math.sin(Math.PI * clamp((p - 0.32) / 0.65)) * 0.2,
    glow: smooth((p - 0.92) / 0.08),
  }
}
