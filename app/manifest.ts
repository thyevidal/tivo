import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tivo ERP',
    short_name: 'Tivo',
    description: 'Seu assistente financeiro inteligente',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0c10',
    theme_color: '#4f46e5',
    icons: [
      {
        src: '/tivo-logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
