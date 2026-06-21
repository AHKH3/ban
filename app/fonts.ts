import { Source_Serif_4, Noto_Naskh_Arabic, JetBrains_Mono } from 'next/font/google'

// Classic English typeface — Source Serif 4 (a refined, screen-legible classic serif)
export const fontEn = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-en',
})

// Arabic — Noto Naskh Arabic, used for all Arabic text everywhere
export const fontAr = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ar',
})

// Monospace for code blocks / inline code / shortcuts
export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const fontVariables = `${fontEn.variable} ${fontAr.variable} ${fontMono.variable}`
