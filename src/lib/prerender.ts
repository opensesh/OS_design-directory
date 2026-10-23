import type { NormalizedResource } from '../types/resource';
import { CATEGORY_ORDER } from '../types/resource';
import { canonicalUrl } from './canonical';

/**
 * Build-time HTML for every route (see the prerender plugin in vite.config.ts).
 *
 * The app renders in the browser, so crawlers that don't run scripts (AI crawlers, link
 * previews) used to get an empty <div id="root">. Each route now gets its own HTML file with
 * its title, description, canonical link and readable content inside #root. React replaces
 * that content when it mounts, and index.html hides it as soon as scripts run, so visitors
 * see the app exactly as before.
 *
 * Because every real route has a file, vercel.json no longer needs a catch-all rewrite, and
 * an address without a file gets a real 404 (404.html).
 */

export const SITE_NAME = 'OS Design Directory';

export interface PrerenderOptions {
  /** Where the directory is published, e.g. https://opensession.co */
  origin: string;
  /** The router basename, e.g. /directory */
  basename: string;
}

export interface PrerenderedPage {
  /** Path relative to the build's output folder, e.g. "resource/12.html" */
  file: string;
  html: string;
}

interface HeadFields {
  title: string;
  description: string;
  canonical?: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * The short form of a resource's description, used as its page's meta description and as
 * its line on the directory page. Descriptions run 400–700 characters; search results show
 * about 155.
 */
export function summarize(description: string | null): string {
  if (!description) return '';
  // TODO(Karim): how should a long description be shortened?
  const MAX = 155;
  if (description.length <= MAX) return description;
  return `${description.slice(0, MAX).replace(/\s+\S*$/, '')}…`;
}

/** Sets a meta tag's content, failing the build if index.html no longer has that tag. */
function setMeta(html: string, attr: 'name' | 'property', key: string, content: string): string {
  const pattern = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  if (!pattern.test(html)) {
    throw new Error(`prerender: index.html has no <meta ${attr}="${key}">`);
  }
  return html.replace(pattern, `$1${escapeHtml(content)}$2`);
}

function withHead(template: string, { title, description, canonical }: HeadFields): string {
  if (!/<title>[^<]*<\/title>/.test(template)) {
    throw new Error('prerender: index.html has no <title>');
  }
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  if (canonical) {
    // applyCanonical (src/lib/canonical.ts) finds and updates these once the app runs
    const tags = `<link rel="canonical" href="${escapeHtml(canonical)}" />\n    <meta property="og:url" content="${escapeHtml(canonical)}" />\n  `;
    html = html.replace('</head>', `${tags}</head>`);
  }
  return html;
}

function withRoot(template: string, content: string): string {
  if (!template.includes('<div id="root"></div>')) {
    throw new Error('prerender: index.html has no empty <div id="root">');
  }
  return template.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

function resourcePath(resource: NormalizedResource, basename: string): string {
  return `${basename}/resource/${resource.id}`;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Categories in the app's ring order, then any the order doesn't list. */
function groupByCategory(resources: NormalizedResource[]): [string, NormalizedResource[]][] {
  const groups = new Map<string, NormalizedResource[]>();
  for (const category of CATEGORY_ORDER) groups.set(category, []);
  for (const resource of resources) {
    const category = resource.category ?? 'Other';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(resource);
  }
  return [...groups].filter(([, items]) => items.length > 0);
}

function renderIndex(template: string, resources: NormalizedResource[], opts: PrerenderOptions): string {
  const description = template.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const sections = groupByCategory(resources)
    .map(([category, items]) => {
      const list = items
        .map((resource) => {
          const summary = summarize(resource.description);
          const link = `<a href="${resourcePath(resource, opts.basename)}">${escapeHtml(resource.name)}</a>`;
          return `<li>${link}${summary ? `: ${escapeHtml(summary)}` : ''}</li>`;
        })
        .join('');
      return `<section><h2>${escapeHtml(category)}</h2><ul>${list}</ul></section>`;
    })
    .join('');

  const content = `<main data-prerendered><h1>Design Directory</h1><p>${description}</p>${sections}</main>`;
  return withRoot(
    withHead(template, {
      title: SITE_NAME,
      // already escaped: it comes straight from index.html
      description: unescapeAttribute(description),
      canonical: canonicalUrl('/', opts.origin, opts.basename),
    }),
    content
  );
}

function renderResource(template: string, resource: NormalizedResource, opts: PrerenderOptions): string {
  const facts = [resource.category, resource.subCategory, resource.pricing].filter(Boolean) as string[];
  const parts = [
    `<p><a href="${opts.basename}">Design Directory</a></p>`,
    `<h1>${escapeHtml(resource.name)}</h1>`,
    facts.length ? `<p>${facts.map(escapeHtml).join(' · ')}</p>` : '',
    resource.description ? `<p>${escapeHtml(resource.description)}</p>` : '',
    resource.tags?.length ? `<p>${resource.tags.map(escapeHtml).join(', ')}</p>` : '',
    `<p><a href="${escapeHtml(resource.url)}" rel="noopener noreferrer">${escapeHtml(getDomain(resource.url))}</a></p>`,
  ];

  return withRoot(
    withHead(template, {
      title: `${resource.name} · ${SITE_NAME}`,
      description: summarize(resource.description) || resource.name,
      canonical: canonicalUrl(`/resource/${resource.id}`, opts.origin, opts.basename),
    }),
    `<main data-prerendered>${parts.join('')}</main>`
  );
}

function unescapeAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** One HTML file per route: the directory itself and each resource. */
export function renderPages(
  template: string,
  resources: NormalizedResource[],
  opts: PrerenderOptions
): PrerenderedPage[] {
  return [
    { file: 'index.html', html: renderIndex(template, resources, opts) },
    ...resources.map((resource) => ({
      file: `resource/${resource.id}.html`,
      html: renderResource(template, resource, opts),
    })),
  ];
}

/**
 * The page Vercel serves, with a 404 status, for any address that has no file. It reuses the
 * app's own "Resource Not Found" screen and doesn't load the app's scripts: the router has no
 * route for an unknown address, so mounting it would blank the page.
 */
export function renderNotFound(template: string, opts: PrerenderOptions): string {
  const content = [
    '<div class="min-h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] flex items-center justify-center">',
    '<div class="text-center">',
    '<h1 class="text-2xl font-semibold mb-4">Resource Not Found</h1>',
    '<p class="text-[var(--fg-tertiary)] mb-6">The resource you&#39;re looking for doesn&#39;t exist.</p>',
    `<a href="${opts.basename}" class="inline-flex items-center gap-2 px-4 py-2 bg-[#FE5102] text-white rounded-lg hover:bg-[#FE5102]/90 transition-colors">Back to Universe</a>`,
    '</div>',
    '</div>',
  ].join('');

  const html = withRoot(
    withHead(template, {
      title: `Resource Not Found · ${SITE_NAME}`,
      description: "The resource you're looking for doesn't exist.",
    }),
    content
  );
  // Keep the stylesheet, drop the app's scripts and their preloads
  return html
    .replace(/<script type="module"[^>]*><\/script>\s*/g, '')
    .replace(/<link rel="modulepreload"[^>]*>\s*/g, '');
}
