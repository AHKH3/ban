'use client'

import Image from 'next/image'

/**
 * Icon-only brand mark (the Ban mascot) inside a theme-safe rounded tile.
 * Uses only the icon — never the icon+wordmark image — per design spec.
 */
export function BrandMark({ size = 28, rounded = 8 }: { size?: number; rounded?: number }) {
  const pad = Math.round(size * 0.16)
  const inner = size - pad * 2
  return (
    <span
      className="inline-flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: 'var(--tile-bg)',
        borderRadius: rounded,
        boxShadow: '0 0 0 1px var(--tile-ring)',
      }}
    >
      <Image src="/icon-mark.png" alt="Ban" width={inner} height={inner} priority />
    </span>
  )
}
