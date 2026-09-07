import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['gaf.png', 'favicon.svg'],
      manifest: {
        name: 'EXERCISE RESOLUTE SYNERGY — Entry Registration',
        short_name: 'Resolute Entry',
        description: 'Military Entry Control and Personnel Registration System',
        theme_color: '#0A1128',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'any',
        start_url: '/dashboard',
        icons: [
          {
            src: '/gaf.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/gaf.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
