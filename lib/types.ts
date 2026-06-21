export type CardType = 'idea' | 'task' | 'bug' | 'problem' | 'decision' | 'question' | 'note'
export type CardStatus = 'inbox' | 'shape' | 'ready' | 'doing' | 'review' | 'done' | 'killed'
export type CardPriority = 'urgent' | 'high' | 'normal' | 'low'

export interface Card {
  id: string
  title: string
  status: CardStatus
  type: CardType
  priority: CardPriority
  tags: string[]
  createdAt: string
  updatedAt: string
  body: string
  filePath: string
  fileName: string
}

export interface NewCardInput {
  title: string
  status?: CardStatus
  type?: CardType
  priority?: CardPriority
  tags?: string[]
  body?: string
}

export type CardInput = Omit<Card, 'filePath' | 'fileName' | 'createdAt' | 'updatedAt'>

export interface BoardData {
  projectPath: string
  projectName: string
  columns: Record<CardStatus, Card[]>
  tags: string[]
}

export interface Project {
  path: string
  name: string
  lastOpenedAt: string
}

export interface SearchResult {
  id: string
  title: string
  status: CardStatus
  type: CardType
  tags: string[]
  excerpt: string
}

export type ActivityKind =
  | 'card.created'
  | 'card.updated'
  | 'card.moved'
  | 'card.deleted'
  | 'card.restored'
  | 'project.config.updated'
  | 'project.tags.updated'
  | 'project.settings.updated'

export interface ActivityCardSnapshot {
  id: string
  title: string
  status: CardStatus
  type: CardType
  priority: CardPriority
  tags: string[]
  createdAt: string
  updatedAt: string
  fileName?: string
}

export interface ActivityEvent {
  id: string
  schemaVersion: 1
  kind: ActivityKind
  actor: 'ban'
  source: 'app'
  createdAt: string
  cardId?: string
  cardTitle?: string
  before?: ActivityCardSnapshot
  after?: ActivityCardSnapshot
  changedFields?: string[]
}

export interface ActivityRange {
  start?: string
  end?: string
}

export type JourneyReplayMode = 'range-state' | 'empty'

export const ALL_STATUSES: CardStatus[] = [
  'inbox', 'shape', 'ready', 'doing', 'review', 'done', 'killed',
]

export const COLUMN_LABELS: Record<CardStatus, string> = {
  inbox: 'Inbox',
  shape: 'Shape',
  ready: 'Ready',
  doing: 'Doing',
  review: 'Review',
  done: 'Done',
  killed: 'Killed',
}

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  task: 'Task',
  idea: 'Idea',
  bug: 'Bug',
  problem: 'Problem',
  decision: 'Decision',
  question: 'Question',
  note: 'Note',
}

export const PRIORITY_LABELS: Record<CardPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
}

// Distinct, Linear-style colors per status (used by the status icons).
export const STATUS_COLORS: Record<CardStatus, string> = {
  inbox: '#8A8F98',  // neutral gray — backlog
  shape: '#A78BFA',  // violet — being shaped
  ready: '#3B82F6',  // blue — queued / ready
  doing: '#F2A93B',  // amber — in progress
  review: '#22C1C3',  // teal — in review
  done: '#3FB950',  // green — done
  killed: '#F85149',  // red — killed
}

export const TYPE_COLORS: Record<CardType, string> = {
  task: '#5E6AD2',
  idea: '#9B8AE0',
  bug: '#E5484D',
  problem: '#F5A524',
  decision: '#30A46C',
  question: '#5EB8D2',
  note: '#777B86',
}
