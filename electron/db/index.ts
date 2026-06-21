import * as path from 'path'
import { app } from 'electron'
import type { Card, SearchResult } from '../../lib/types'

// Lazy-load better-sqlite3 so startup is fast
let db: import('better-sqlite3').Database | null = null

function getDB(): import('better-sqlite3').Database {
  if (db) return db
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3')
  const dbPath = path.join(app.getPath('userData'), 'search.db')
  db = new Database(dbPath) as import('better-sqlite3').Database
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      status TEXT DEFAULT 'inbox',
      type TEXT DEFAULT 'task',
      project_path TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts
    USING fts5(
      id UNINDEXED,
      title,
      body,
      tags,
      content='cards',
      content_rowid='rowid'
    );

    CREATE TRIGGER IF NOT EXISTS cards_ai AFTER INSERT ON cards BEGIN
      INSERT INTO cards_fts(rowid, id, title, body, tags)
      VALUES (new.rowid, new.id, new.title, new.body, new.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS cards_ad AFTER DELETE ON cards BEGIN
      INSERT INTO cards_fts(cards_fts, rowid, id, title, body, tags)
      VALUES ('delete', old.rowid, old.id, old.title, old.body, old.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS cards_au AFTER UPDATE ON cards BEGIN
      INSERT INTO cards_fts(cards_fts, rowid, id, title, body, tags)
      VALUES ('delete', old.rowid, old.id, old.title, old.body, old.tags);
      INSERT INTO cards_fts(rowid, id, title, body, tags)
      VALUES (new.rowid, new.id, new.title, new.body, new.tags);
    END;
  `)
  return db
}

export function indexCard(card: Card, projectPath: string): void {
  try {
    const d = getDB()
    const exists = d.prepare('SELECT id FROM cards WHERE id = ?').get(card.id)
    if (exists) {
      d.prepare(`
        UPDATE cards SET title=?, body=?, tags=?, status=?, type=?, project_path=?, updated_at=?
        WHERE id=?
      `).run(card.title, card.body, card.tags.join(' '), card.status, card.type, projectPath, card.updatedAt, card.id)
    } else {
      d.prepare(`
        INSERT INTO cards (id, title, body, tags, status, type, project_path, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(card.id, card.title, card.body, card.tags.join(' '), card.status, card.type, projectPath, card.updatedAt)
    }
  } catch { /* ignore index errors */ }
}

export function removeFromIndex(cardId: string): void {
  try {
    const d = getDB()
    d.prepare('DELETE FROM cards WHERE id = ?').run(cardId)
  } catch { /* ignore */ }
}

export function indexProject(cards: Card[], projectPath: string): void {
  try {
    const d = getDB()
    const upsert = d.prepare(`
      INSERT OR REPLACE INTO cards (id, title, body, tags, status, type, project_path, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const run = d.transaction(() => {
      d.prepare('DELETE FROM cards WHERE project_path = ?').run(projectPath)
      for (const card of cards) {
        upsert.run(card.id, card.title, card.body, card.tags.join(' '), card.status, card.type, projectPath, card.updatedAt)
      }
    })
    run()
  } catch { /* ignore */ }
}

export function searchCards(query: string, projectPath: string): SearchResult[] {
  if (!query.trim()) return []
  try {
    const d = getDB()
    const safeQuery = query.replace(/['"]/g, '') + '*'
    const rows = d.prepare(`
      SELECT c.id, c.title, c.status, c.type, c.tags,
             snippet(cards_fts, 2, '[', ']', '...', 20) AS excerpt
      FROM cards c
      JOIN cards_fts ON c.id = cards_fts.id
      WHERE cards_fts MATCH ?
        AND c.project_path = ?
      ORDER BY rank
      LIMIT 25
    `).all(safeQuery, projectPath) as Array<{
      id: string; title: string; status: string; type: string; tags: string; excerpt: string
    }>

    return rows.map(r => ({
      id: r.id,
      title: r.title,
      status: r.status as SearchResult['status'],
      type: r.type as SearchResult['type'],
      tags: r.tags ? r.tags.split(' ').filter(Boolean) : [],
      excerpt: r.excerpt || '',
    }))
  } catch {
    return []
  }
}
