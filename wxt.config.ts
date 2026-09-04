import { defineConfig } from 'wxt';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  dev: {
    server: {
      // Keep the generated extension URLs, CSP, and HMR socket on one port.
      port: 3000,
      strictPort: true,
    },
  },
  manifest: {
    name: 'Halberd',
    description: 'Productivity and weekly goals extension',
    permissions: ['storage', 'tabs', 'alarms', 'idle', 'identity'],
    host_permissions: ['<all_urls>'],
    ...(env.VITE_GOOGLE_EXTENSION_CLIENT_ID ? {
      oauth2: {
        client_id: env.VITE_GOOGLE_EXTENSION_CLIENT_ID,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/tasks',
        ],
      },
    } : {}),
    chrome_url_overrides: {
      newtab: 'newtab.html',
    },
  },
});
