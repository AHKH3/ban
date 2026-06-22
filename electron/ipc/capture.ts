import { ipcMain, BrowserWindow } from 'electron'
import { createCard } from '../fs/cards'
import { indexCard } from '../db'
import { suppressPath } from '../watcher'
import { appendActivityEvent, cardSnapshot } from '../fs/activity'

type CardStatus = 'inbox' | 'shape' | 'ready' | 'doing' | 'review' | 'done' | 'killed'

const STATUS_ALIASES: Record<string, CardStatus> = {
  inbox: 'inbox', shape: 'shape', ready: 'ready', doing: 'doing',
  review: 'review', done: 'done', killed: 'killed',
  todo: 'ready', wip: 'doing', next: 'ready', kill: 'killed',
}

function parseCapture(raw: string): { title: string; status: CardStatus; tags: string[] } {
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

export function setupCaptureIPC(
  getMainWindow: () => BrowserWindow | null,
  getCaptureWindow: () => BrowserWindow | null
): void {
  ipcMain.handle('capture:submit', async (_event: Electron.IpcMainInvokeEvent, raw: string, projectPath: string) => {
    const parsed = parseCapture(raw)
    const card = createCard(projectPath, parsed, suppressPath)
    appendActivityEvent(projectPath, {
      kind: 'card.created',
      cardId: card.id,
      cardTitle: card.title,
      after: cardSnapshot(card),
    })
    indexCard(card, projectPath)
    const mainWindow = getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('board:changed', { projectPath })
    }
    return card
  })

  ipcMain.handle('capture:close', async () => {
    const win = getCaptureWindow()
    if (win && !win.isDestroyed()) win.hide()
  })
}
