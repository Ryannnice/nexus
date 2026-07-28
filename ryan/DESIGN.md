# Design and Content System

## Positioning

The homepage is an industrial portfolio, not a replacement for the academic
archive. Its information hierarchy is:

```text
Industrial outcome
  -> flagship system
  -> supporting engineering work
  -> experience and writing
  -> research foundation
```

The intended first-screen message is:

> Renyuan Liu builds verifiable Agent pipelines, tool-routing systems, and
> large-model serving workflows.

## Visual language

- Near-black canvases frame the hero, flagship case study, research, and contact.
- Warm paper surfaces carry experience and writing.
- Electric lime is the only signal color.
- Square geometry, one-pixel rules, monospaced metadata, and visible evaluation
  boundaries create an engineering-document feel.
- The design borrows the evidence density of the Commerce Agent case study,
  while using a distinct personal composition and color token.

## Core tokens

```text
ink          #090b09
ink-soft     #121512
paper        #f2f3ed
paper-bright #fbfcf7
signal       #a6ef3c
line         #cfd2c8
```

System fonts are used to avoid external font requests. Chinese copy falls back
to PingFang SC, Hiragino Sans GB, or Microsoft YaHei.

## Interaction rules

- Navigation collapses below 980px.
- Active section state is driven by `IntersectionObserver`.
- Content reveal is progressive enhancement and is removed for reduced motion.
- The flagship trace lab replays three fixed examples; it never claims to call
  an online model.
- There is no autoplay, simulated terminal typing, parallax, or decorative 3D.

## Accessibility

- Semantic section headings and a skip link.
- Keyboard-operable navigation and trace controls.
- Visible focus states.
- `aria-live` is limited to the trace replay panel.
- Motion respects `prefers-reduced-motion`.
- Important information is not encoded by color alone.

## Public evidence policy

- Intent: `100.00% Accuracy / Macro-F1`, fixed synthetic 9K set.
- Retrieval: `98.30% AllHit@10`, fixed 6K project benchmark.
- Planner: `99.10% SetEM / TraceEM`, independent formal 1K set.
- Routing: approximately `62%` evaluated cost reduction with accuracy loss
  controlled within `10%`, reported as an internship evaluation result.

Private repositories are not linked as public evidence. The public Commerce
Agent narrative page is the canonical flagship link.

