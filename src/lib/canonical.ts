import { ROUTER_BASENAME } from './base-path';

/**
 * Where the directory is published: opensession.co/directory proxies to this deployment,
 * so every route names its opensession.co URL as canonical.
 * FORK NOTE: set this to your own domain.
 */
export const SITE_ORIGIN = 'https://opensession.co';

/**
 * The canonical URL for a router pathname (relative to the basename). The query is left
 * out: ?display=table and the filters are views of the same page.
 */
export function canonicalUrl(
  pathname: string,
  origin: string = SITE_ORIGIN,
  basename: string = ROUTER_BASENAME
): string {
  const path = `${basename}${pathname}`.replace(/\/+$/, '');
  return `${origin}${path || '/'}`;
}

/**
 * Points the canonical link and og:url at `url`, adding them if missing. The app sets these
 * per route, and index.html carries neither, because Google reads the canonical after
 * rendering and a static one would claim every deep link is a copy of the home page.
 */
export function applyCanonical(url: string, doc: Document = document): void {
  let link = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = doc.createElement('link');
    link.rel = 'canonical';
    doc.head.appendChild(link);
  }
  link.href = url;

  let ogUrl = doc.head.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = doc.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    doc.head.appendChild(ogUrl);
  }
  ogUrl.content = url;
}
