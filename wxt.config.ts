import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Halberd',
    description: 'Productivity and weekly goals extension',
    permissions: ['storage', 'tabs', 'alarms', 'idle', 'identity'],
    host_permissions: ['<all_urls>'],
    chrome_url_overrides: {
      newtab: 'newtab.html',
    },
  },
});
