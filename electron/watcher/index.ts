import { BrowserWindow } from 'electron'
import type { FSWatcher } from 'chokidar'
import { tasksDir } from '../fs/paths'
import { readCardFile } from '../fs/cards'
import { appendActivityEvent, cardSnapshot } from '../fs/activity'

let watcher: FSWatcher | null = null
const suppressedPaths = new Set<string>()

export function suppressPath(filePath: string, durationMs = 600): void {
  suppressedPaths.add(filePath)
  setTimeout(() => suppressedPaths.delete(filePath), durationMs)
}

export function watchProject(projectPath: string, mainWindow: BrowserWindow): void {
  stopWatcher()

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const chokidar = require('chokidar')
  const columnsPath = tasksDir(projectPath)

  const w = chokidar.watch(columnsPath, {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 250, pollInterval: 100 },
  })
  watcher = w

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const notify = (): void => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('board:changed', { projectPath })
      }
    }, 150)
  }

  // An unsuppressed event means something other than Ban itself touched the
  // board — an agent or editor changing task files directly. Record it as an
  // attributed activity event so the Journey becomes a cross-agent flight recorder.
  const recordExternal = (fp: string): void => {
    if (!fp.endsWith('.md')) return
    try {
      const card = readCardFile(fp)
      appendActivityEvent(projectPath, {
        kind: 'card.updated',
        actor: 'external',
        source: 'external',
        cardId: card.id,
        cardTitle: card.title,
        after: cardSnapshot(card),
      })
    } catch { /* unreadable/partial write — skip */ }
  }

  w.on('add', (fp: string) => { if (!suppressedPaths.has(fp)) { recordExternal(fp); notify() } })
    .on('change', (fp: string) => { if (!suppressedPaths.has(fp)) { recordExternal(fp); notify() } })
    .on('unlink', () => notify())
}

export function stopWatcher(): void {
  if (watcher) {
    watcher.close()
    watcher = null
  }
}
