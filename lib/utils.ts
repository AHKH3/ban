import type { CardType, CardPriority } from './types'

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelative(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

export function defaultCardBody(title: string): string {
  return `# ${title}

## Why it matters



## Related



## Outcome

`
}

export const TYPE_EMOJI: Record<CardType, string> = {
  task: '☑',
  idea: '💡',
  bug: '🐛',
  problem: '⚠',
  decision: '⚖',
  question: '?',
  note: '📝',
}

export const PRIORITY_ORDER: Record<CardPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}
