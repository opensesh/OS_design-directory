import { describe, expect, it } from 'vitest';
import { withBase } from '../base-path';

describe('withBase', () => {
  it('prefixes root-relative paths with the base', () => {
    expect(withBase('/fonts/OffBit-Bold.woff2', '/directory/')).toBe('/directory/fonts/OffBit-Bold.woff2');
    expect(withBase('/api/search/parse-query', '/directory/')).toBe('/directory/api/search/parse-query');
  });

  it('accepts a base without its trailing slash', () => {
    expect(withBase('/logos/figma.svg', '/directory')).toBe('/directory/logos/figma.svg');
  });

  it('leaves paths alone at the root base', () => {
    expect(withBase('/textures/galaxy/skybox.jpg', '/')).toBe('/textures/galaxy/skybox.jpg');
  });

  it('passes full and protocol-relative URLs through', () => {
    expect(withBase('https://www.google.com/s2/favicons?domain=figma.com', '/directory/')).toBe(
      'https://www.google.com/s2/favicons?domain=figma.com'
    );
    expect(withBase('//cdn.example.com/a.png', '/directory/')).toBe('//cdn.example.com/a.png');
  });
});
