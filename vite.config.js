import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'favicon-32.png'],
      workbox: {
        // Cache the app shell + remote listing photos for offline browsing.
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.includes('unsplash.com') || url.hostname.includes('picsum.photos'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'kaira-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Kaira — Premium Marketplace',
        short_name: 'Kaira',
        description: 'A premium Zambian marketplace. Buy and sell almost anything, your way.',
        theme_color: '#0b0c0e',
        background_color: '#0b0c0e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['shopping', 'lifestyle', 'business'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          // full-bleed cut: Android applies its own mask, and a rounded tile
          // inside that mask leaves visible corner gaps on the home screen
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
