import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true,
        cors: true,
        headers: {
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Vendor chunks
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('react-router')) {
                  return 'router';
                }
                if (id.includes('lucide-react')) {
                  return 'icons';
                }
                if (id.includes('supabase') || id.includes('firebase')) {
                  return 'backend';
                }
                if (id.includes('qrcode') || id.includes('jsqr') || id.includes('html-to-image') || id.includes('jspdf')) {
                  return 'utils';
                }
                if (id.includes('@stripe') || id.includes('stripe')) {
                  return 'payments';
                }
                return 'vendor';
              }
              // Application chunks
              if (id.includes('lib/')) {
                return 'lib';
              }
              if (id.includes('components/')) {
                return 'components';
              }
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        }
      }
    };
});
