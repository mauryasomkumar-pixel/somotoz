import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      dyadComponentTagger(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg', 'offline.html'],
        manifest: {
          id: '/',
          name: 'Somotoz AI Suite',
          short_name: 'Somotoz',
          description: 'Multimodal AI Workspace, Mindful Journal & Real-Time Private Messaging',
          theme_color: '#070712',
          background_color: '#070712',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cacheId: 'somotoz-v2',
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: ['**/sw-custom.js', '**/firebase-messaging-sw.js'],
          navigateFallback: null,
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          runtimeCaching: [
            // 1. Always bypass cache for backend API routes & Firebase auth handlers
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/__/'),
              handler: 'NetworkOnly',
            },
            // 2. Always bypass cache for Firebase Auth, Firestore, Storage & Realtime DB
            {
              urlPattern: /^https:\/\/(firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|firebasestorage\.googleapis\.com|firebase\.googleapis\.com|fcmregistrations\.googleapis\.com|.*\.firebaseio\.com|.*\.firebaseapp\.com)\/.*/i,
              handler: 'NetworkOnly',
            },
            // 3. Navigation requests: try live network first, fallback to cached page or offline.html ONLY on failure
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'somotoz-pages-v2',
                networkTimeoutSeconds: 4,
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: {
                  statuses: [200],
                },
                precacheFallback: {
                  fallbackURL: '/offline.html',
                },
              },
            },
            // 4. Google Fonts static assets
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('lucide-react')) return 'vendor-lucide';
              if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
              if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
              if (id.includes('react-markdown') || id.includes('remark-')) return 'vendor-markdown';
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio to prevent WebSocket errors
      hmr: false,
      watch: null,
    },
  };
});
