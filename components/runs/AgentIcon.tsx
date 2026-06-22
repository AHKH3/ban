'use client'

// Brand mark for each local agent. We tint the official SVG (in public/agents/)
// with `currentColor` via a CSS mask, so the logo adopts the active theme color
// instead of being locked to black — and we never hand-transcribe path data.

const KNOWN = new Set(['codex', 'claude', 'antigravity', 'opencode'])

export function AgentIcon({ id, size = 16, className }: { id: string; size?: number; className?: string }) {
  const known = KNOWN.has(id)
  const src = known ? `./agents/${id}.svg` : undefined
  if (!src) {
    // Unknown agent — neutral dot so the picker never renders empty.
    return (
      <span
        className={className}
        style={{ width: size, height: size, display: 'inline-block', borderRadius: '50%', background: 'currentColor', opacity: 0.5 }}
      />
    )
  }
  return (
    <span
      className={className}
      aria-hidden
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        backgroundColor: 'currentColor',
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  )
}
