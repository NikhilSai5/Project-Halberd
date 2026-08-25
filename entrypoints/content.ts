import { defineContentScript } from 'wxt/utils/define-content-script';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import ReactDOM from 'react-dom/client';
import React from 'react';
import FloatingCircle from '@/components/FloatingCircle';

interface PageContent {
  url: string;
  title: string;
  headings: string;
  bodyText: string;
  metaDescription: string;
  capturedAt: number;
}

const MAX_CONTENT_LENGTH = 5000;

function extractPageContent(): PageContent {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .map((heading) => heading.textContent?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
    .slice(0, 1500);

  const bodyText = (document.body?.innerText ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CONTENT_LENGTH);

  return {
    url: window.location.href,
    title: document.title.trim(),
    headings,
    bodyText,
    metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '',
    capturedAt: Date.now(),
  };
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  async main(ctx) {
    // 1. Listen for background page content extraction
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type !== 'EXTRACT_CONTENT') return;
      return Promise.resolve({ type: 'CONTENT_EXTRACTED', content: extractPageContent() });
    });

    // 2. Prevent mounting inside nested iframes (only mount in top-level window)
    if (window.self !== window.top) {
      return;
    }

    // 3. Avoid duplicate mounts if already present
    if (document.querySelector('halberd-floating-circle-host')) {
      return;
    }

    // 4. Mount floating circle in isolated Shadow DOM
    try {
      const anchorElement = document.body || document.documentElement;
      const ui = await createShadowRootUi(ctx, {
        name: 'halberd-floating-circle-host',
        position: 'inline',
        anchor: anchorElement,
        append: 'last',
        onMount(container, shadow, shadowHost) {
          // Ensure shadow host and container have top-level z-index and don't block clicks
          shadowHost.style.cssText =
            'position: fixed !important; top: 0 !important; left: 0 !important; width: 0 !important; height: 0 !important; overflow: visible !important; z-index: 2147483647 !important; pointer-events: none !important; border: none !important; margin: 0 !important; padding: 0 !important;';
          container.style.cssText =
            'position: fixed !important; top: 0 !important; left: 0 !important; width: 0 !important; height: 0 !important; overflow: visible !important; pointer-events: none !important; border: none !important; margin: 0 !important; padding: 0 !important;';

          const app = document.createElement('div');
          app.id = 'halberd-floating-root';
          app.style.cssText = 'pointer-events: none;';
          container.append(app);

          const root = ReactDOM.createRoot(app);
          root.render(React.createElement(FloatingCircle));
          return root;
        },
        onRemove(root) {
          root?.unmount();
        },
      });

      ui.mount();
    } catch (err) {
      console.error('[Halberd] Error mounting floating circle content script UI:', err);
    }
  },
});
