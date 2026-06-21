'use client'

import { CaptureInput } from '@/components/capture/CaptureInput'

export default function CapturePage() {
  return (
    <main id="capture-root" className="fixed inset-0 flex flex-col overflow-hidden bg-surface-1">
      <CaptureInput />
    </main>
  )
}
