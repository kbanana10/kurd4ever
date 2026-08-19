import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false // kept false for dev to avoid caching during dev
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /\.(?:mp3|wav|ogg|woff2?)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'audio-and-fonts-cache',
                expiration: {
                  maxEntries: 300,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        includeAssets: ['favicon.png', 'apple-touch-icon.png'],
        manifest: {
          // AUDIT FIX: the manifest pointed at favicon.ico, which does not exist
          // in /public. The PWA was therefore un-installable (Chrome requires a
          // >=192px icon) and every notification rendered a broken image.
          name: 'Kurdish Quest — Learn Kurmanji',
          short_name: 'Kurdish Quest',
          description: 'Learn Kurdish (Kurmanji) with lessons, quizzes and games.',
          theme_color: '#4f46e5',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      // AUDIT FIX: the original build emitted one 2,327 kB chunk. Route-level
      // React.lazy() split the pages out; this splits the remaining vendor
      // weight so Firebase (only needed for Google sign-in and cloud sync) and
      // the animation runtime are cached independently of app code and are not
      // on the critical path for first paint.
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('firebase') || id.includes('@firebase')) return 'vendor-firebase';
            if (id.includes('motion') || id.includes('framer')) return 'vendor-motion';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react-confetti') || id.includes('tween-functions')) return 'vendor-confetti';
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            return 'vendor';
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
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts: true,
    },
  };
});
