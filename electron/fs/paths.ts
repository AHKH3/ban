import * as path from 'path'
import type { CardStatus } from '../../lib/types'

// The canonical kanban statuses, in board order.
export const STATUSES: CardStatus[] = ['inbox', 'shape', 'ready', 'doing', 'review', 'done', 'killed']

// Visible, local truth: tasks live in a plain `Tasks/` folder at the project
// root so any agent can discover and read them without a hidden dotfolder.
export const TASKS_DIRNAME = 'Tasks'

// Hidden app-internal data (config, tags, activity cache). Not "truth" — gitignored.
export const BAN_DIRNAME = '.ban'

// Pre-inversion layout that hid everything (cards + metadata) under `.kanban/`.
export const LEGACY_KANBAN_DIRNAME = '.kanban'

export function banDir(projectPath: string): string {
  return path.join(projectPath, BAN_DIRNAME)
}

export function tasksDir(projectPath: string): string {
  return path.join(projectPath, TASKS_DIRNAME)
}

export function columnDir(projectPath: string, status: CardStatus): string {
  return path.join(tasksDir(projectPath), status)
}

export function legacyKanbanDir(projectPath: string): string {
  return path.join(projectPath, LEGACY_KANBAN_DIRNAME)
}
