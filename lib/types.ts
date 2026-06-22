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

// Who/what caused an event. 'ban' = an action through the app itself; 'external'
// = a change Ban observed on disk (an agent or another tool editing files directly).
export type ActivityActor = 'ban' | 'external' | string
export type ActivitySource = 'app' | 'external'

export interface ActivityEvent {
  id: string
  schemaVersion: 1
  kind: ActivityKind
  actor: ActivityActor
  source: ActivitySource
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

// --- Agent projection (the source-of-truth "write once, project everywhere") ---

export interface AgentInfo {
  id: string            // 'claude' | 'codex' | 'opencode'
  name: string          // display name
  configPath: string    // repo-relative native config file, e.g. 'CLAUDE.md'
  supportsImport: boolean
}

// --- File explorer (universal viewer/editor over the whole project) ---

export interface FileEntry {
  name: string
  relPath: string   // POSIX-style path relative to the project root
  isDir: boolean
}

export interface FileContent {
  relPath: string
  content: string
  binary: boolean   // true when not safely editable as text (skipped)
  tooLarge: boolean
}

// --- Skills (reusable agent skills as markdown, projected into agent configs) ---

export interface SkillDoc {
  id: string          // slug, also the filename stem
  name: string
  description: string
  body: string
  filePath: string
  fileName: string
}

// --- Plans (free-form planning documents, a flat collection under Plans/) ---

export interface PlanDoc {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  body: string
  filePath: string
  fileName: string
}

export interface AgentsState {
  agents: AgentInfo[]   // every agent Ban knows how to project to
  selected: string[]    // ids the user has opted into
  rulesPath: string     // repo-relative canonical rules file (e.g. 'RULES.md')
  rulesContent: string  // current contents of the canonical rules file
}

// --- Orchestration (assign a task to a local agent that runs on the repo) ---

// A locally-installed agent CLI Ban can drive. `available` is decided at runtime
// by probing the command; only available agents can be assigned a run.
export interface AvailableAgent {
  id: string          // 'codex' | 'claude' | 'antigravity' | 'opencode'
  name: string        // display name
  available: boolean  // command found on PATH
  version?: string    // detected CLI version, when probe-able
}

export type RunStatus = 'running' | 'completed' | 'failed' | 'cancelled'

// One streamed line from an agent run. `text` is human-readable; `raw` keeps the
// original (e.g. a JSON event) so nothing the agent emitted is ever lost.
export interface RunLine {
  t: string                              // ISO timestamp
  stream: 'stdout' | 'stderr' | 'system' // 'system' = Ban's own annotations
  text: string
  raw?: string
}

// The persisted record of a single run — the file-based, retrievable transcript
// that makes the conversation yours (lives in .ban/runs/, never a vendor cloud).
export interface RunMeta {
  id: string
  agentId: string
  agentName: string
  cardId: string
  cardTitle: string
  status: RunStatus
  startedAt: string
  endedAt?: string
  exitCode?: number
  sessionId?: string   // the agent's own session id, when it exposes one (resume)
  movedTo?: CardStatus // status the card was moved to on completion
  error?: string
}

export interface RunStartInput {
  projectPath: string
  cardId: string
  agentId: string
}

// main → renderer stream: either an output line or a lifecycle transition.
export type RunMessage =
  | { runId: string; kind: 'line'; line: RunLine }
  | { runId: string; kind: 'status'; meta: RunMeta }

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
