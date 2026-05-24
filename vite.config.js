import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Micro Tracker',
        short_name: 'Micro',
        description: 'Premium fitness & nutrition tracking by Peter',
        theme_color: '#0A1628',
        background_color: '#0A1628',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png',  sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png',  sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png',  sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
});
