'use client'

import type { CardStatus } from '@/lib/types'
import { STATUS_COLORS } from '@/lib/types'

type Kind = 'dashed' | 'ring' | 'pie' | 'check' | 'x'

interface StatusVisual {
  kind: Kind
  fraction?: number // for 'pie'
}

// Linear-style progressive states across the pipeline.
const STATUS_VISUAL: Record<CardStatus, StatusVisual> = {
  inbox: { kind: 'dashed' },
  shape: { kind: 'ring' },
  ready: { kind: 'pie', fraction: 0.25 },
  doing: { kind: 'pie', fraction: 0.5 },
  review: { kind: 'pie', fraction: 0.75 },
  done: { kind: 'check' },
  killed: { kind: 'x' },
}

const C = 7 // center
const R = 5.6 // outer radius
const PIE_R = 2.8 // wedge radius (stroke width = 2*PIE_R fills to R)
const PIE_CIRC = 2 * Math.PI * PIE_R

export function StatusIcon({
  status,
  size = 14,
  color,
}: {
  status: CardStatus
  size?: number
  color?: string
}) {
  const v = STATUS_VISUAL[status]
  const c = color ?? STATUS_COLORS[status]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {v.kind === 'dashed' && (
        <circle
          cx={C}
          cy={C}
          r={R}
          stroke={c}
          strokeWidth={1.4}
          strokeDasharray="2.2 2.2"
          strokeLinecap="round"
        />
      )}

      {v.kind === 'ring' && (
        <circle cx={C} cy={C} r={R} stroke={c} strokeWidth={1.5} />
      )}

      {v.kind === 'pie' && (
        <>
          <circle cx={C} cy={C} r={R} stroke={c} strokeWidth={1.5} />
          <circle
            cx={C}
            cy={C}
            r={PIE_R}
            fill="none"
            stroke={c}
            strokeWidth={PIE_R * 2}
            strokeDasharray={`${PIE_CIRC * (v.fraction ?? 0)} ${PIE_CIRC}`}
            transform={`rotate(-90 ${C} ${C})`}
          />
        </>
      )}

      {v.kind === 'check' && (
        <>
          <circle cx={C} cy={C} r={R + 0.4} fill={c} />
          <path
            d="M4.5 7.2 6.2 8.9 9.6 5.2"
            stroke="#fff"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}

      {v.kind === 'x' && (
        <>
          <circle cx={C} cy={C} r={R} stroke={c} strokeWidth={1.5} />
          <path
            d="M5.2 5.2 8.8 8.8 M8.8 5.2 5.2 8.8"
            stroke={c}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}
