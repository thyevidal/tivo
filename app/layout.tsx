import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tivo — Seu assistente financeiro',
  description: 'Gerencie suas finanças com inteligência artificial',
  icons: {
    icon: [
      { url: '/icon.png?v=1', sizes: 'any' },
      { url: '/icon.png?v=1', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png?v=1', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Tivo — Seu assistente financeiro',
    description: 'Gerencie suas finanças com inteligência artificial',
    images: [{ url: '/icon.png?v=1', width: 512, height: 512 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tivo — Seu assistente financeiro',
    description: 'Gerencie suas finanças com inteligência artificial',
    images: ['/icon.png?v=1'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
}

import { ThemeProvider } from './components/ThemeProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
