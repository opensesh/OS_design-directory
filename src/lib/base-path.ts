/**
 * The app is served under a base path (Vite's `base`, '/directory/' in production) because
 * opensession.co/directory proxies to this deployment. Vite rewrites the URLs it bundles,
 * but not plain strings, so public-folder paths written in code go through `withBase`.
 */
// import.meta.env only exists in code Vite builds; vite.config.ts also loads this file (through
// canonical.ts, for the prerender plugin), where it falls back to the root
const BASE_URL: string = import.meta.env?.BASE_URL ?? '/';

/** The base without its trailing slash, so the router matches /directory as well as /directory/. */
export const ROUTER_BASENAME = BASE_URL.replace(/\/$/, '');

/** Prefixes a root-relative path ('/fonts/x.woff2') with the base path. Full URLs pass through. */
export function withBase(path: string, base: string = BASE_URL): string {
  if (!path.startsWith('/') || path.startsWith('//')) {
    return path;
  }
  return `${base.replace(/\/?$/, '/')}${path.slice(1)}`;
}
