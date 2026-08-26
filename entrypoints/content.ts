import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
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
    title: document.title?.trim() ?? '',
    headings,
    bodyText,
    metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '',
    capturedAt: Date.now(),
  };
}

function mountFloatingCircle() {
  // 1. Only mount in top-level window (not nested iframes)
  if (window.self !== window.top) return;

  // 2. Prevent duplicate mounts
  if (document.getElementById('halberd-floating-circle-host')) return;

  const target = document.documentElement || document.body;
  if (!target) return;

  try {
    const host = document.createElement('div');
    host.id = 'halberd-floating-circle-host';
    host.style.cssText =
      'position: fixed !important; top: 0 !important; left: 0 !important; width: 0 !important; height: 0 !important; overflow: visible !important; z-index: 2147483647 !important; pointer-events: none !important; border: none !important; margin: 0 !important; padding: 0 !important;';

    const shadow = host.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.id = 'halberd-floating-root';
    container.style.cssText =
      'position: fixed !important; top: 0 !important; left: 0 !important; width: 0 !important; height: 0 !important; overflow: visible !important; pointer-events: none !important; border: none !important; margin: 0 !important; padding: 0 !important;';

    shadow.appendChild(container);
    target.appendChild(host);

    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(FloatingCircle));
  } catch (err) {
    console.error('[Halberd] Error mounting floating circle:', err);
  }
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    // Listen for background page content extraction
    try {
      if (browser?.runtime?.onMessage) {
        browser.runtime.onMessage.addListener((message) => {
          if (message?.type !== 'EXTRACT_CONTENT') return;
          return Promise.resolve({ type: 'CONTENT_EXTRACTED', content: extractPageContent() });
        });
      }
    } catch {
      // Ignored
    }

    // Mount immediately or once DOM is interactive
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountFloatingCircle);
    } else {
      mountFloatingCircle();
    }
  },
});
