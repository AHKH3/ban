import type { CardStatus } from './types'

const STATUS_ALIASES: Record<string, CardStatus> = {
  inbox: 'inbox',
  shape: 'shape',
  ready: 'ready',
  doing: 'doing',
  review: 'review',
  done: 'done',
  killed: 'killed',
  // aliases
  todo: 'ready',
  wip: 'doing',
  next: 'ready',
  kill: 'killed',
}

export interface ParsedCapture {
  title: string
  status: CardStatus
  tags: string[]
}

export function parseCapture(raw: string): ParsedCapture {
  const tokens = raw.trim().split(/\s+/)
  const tags: string[] = []
  let status: CardStatus = 'inbox'
  const titleTokens: string[] = []

  for (const token of tokens) {
    if (token.startsWith('@')) {
      const key = token.slice(1).toLowerCase()
      const mapped = STATUS_ALIASES[key]
      if (mapped) status = mapped
    } else if (token.startsWith('#')) {
      const tag = token.slice(1)
      if (tag.length > 0) tags.push(tag.toLowerCase())
    } else if (token.length > 0) {
      titleTokens.push(token)
    }
  }

  return {
    title: titleTokens.join(' ').trim() || 'Untitled',
    status,
    tags,
  }
}
