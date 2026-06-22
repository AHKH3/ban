// Critical layout CSS for the capture bar, shipped inline in the route's initial
// HTML so the bar is full-width + centered even if the Tailwind stylesheet hasn't
// applied yet (Electron can paint the window before /_next CSS loads). Tailwind
// classes layer visual polish on top; these rules only own the skeleton.
const criticalCss = `
:root,[data-theme='dark-soft']{color-scheme:dark;--surface-1:#0F1011;--surface-2:#161718;--surface-3:#1C1D20;--border-subtle:rgba(255,255,255,.06);--text-primary:#F4F5F8;--text-muted:#777B86;--accent:#5E6AD2;--accent-soft:rgba(94,106,210,.16);--accent-border:rgba(94,106,210,.34);--accent-contrast:#fff}
[data-theme='dark-oled']{color-scheme:dark;--surface-1:#070708;--surface-2:#0E0E10;--surface-3:#161618;--border-subtle:rgba(255,255,255,.05);--text-primary:#F6F7FA;--text-muted:#6C707A;--accent:#6E79E0;--accent-soft:rgba(110,121,224,.16);--accent-border:rgba(110,121,224,.36);--accent-contrast:#fff}
[data-theme='light-white']{color-scheme:light;--surface-1:#F7F8FA;--surface-2:#F0F1F4;--surface-3:#E7E9EE;--border-subtle:rgba(15,17,23,.08);--text-primary:#16181D;--text-muted:#80858F;--accent:#5E6AD2;--accent-soft:rgba(94,106,210,.12);--accent-border:rgba(94,106,210,.4);--accent-contrast:#fff}
[data-theme='light-paper']{color-scheme:light;--surface-1:#EFEBE1;--surface-2:#E8E3D6;--surface-3:#DED8C8;--border-subtle:rgba(60,50,30,.1);--text-primary:#2A2620;--text-muted:#908871;--accent:#9A6A3C;--accent-soft:rgba(154,106,60,.14);--accent-border:rgba(154,106,60,.4);--accent-contrast:#fff}
#capture-root{position:fixed;inset:0;display:flex;flex-direction:column;overflow:hidden;background:var(--surface-1);color:var(--text-primary)}
#capture-root form{position:relative;flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;gap:12px;padding:16px;margin:0;-webkit-app-region:no-drag}
#capture-drag-handle{position:absolute;left:12px;right:12px;top:4px;height:12px;-webkit-app-region:drag}
#capture-root button,#capture-root input{-webkit-app-region:no-drag}
#capture-target,#capture-projects{display:flex;align-items:center;gap:8px;-webkit-app-region:no-drag}
#capture-target{justify-content:space-between}
#capture-target button,#capture-projects button{min-width:0;border:1px solid var(--border-subtle);border-radius:6px;background:var(--surface-2);color:var(--text-muted);font:12px/1.2 inherit}
#capture-target button{display:flex;align-items:center;gap:8px;max-width:280px;padding:6px 10px;color:var(--text-primary)}
#capture-target>span{display:flex;align-items:center;gap:8px;color:var(--text-muted);font:600 11px/1.2 inherit;text-transform:uppercase;letter-spacing:.08em}
#capture-target>span>span{display:grid;width:24px;height:24px;place-items:center;border:1px solid var(--accent-border);border-radius:6px;background:var(--accent-soft);color:var(--accent)}
#capture-target button span,#capture-projects button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#capture-projects{overflow:hidden}
#capture-projects button{padding:6px 10px;background:transparent}
#capture-row{display:flex;align-items:center;gap:8px;border:1px solid var(--border-subtle);border-radius:12px;background:var(--surface-2);padding:8px;-webkit-app-region:no-drag}
#capture-row button{display:grid;width:36px;height:36px;min-width:36px;place-items:center;border-radius:8px}
#capture-row input{flex:1 1 auto;min-width:0;height:36px;border:0;background:transparent;color:var(--text-primary);font:15px/1.3 inherit;outline:0;padding:0 8px}
#capture-row input::placeholder{color:var(--text-muted);opacity:1}
#capture-row button{border:0;background:var(--accent);color:var(--accent-contrast);padding:0;cursor:pointer}
#capture-row button:disabled{opacity:.4;cursor:default}
#capture-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-inline:4px;color:var(--text-muted);font-size:11px;line-height:1.2;-webkit-app-region:no-drag}
#capture-foot span{display:flex;align-items:center;gap:6px;min-width:0}
#capture-foot>span:first-child span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#capture-foot>span:last-child{flex-shrink:0;gap:12px}
#capture-foot kbd{border:1px solid var(--border-subtle);border-radius:4px;padding:2px 6px;color:var(--text-muted);font:10px/1 monospace;background:transparent}
`

export default function CaptureLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: criticalCss }} />
      {children}
    </>
  )
}
