type PanStartLike = {
  button: number
  target: EventTarget | null
}

const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  '[contenteditable]',
  '[draggable="true"]',
  '[data-board-pan-ignore]',
].join(',')

export function shouldStartBoardPan(event: PanStartLike) {
  if (event.button !== 0) return false
  if (!event.target || !('closest' in event.target)) return false

  return !(event.target as Element).closest(INTERACTIVE_SELECTOR)
}
