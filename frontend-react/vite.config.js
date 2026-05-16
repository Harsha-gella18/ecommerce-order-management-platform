import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Local dev: send each /api/* family straight to the service (same as gateway + StripPrefix=1). Auth keeps full /api/auth path */
const stripApi = (path) => path.replace(/^\/api/, '') || '/';

export default defineConfig({
  plugins: [react()],
  server: {
    /** Storefront in dev — API runs on other ports (8080 gateway, 8081 auth, …). */
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    open: true,
    proxy: {
      // Order: more specific /api/... prefixes first; generic `/api` last (fallback to gateway).
      '/api/auth': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      '/api/users': {
        target: 'http://127.0.0.1:8082',
        changeOrigin: true,
        rewrite: stripApi,
      },
      '/api/products': {
        target: 'http://127.0.0.1:8083',
        changeOrigin: true,
        rewrite: stripApi,
      },
      '/api/inventory': {
        target: 'http://127.0.0.1:8084',
        changeOrigin: true,
        rewrite: stripApi,
      },
      '/api/cart': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: stripApi,
      },
      '/api/orders': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
        rewrite: stripApi,
      },
      '/api/payments': {
        target: 'http://127.0.0.1:8086',
        changeOrigin: true,
        rewrite: stripApi,
      },
      '/api/notifications': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
        rewrite: stripApi,
      },
      '/api/analytics': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: stripApi,
      },
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
});
