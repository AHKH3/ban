// Critical layout CSS for the capture bar, shipped inline in the route's initial
// HTML so the bar is full-width + centered even if the Tailwind stylesheet hasn't
// applied yet (Electron can paint the window before /_next CSS loads). Tailwind
// classes layer visual polish on top; these rules only own the skeleton.
const criticalCss = `
#capture-root{position:fixed;inset:0;display:flex;flex-direction:column;overflow:hidden;background:var(--surface-1)}
#capture-root form{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:14px 16px}
#capture-row{display:flex;align-items:center;gap:12px}
#capture-row input{flex:1 1 auto;min-width:0;background:transparent}
#capture-foot{display:flex;align-items:center;justify-content:space-between;gap:12px}
`

export default function CaptureLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: criticalCss }} />
      {children}
    </>
  )
}
