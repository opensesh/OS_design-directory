import { afterEach, describe, expect, it } from 'vitest';
import { applyCanonical, canonicalUrl } from '../canonical';

const ORIGIN = 'https://opensession.co';

describe('canonicalUrl', () => {
  it('gives the home route the bare base path', () => {
    expect(canonicalUrl('/', ORIGIN, '/directory')).toBe('https://opensession.co/directory');
  });

  it('gives each resource page its own URL', () => {
    expect(canonicalUrl('/resource/12', ORIGIN, '/directory')).toBe(
      'https://opensession.co/directory/resource/12'
    );
    expect(canonicalUrl('/resource/12/', ORIGIN, '/directory')).toBe(
      'https://opensession.co/directory/resource/12'
    );
  });

  it('works at the root base', () => {
    expect(canonicalUrl('/', ORIGIN, '')).toBe('https://opensession.co/');
    expect(canonicalUrl('/resource/3', ORIGIN, '')).toBe('https://opensession.co/resource/3');
  });
});

describe('applyCanonical', () => {
  afterEach(() => {
    document.head.replaceChildren();
  });

  it('adds the canonical link and og:url when the page has none', () => {
    applyCanonical('https://opensession.co/directory/resource/12');

    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://opensession.co/directory/resource/12'
    );
    expect(document.head.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://opensession.co/directory/resource/12'
    );
  });

  it('updates the same tags on navigation instead of adding more', () => {
    applyCanonical('https://opensession.co/directory/resource/12');
    applyCanonical('https://opensession.co/directory');

    const links = document.head.querySelectorAll('link[rel="canonical"]');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('https://opensession.co/directory');
    expect(document.head.querySelectorAll('meta[property="og:url"]')).toHaveLength(1);
  });
});
