export type ShortcutAction = 'capture' | 'palette' | 'newCard' | 'save'

export interface ShortcutBinding {
  code: string
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
}

export type ShortcutMap = Record<ShortcutAction, ShortcutBinding>

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  capture: { code: 'Space', ctrl: true, shift: true, alt: false, meta: false },
  palette: { code: 'KeyK', ctrl: true, shift: false, alt: false, meta: false },
  newCard: { code: 'KeyN', ctrl: false, shift: false, alt: false, meta: false },
  save: { code: 'KeyS', ctrl: true, shift: false, alt: false, meta: false },
}

const MODIFIER_CODES = new Set([
  'AltLeft',
  'AltRight',
  'ControlLeft',
  'ControlRight',
  'MetaLeft',
  'MetaRight',
  'ShiftLeft',
  'ShiftRight',
])

const CODE_LABELS: Record<string, string> = {
  Backquote: '`',
  Backslash: '\\',
  BracketLeft: '[',
  BracketRight: ']',
  Comma: ',',
  Equal: '=',
  Minus: '-',
  Period: '.',
  Quote: "'",
  Semicolon: ';',
  Slash: '/',
  Space: 'Space',
}

export function isModifierCode(code: string): boolean {
  return MODIFIER_CODES.has(code)
}

export function shortcutFromEvent(event: Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>): ShortcutBinding | null {
  if (!event.code || isModifierCode(event.code)) return null
  return {
    code: event.code,
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
    meta: event.metaKey,
  }
}

export function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutBinding): boolean {
  return (
    event.code === shortcut.code &&
    event.ctrlKey === shortcut.ctrl &&
    event.shiftKey === shortcut.shift &&
    event.altKey === shortcut.alt &&
    event.metaKey === shortcut.meta
  )
}

export function formatShortcut(shortcut: ShortcutBinding): string {
  const keys: string[] = []
  if (shortcut.ctrl) keys.push('Ctrl')
  if (shortcut.shift) keys.push('Shift')
  if (shortcut.alt) keys.push('Alt')
  if (shortcut.meta) keys.push('Meta')
  keys.push(formatCode(shortcut.code))
  return keys.join(' + ')
}

export function shortcutToAccelerator(shortcut: ShortcutBinding): string | null {
  const key = codeToAcceleratorKey(shortcut.code)
  if (!key) return null

  const keys: string[] = []
  if (shortcut.ctrl) keys.push('CommandOrControl')
  if (shortcut.shift) keys.push('Shift')
  if (shortcut.alt) keys.push('Alt')
  if (shortcut.meta) keys.push('Super')
  keys.push(key)
  return keys.join('+')
}

function formatCode(code: string): string {
  if (CODE_LABELS[code]) return CODE_LABELS[code]
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (/^Numpad[0-9]$/.test(code)) return `Num ${code.slice(6)}`
  if (code.startsWith('Arrow')) return code.replace('Arrow', '')
  return code.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function codeToAcceleratorKey(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code
  if (code.startsWith('Arrow')) return code.replace('Arrow', '')

  const aliases: Record<string, string> = {
    Backspace: 'Backspace',
    Delete: 'Delete',
    End: 'End',
    Enter: 'Enter',
    Escape: 'Escape',
    Home: 'Home',
    Insert: 'Insert',
    PageDown: 'PageDown',
    PageUp: 'PageUp',
    Space: 'Space',
    Tab: 'Tab',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backquote: '`',
  }

  return aliases[code] ?? null
}
