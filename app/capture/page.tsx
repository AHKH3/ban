'use client'

import { CaptureInput } from '@/components/capture/CaptureInput'

export default function CapturePage() {
  return (
    <main
      className="fixed inset-0 flex flex-col overflow-hidden bg-surface-1"
      // Inline critical layout so the bar fills + centers even if the stylesheet
      // hasn't applied yet (the capture window paints the moment it's revealed).
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <CaptureInput />
    </main>
  )
}
