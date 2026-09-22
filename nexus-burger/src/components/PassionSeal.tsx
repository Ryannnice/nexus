export function PassionSeal() {
  const points = Array.from({ length: 40 }, (_, i) => {
    const a = (i * Math.PI) / 20 - Math.PI / 2
    const r = i % 2 ? 86 : 99
    return `${100 + Math.cos(a) * r},${100 + Math.sin(a) * r}`
  }).join(' ')
  return (
    <svg
      className="passion-seal"
      viewBox="0 0 200 200"
      role="img"
      aria-label="100% made of passion"
    >
      <polygon points={points} fill="currentColor" />
      <circle cx="100" cy="100" r="74" fill="none" stroke="var(--paper)" strokeWidth="1.5" />
      <g fill="var(--paper)" textAnchor="middle">
        <text x="100" y="93" className="seal-percent">
          100%
        </text>
        <text x="100" y="119" className="seal-small">
          MADE OF
        </text>
        <text x="100" y="143" className="seal-passion">
          PASSION
        </text>
      </g>
    </svg>
  )
}
