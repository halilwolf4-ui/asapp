import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'maskable-icon-512x512.png'],
      manifest: {
        name: 'Asapp — Tablet Hedef & Görev Yöneticisi',
        short_name: 'Asapp',
        description: 'Asapp — Tablet için Tipografi Odaklı Hedef ve Görev Yöneticisi',
        theme_color: '#0D133D',
        background_color: '#0D133D',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        enabled: false, // Dev modunda kapalı tutularak önbellek çakışmaları engellenir
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true, // Aynı Wi-Fi ağındaki iPad/Android tabletten erişim için
  },
  preview: {
    port: 4173,
    host: true,
  },
});
