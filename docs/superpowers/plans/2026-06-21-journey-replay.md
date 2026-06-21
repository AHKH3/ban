# Journey Replay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a project-level Journey view that records Ban app actions and replays card life over a selected time range.

**Architecture:** Add an append-only activity log under `.kanban/activity/*.jsonl`, written from the existing Electron IPC card/capture actions. Expose range-filtered activity through preload IPC, then add a read-only React Journey mode that reconstructs and animates card movement on the familiar Kanban stage.

**Tech Stack:** Electron IPC, Node filesystem JSONL, TypeScript shared types, React, Zustand, Framer Motion, Tailwind CSS.

---

## File Structure

- Modify `lib/types.ts`: add activity event, range, replay mode, and card snapshot types.
- Create `electron/fs/activity.ts`: append/read JSONL activity events and build card snapshots.
- Create `electron/ipc/activity.ts`: expose activity range reads to the renderer.
- Modify `electron/ipc/cards.ts`: record create/update/move/delete card events.
- Modify `electron/ipc/capture.ts`: record quick-capture create events.
- Modify `electron/ipc/index.ts`: register the activity IPC handler.
- Modify `electron/preload/index.ts`: expose `getActivityEvents`.
- Modify `lib/ipc.ts`: type the new activity API.
- Modify `lib/store/ui.ts`: add `activeView` and setters for Board/Journey.
- Modify `components/layout/Sidebar.tsx`: add Board and Journey navigation for the active project.
- Create `components/journey/JourneyView.tsx`: own range state, playback, frame reconstruction, controls, board stage, and event strip.
- Modify `app/page.tsx`: switch between editable Board and read-only Journey.
- Modify `lib/i18n.ts`: add Journey labels in English and Arabic.
- Verify with `npm run build`.

## Task 1: Shared Activity Types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add shared activity types**

Add these exported types after the existing card input/search types:

```ts
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
```

- [ ] **Step 2: Run TypeScript build**

Run: `npm run build`

Expected: it may still pass because the types are unused, or fail only if names conflict.

## Task 2: Activity Log Filesystem Layer

**Files:**
- Create: `electron/fs/activity.ts`

- [ ] **Step 1: Implement JSONL writer and reader**

Create `electron/fs/activity.ts` with:

```ts
import * as fs from 'fs'
import * as path from 'path'
import { nanoid } from 'nanoid'
import type { ActivityEvent, ActivityRange, ActivityCardSnapshot, Card } from '../../lib/types'
import { kanbanDir } from './project'

export function activityDir(projectPath: string): string {
  return path.join(kanbanDir(projectPath), 'activity')
}

export function activityFilePath(projectPath: string, date = new Date()): string {
  const month = date.toISOString().slice(0, 7)
  return path.join(activityDir(projectPath), `${month}.jsonl`)
}

export function cardSnapshot(card: Card): ActivityCardSnapshot {
  return {
    id: card.id,
    title: card.title,
    status: card.status,
    type: card.type,
    priority: card.priority,
    tags: [...card.tags],
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    fileName: card.fileName,
  }
}

export function appendActivityEvent(
  projectPath: string,
  event: Omit<ActivityEvent, 'id' | 'schemaVersion' | 'actor' | 'source' | 'createdAt'>
): ActivityEvent {
  const createdAt = new Date().toISOString()
  const fullEvent: ActivityEvent = {
    id: `evt_${nanoid(10)}`,
    schemaVersion: 1,
    actor: 'ban',
    source: 'app',
    createdAt,
    ...event,
  }

  const dir = activityDir(projectPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.appendFileSync(activityFilePath(projectPath, new Date(createdAt)), `${JSON.stringify(fullEvent)}\n`, 'utf-8')
  return fullEvent
}

export function readActivityEvents(projectPath: string, range: ActivityRange = {}): ActivityEvent[] {
  const dir = activityDir(projectPath)
  if (!fs.existsSync(dir)) return []

  const startMs = range.start ? new Date(range.start).getTime() : Number.NEGATIVE_INFINITY
  const endMs = range.end ? new Date(range.end).getTime() : Number.POSITIVE_INFINITY

  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.jsonl'))
    .sort()
    .flatMap(file => readActivityFile(path.join(dir, file)))
    .filter(event => {
      const time = new Date(event.createdAt).getTime()
      return Number.isFinite(time) && time >= startMs && time <= endMs
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

function readActivityFile(filePath: string): ActivityEvent[] {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return raw.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .flatMap(line => {
      try {
        const parsed = JSON.parse(line) as ActivityEvent
        return parsed.schemaVersion === 1 && typeof parsed.kind === 'string' ? [parsed] : []
      } catch {
        return []
      }
    })
}
```

- [ ] **Step 2: Run Electron TypeScript compile**

Run: `npx tsc -p tsconfig.electron.json`

Expected: PASS.

## Task 3: Record Card Activity

**Files:**
- Modify: `electron/ipc/cards.ts`
- Modify: `electron/ipc/capture.ts`

- [ ] **Step 1: Log create/update/move/delete from cards IPC**

Import `appendActivityEvent` and `cardSnapshot`, then append:

- `card.created` after `createCard`.
- `card.updated` after `updateCardFile`.
- `card.moved` after `moveCardFile`.
- `card.deleted` before/after `deleteCardFile` using the existing card snapshot.

Compute `changedFields` for updates by comparing title, status, type, priority, tags, and body presence; do not log the body itself.

- [ ] **Step 2: Log quick capture creates**

In `electron/ipc/capture.ts`, append `card.created` after `createCard`.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

## Task 4: Activity IPC Bridge

**Files:**
- Create: `electron/ipc/activity.ts`
- Modify: `electron/ipc/index.ts`
- Modify: `electron/preload/index.ts`
- Modify: `lib/ipc.ts`

- [ ] **Step 1: Add activity IPC handler**

Create `electron/ipc/activity.ts`:

```ts
import { ipcMain } from 'electron'
import type { ActivityRange } from '../../lib/types'
import { readActivityEvents } from '../fs/activity'

export function setupActivityIPC(): void {
  ipcMain.handle('activity:list', async (_event, projectPath: string, range: ActivityRange = {}) => {
    return readActivityEvents(projectPath, range)
  })
}
```

- [ ] **Step 2: Register it**

In `electron/ipc/index.ts`, import and call `setupActivityIPC()`.

- [ ] **Step 3: Expose it to renderer**

Add `getActivityEvents(projectPath, range)` to `electron/preload/index.ts` and `lib/ipc.ts`.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS.

## Task 5: Navigation State

**Files:**
- Modify: `lib/store/ui.ts`
- Modify: `components/layout/Sidebar.tsx`
- Modify: `lib/i18n.ts`

- [ ] **Step 1: Add active view state**

Add `activeView: 'board' | 'journey'`, `showBoard()`, and `showJourney()` to the UI store.

- [ ] **Step 2: Add Sidebar navigation**

When a project is open, show compact Board and Journey buttons. Use existing icons where possible: `BoardIcon` for Board and `Analytics01Icon` or a wrapped Journey icon for Journey.

- [ ] **Step 3: Add labels**

Add `nav.board`, `nav.journey`, `journey.title`, and core Journey control labels to both dictionaries in `lib/i18n.ts`.

- [ ] **Step 4: Run Next build**

Run: `npm run build`

Expected: PASS.

## Task 6: Journey Replay UI

**Files:**
- Create: `components/journey/JourneyView.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Build range controls**

Implement range presets: today, week, month, all, and custom date inputs. Store dates in component state and request activity events whenever range changes.

- [ ] **Step 2: Build replay reconstruction**

Inside `JourneyView.tsx`, derive cards from ordered events:

- For `range-state`, preload events before the selected range and apply them before playback.
- For `empty`, start with no cards.
- Apply events up to the playhead index for the visible board.

- [ ] **Step 3: Build read-only board stage**

Render the same seven statuses, cards grouped by status, muted baseline cards, and highlighted active cards. Do not attach drag, edit, or create behavior.

- [ ] **Step 4: Build Journey Strip**

Render event pulses, a playhead slider, selected event text, and click-to-jump behavior.

- [ ] **Step 5: Wire page view switch**

In `app/page.tsx`, render `<JourneyView />` when `activeView === 'journey'`; otherwise render `<Board />`.

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: PASS.

## Task 7: Verification

**Files:**
- No planned source edits unless verification exposes a bug.

- [ ] **Step 1: Build**

Run: `npm run build`

Expected: PASS for Next and Electron TypeScript.

- [ ] **Step 2: Manual dev smoke**

Run: `npm run dev`

Expected:

- App launches.
- Existing board still opens.
- Sidebar has Board/Journey.
- Creating, moving, updating, and deleting a card creates `.kanban/activity/YYYY-MM.jsonl` events.
- Journey opens without crashing.
- Range and playback controls work.
- Journey shows card-only replay events.

- [ ] **Step 3: Commit implementation**

Stage only source files and docs created for this feature, excluding unrelated `.kanban/columns` moves.

Commit message:

```bash
git commit -m "Add Journey Replay activity log"
```

## Self-Review

- Spec coverage: The plan records Ban-only activity, displays only card-life events, supports flexible ranges, includes range-state and empty replay modes, and keeps Git/source-code tracking out of scope.
- Placeholder scan: No TBD/TODO placeholders are used.
- Type consistency: Activity types are defined in `lib/types.ts` before Electron and renderer code consume them.
