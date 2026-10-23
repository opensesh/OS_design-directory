import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import resourcesData from '../../data/resources.json';
import type { NormalizedResource } from '../../types/resource';
import { renderNotFound, renderPages, summarize } from '../prerender';

const resources = resourcesData as NormalizedResource[];
const opts = { origin: 'https://opensession.co', basename: '/directory' };

// The built index.html has the same head and root as the source, plus the bundle's tags
const template = fs
  .readFileSync(path.resolve(__dirname, '../../../index.html'), 'utf8')
  .replace(
    '<script type="module" src="/src/main.tsx"></script>',
    '<script type="module" crossorigin src="/directory/assets/index-abc.js"></script>'
  )
  .replace('</head>', '<link rel="modulepreload" crossorigin href="/directory/assets/vendor-react-abc.js">\n</head>');

const pages = renderPages(template, resources, opts);
const page = (file: string) => pages.find((p) => p.file === file)!.html;

describe('renderPages', () => {
  it('writes the directory and one file per resource', () => {
    expect(pages).toHaveLength(resources.length + 1);
    expect(pages[0].file).toBe('index.html');
    expect(new Set(pages.map((p) => p.file)).size).toBe(pages.length);
  });

  it('links every resource from the directory page', () => {
    const index = page('index.html');
    for (const resource of resources) {
      expect(index).toContain(`<a href="/directory/resource/${resource.id}">`);
    }
    expect(index).toContain('<h1>Design Directory</h1>');
    expect(index).toContain('<link rel="canonical" href="https://opensession.co/directory" />');
  });

  it('gives each resource its own title, description and canonical', () => {
    const resource = resources[0];
    const html = page(`resource/${resource.id}.html`);
    expect(html).toContain(`<title>${resource.name} · OS Design Directory</title>`);
    expect(html).toContain(`<h1>${resource.name}</h1>`);
    expect(html).toContain(
      `<link rel="canonical" href="https://opensession.co/directory/resource/${resource.id}" />`
    );
    expect(html).toContain(`<meta property="og:url" content="https://opensession.co/directory/resource/${resource.id}" />`);
    expect(html.match(/<link rel="canonical"/g)).toHaveLength(1);
  });

  it('keeps the app: the bundle still loads and the content sits inside #root', () => {
    const html = page('resource/1.html');
    expect(html).toContain('<script type="module" crossorigin src="/directory/assets/index-abc.js">');
    expect(html).toMatch(/<div id="root"><main data-prerendered>.*<\/main><\/div>/s);
  });

  it('escapes resource text', () => {
    const tricky = { ...resources[0], id: 999, name: 'A <b> & "C"', description: '<img onerror=x>' };
    const out = renderPages(template, [tricky], opts)[1].html;
    expect(out).toContain('<h1>A &lt;b&gt; &amp; &quot;C&quot;</h1>');
    expect(out).not.toContain('<img onerror');
  });

  it('fails loudly if index.html loses a tag it fills', () => {
    expect(() => renderPages(template.replace('<div id="root"></div>', '<div id="app"></div>'), resources, opts)).toThrow(
      /#?root/
    );
    expect(() =>
      renderPages(template.replace(/<meta name="description"[^>]*>/, ''), resources, opts)
    ).toThrow(/description/);
  });
});

describe('renderNotFound', () => {
  const html = renderNotFound(template, opts);

  it("shows the app's not-found screen without loading the app", () => {
    expect(html).toContain('Resource Not Found');
    expect(html).toContain('<a href="/directory"');
    expect(html).not.toContain('<script type="module"');
    expect(html).not.toContain('modulepreload');
    expect(html).not.toContain('rel="canonical"');
  });
});

describe('summarize', () => {
  it('keeps short descriptions whole and handles none', () => {
    expect(summarize('A short line.')).toBe('A short line.');
    expect(summarize(null)).toBe('');
  });

  it('fits every resource into a search-result snippet', () => {
    for (const resource of resources) {
      expect(summarize(resource.description).length).toBeLessThanOrEqual(160);
    }
  });
});
