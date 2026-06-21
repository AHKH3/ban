import type { Metadata } from 'next'
import '@/styles/globals.css'
import { fontVariables } from './fonts'
import { Providers } from '@/components/providers/Providers'

export const metadata: Metadata = {
  title: 'Ban — Local Kanban',
  icons: { icon: '/icon.png' },
}

// Applied before first paint to avoid a theme/direction flash (FOUC).
const bootScript = `
(function(){
  try {
    var s = JSON.parse(localStorage.getItem('ban-settings') || '{}');
    var theme = s.theme || 'dark-soft';
    var lang = s.lang || 'en';
    var el = document.documentElement;
    el.dataset.theme = theme;
    el.lang = lang;
    el.dir = lang === 'ar' ? 'rtl' : 'ltr';
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-theme="dark-soft" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png" />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className={fontVariables}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
