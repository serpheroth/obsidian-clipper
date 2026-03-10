import type { Page } from 'playwright';
import { JSDOM } from 'jsdom';
import Defuddle from 'defuddle';
import { getDomain } from '../../src/utils/string-utils';

export interface PageData {
  content: string;
  selectedHtml: string;
  fullHtml: string;
  title: string;
  author: string;
  description: string;
  domain: string;
  favicon: string;
  image: string;
  published: string;
  site: string;
  wordCount: number;
  parseTime: number;
  schemaOrgData: unknown;
  metaTags: Array<{ name?: string | null; property?: string | null; content: string | null }>;
}

export async function extractPageContent(page: Page): Promise<PageData> {
  // Get the fully-rendered HTML from Playwright (after JS execution)
  const html = await page.content();
  const url = page.url();

  // Parse with jsdom so Defuddle gets a real DOM
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;

  // Run Defuddle content extraction
  const defuddled = new Defuddle(document, { url }).parse();

  // Absolutize relative URLs (mirrors content.ts logic)
  document.querySelectorAll('[src], [href], [srcset]').forEach(el => {
    (['src', 'href', 'srcset'] as const).forEach(attr => {
      const value = el.getAttribute(attr);
      if (!value) return;
      if (attr === 'srcset') {
        const newSrcset = value
          .split(',')
          .map(src => {
            const [srcUrl, size] = src.trim().split(' ');
            try {
              const absolute = new URL(srcUrl, url).href;
              return `${absolute}${size ? ' ' + size : ''}`;
            } catch {
              return src;
            }
          })
          .join(', ');
        el.setAttribute('srcset', newSrcset);
      } else if (
        !value.startsWith('http') &&
        !value.startsWith('data:') &&
        !value.startsWith('#') &&
        !value.startsWith('//')
      ) {
        try {
          el.setAttribute(attr, new URL(value, url).href);
        } catch {
          // leave as-is
        }
      }
    });
  });

  // Strip scripts and style elements, then remove inline styles
  document.querySelectorAll('script, style').forEach(el => el.remove());
  document.querySelectorAll('*').forEach(el => el.removeAttribute('style'));

  const fullHtml = document.documentElement.outerHTML;
  const fallbackContent = extractForumContent(document);
  const content = chooseBestContent(defuddled.content ?? '', fallbackContent);

  return {
    content,
    selectedHtml: '',
    fullHtml,
    title: defuddled.title ?? '',
    author: defuddled.author ?? '',
    description: defuddled.description ?? '',
    domain: getDomain(url),
    favicon: defuddled.favicon ?? '',
    image: defuddled.image ?? '',
    published: defuddled.published ?? '',
    site: defuddled.site ?? '',
    wordCount: defuddled.wordCount ?? 0,
    parseTime: defuddled.parseTime ?? 0,
    schemaOrgData: defuddled.schemaOrgData ?? null,
    metaTags: defuddled.metaTags ?? [],
  };
}

function chooseBestContent(primary: string, fallback: string | null): string {
  if (!fallback) return primary;
  const primaryLen = textLengthFromHtml(primary);
  const fallbackLen = textLengthFromHtml(fallback);
  if (fallbackLen > Math.max(200, primaryLen * 1.2)) {
    return fallback;
  }
  return primary;
}

function textLengthFromHtml(html: string): number {
  if (!html) return 0;
  try {
    const doc = new JSDOM(html).window.document;
    return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim().length;
  } catch {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length;
  }
}

function extractForumContent(document: Document): string | null {
  const postTables = Array.from(document.querySelectorAll('table[id^="pid"]'));
  if (postTables.length === 0) return null;

  const parts: string[] = [];
  for (const table of postTables) {
    const messageEl = table.querySelector('div[id^="postmessage_"]');
    if (!messageEl) continue;

    const authorEl = table.querySelector('td.postauthor cite a');
    const authorName = authorEl?.textContent?.trim() ?? '';
    const authorHref = authorEl?.getAttribute('href') ?? '';

    const floorEl = table.querySelector('td.postcontent .postinfo strong');
    const floor = floorEl?.textContent?.trim() ?? '';

    const infoEl = table.querySelector('td.postcontent .postinfo');
    const infoText = infoEl?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

    const attachments = table.querySelector('.postattachlist');

    const headerBits: string[] = [];
    if (floor) headerBits.push(floor);
    if (authorName) headerBits.push(authorName);
    if (infoText) headerBits.push(infoText);

    const header = headerBits.length ? `<h2>${escapeHtml(headerBits.join(' · '))}</h2>` : '';
    const authorLink =
      authorName && authorHref
        ? `<p><a href="${authorHref}">${escapeHtml(authorName)}</a></p>`
        : '';

    const body = messageEl.innerHTML;
    const attachHtml = attachments ? attachments.outerHTML : '';

    parts.push(
      `<article class="forum-post">${header}${authorLink}${body}${attachHtml}</article>`,
    );
  }

  return parts.length ? parts.join('\n<hr/>\n') : null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
