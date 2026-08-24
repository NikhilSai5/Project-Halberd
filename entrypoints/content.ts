import { defineContentScript } from 'wxt/utils/define-content-script';

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
  main() {
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type !== 'EXTRACT_CONTENT') return;
      return Promise.resolve({ type: 'CONTENT_EXTRACTED', content: extractPageContent() });
    });
  },
});
