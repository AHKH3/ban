import * as path from 'path'
import { BrowserWindow } from 'electron'
import type { FSWatcher } from 'chokidar'

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
  const columnsPath = path.join(projectPath, '.kanban', 'columns')

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

  w.on('add', (fp: string) => { if (!suppressedPaths.has(fp)) notify() })
    .on('change', (fp: string) => { if (!suppressedPaths.has(fp)) notify() })
    .on('unlink', () => notify())
}

export function stopWatcher(): void {
  if (watcher) {
    watcher.close()
    watcher = null
  }
}
