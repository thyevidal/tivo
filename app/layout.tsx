import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tivo — Seu assistente financeiro',
  description: 'Gerencie suas finanças com inteligência artificial',
  icons: {
    icon: [
      { url: '/tivo-logo.png', sizes: 'any' },
      { url: '/tivo-logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/tivo-logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Tivo — Seu assistente financeiro',
    description: 'Gerencie suas finanças com inteligência artificial',
    images: [{ url: '/tivo-logo.png', width: 512, height: 512 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tivo — Seu assistente financeiro',
    description: 'Gerencie suas finanças com inteligência artificial',
    images: ['/tivo-logo.png'],
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
