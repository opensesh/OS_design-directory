/**
 * Script to add new resources to resources.json
 * Filters out duplicates based on domain matching
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESOURCES_JSON_PATH = path.join(__dirname, '..', 'src', 'data', 'resources.json');

interface Resource {
  id: number;
  name: string;
  url: string;
  description: string;
  category: string;
  subCategory: string;
  pricing: string;
  featured: boolean;
  opensource: boolean;
  tags: string[];
  count: null;
  tier: number;
  thumbnail: null;
  screenshot: null;
  gravityScore?: number;
  gravityRationale?: string;
}

// New resources to add
const newResources: Omit<Resource, 'id'>[] = [
  {
    name: "mymind",
    url: "https://mymind.com/",
    description: "mymind is a minimalist, private knowledge tool for saving links, images, quotes, notes, and screenshots into a visually rich personal library that behaves like an external memory rather than a traditional notes app, using AI to auto-tag everything so you do not manage folders or taxonomies manually.\n\nYou could treat it as a long-term archive of references across brand work and general research—saving stand-out systems, AI-design articles, and interface screenshots—then use natural-language searches like \"warm brutalist onboarding flow\" when you need to pull them back into decks or design directions.",
    category: "Tools",
    subCategory: "Productivity",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["ai", "knowledge-management", "bookmarking", "research"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null,
    gravityScore: 7.8,
    gravityRationale: "AI-powered visual memory for creative research"
  },
  {
    name: "Kosmik",
    url: "https://www.kosmik.app/",
    description: "Kosmik is an infinite canvas workspace that merges a browser, file system, and moodboard into a spatial environment for creative research, pulling AI-suggested assets directly from the web, auto-tagging content, and supporting real-time collaboration and publishing.\n\nYou could use it as a live \"war room\" for brand projects—browsing within Kosmik, dragging in product pages and video frames, clustering them by themes like \"agents\" or \"design automation,\" and later querying those boards to rapidly assemble narrative-ready moodboards for decks and case studies.",
    category: "Tools",
    subCategory: "Productivity",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["infinite-canvas", "collaboration", "research", "moodboard"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null,
    gravityScore: 7.5,
    gravityRationale: "Infinite canvas merging browser and workspace"
  },
  {
    name: "Designspiration",
    url: "https://www.designspiration.com/",
    description: "Designspiration is a visual discovery platform with a deep archive of images across graphic design, typography, photography, and branding, supporting search by keyword and color so you can quickly hone in on specific aesthetics such as muted monochrome or bold type-heavy layouts.\n\nYou might lean on it when sketching visual territory for a new brand or feature launch, pulling references for diagram language, icon styles, and hero treatments, then translating those into token scales, motion directions, or layout templates inside your design system.",
    category: "Inspiration",
    subCategory: "Galleries",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["inspiration", "visual-search", "color", "typography"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null,
    gravityScore: 7.2,
    gravityRationale: "Deep visual archive with color search"
  },
  {
    name: "Khroma",
    url: "https://www.khroma.co/",
    description: "Khroma is an AI-driven color tool that learns from palettes you like and generates endless combinations tailored to your taste, showing colors in context with UI-like layouts and typographic samples, and providing values you can drop straight into design tools and code.\n\nIn practice, you could use it as a color R&D lab for brands and sub-brands—defining a seed palette, exploring variations for states and surfaces, capturing a few candidates, and then mapping chosen swatches into semantic roles like background, accent, and warning in your token system.",
    category: "AI",
    subCategory: "Design",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["ai", "color", "palette", "design-tools"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null,
    gravityScore: 7.6,
    gravityRationale: "AI color generator trained on your taste"
  },
  {
    name: "CPGD",
    url: "https://www.cpgd.xyz/",
    description: "CPGD is a directory of contemporary consumer packaged goods brands that showcases identity, packaging, and digital presence, giving a concentrated snapshot of how modern CPG brands present themselves across product shots, logos, and web experiences.\n\nYou could use it when designing for physical or hybrid products and want to quickly assess visual and narrative patterns in categories like beverages or supplements, then extract those learnings into reusable guidelines and components for your own brand system.",
    category: "Inspiration",
    subCategory: "Showcases",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["branding", "packaging", "cpg", "identity"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null,
    gravityScore: 6.8,
    gravityRationale: "Curated CPG brand identity directory"
  },
  {
    name: "Fuse",
    url: "https://www.fuse.kiwi/",
    description: "Fuse.kiwi is a curated feed of \"interesting internet,\" collecting links to unusual, experimental, or otherwise notable sites and projects that often showcase novel interactions, aesthetics, and niche digital experiments.\n\nYou might use it as a low-friction inspiration stream when your interaction vocabulary feels too \"SaaS default,\" browsing entries, bookmarking standouts, and capturing a few to seed new interaction patterns and animation ideas for interfaces or marketing surfaces.",
    category: "Inspiration",
    subCategory: "Showcases",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["inspiration", "experimental", "web-design", "curation"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null,
    gravityScore: 6.5,
    gravityRationale: "Curated feed of experimental internet"
  },
  {
    name: "Ply",
    url: "https://www.ply.supply/",
    description: "Ply is a mockup resource focused on high-quality, realistic device, print, and product scenes crafted for modern digital brands, with polished lighting and composition that feels launch-ready rather than generic stock.\n\nIn your workflow, Ply can serve the storytelling layer: once you have UI or identity directions, you drop them into Ply scenes and export them for decks, sales collateral, and case studies—staging interfaces across multiple devices for portfolio or launch visuals.",
    category: "Templates",
    subCategory: "Mockups",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["mockups", "devices", "presentation", "branding"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null,
    gravityScore: 7.0,
    gravityRationale: "Premium device mockups for modern brands"
  },
  {
    name: "Bendito Mockup",
    url: "https://benditomockup.com/category/all-mockups/devices/",
    description: "This section of Bendito Mockup offers device-focused mockups—phones, laptops, tablets—with stylized, often editorial visual treatments, bold lighting, and compositions that give presentations a more expressive, art-directed feel.\n\nYou could use Bendito when presenting interfaces in a more emotionally charged environment than flat frames, placing dashboards or flows into scenes that match the brand tone and using those shots for dribbble-style posts, launch pages, or reels alongside more neutral renders.",
    category: "Templates",
    subCategory: "Mockups",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["mockups", "devices", "editorial", "presentation"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null,
    gravityScore: 6.8,
    gravityRationale: "Stylized editorial device mockups"
  },
  {
    name: "Everything Universe",
    url: "https://everythinguniver.se/",
    description: "Everything Universe focuses on 3D animation and automated rigging, providing tools and services to turn static designs and characters into fully rigged, animated assets, and showcasing work that lives at the intersection of technical pipelines and expressive motion design.\n\nYou might draw on it when exploring how your visual language or mascots could live in 3D and motion—informing how you design characters and system motifs that can later be rigged for onboarding animations, hero videos, or social content without hand-animating everything from scratch.",
    category: "Tools",
    subCategory: "3D",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["3d", "animation", "rigging", "motion-design"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null,
    gravityScore: 7.2,
    gravityRationale: "3D animation and automated rigging tools"
  }
];

async function main() {
  console.log('📦 Adding new resources to resources.json\n');

  // Read existing resources
  const resourcesData = fs.readFileSync(RESOURCES_JSON_PATH, 'utf-8');
  const resources: Resource[] = JSON.parse(resourcesData);

  console.log(`📋 Existing resources: ${resources.length}`);

  // Get existing domains for duplicate detection
  const existingDomains = new Set(
    resources.map(r => {
      try {
        return new URL(r.url).hostname.replace('www.', '').toLowerCase();
      } catch {
        return r.url.toLowerCase();
      }
    })
  );

  // Filter out duplicates
  const toAdd: Omit<Resource, 'id'>[] = [];
  const skipped: string[] = [];

  for (const resource of newResources) {
    try {
      const domain = new URL(resource.url).hostname.replace('www.', '').toLowerCase();

      // Check for domain match (excluding subdomains for some services)
      const baseDomain = domain.split('.').slice(-2).join('.');

      if (existingDomains.has(domain) || existingDomains.has(baseDomain)) {
        skipped.push(`${resource.name} (${domain})`);
      } else {
        toAdd.push(resource);
        existingDomains.add(domain);
      }
    } catch {
      toAdd.push(resource);
    }
  }

  console.log(`\n⏭️  Skipped (duplicates): ${skipped.length}`);
  skipped.forEach(s => console.log(`   - ${s}`));

  console.log(`\n✅ Adding: ${toAdd.length} new resources`);

  // Get the next ID
  let nextId = Math.max(...resources.map(r => r.id)) + 1;

  // Add new resources with IDs
  for (const resource of toAdd) {
    resources.push({
      ...resource,
      id: nextId++
    } as Resource);
    console.log(`   + [${nextId - 1}] ${resource.name}`);
  }

  // Save updated resources
  fs.writeFileSync(
    RESOURCES_JSON_PATH,
    JSON.stringify(resources, null, 2) + '\n',
    'utf-8'
  );

  console.log(`\n💾 Saved! Total resources: ${resources.length}`);
  console.log(`\n📸 Run 'npm run capture-screenshots' to capture screenshots for new resources`);
}

main().catch(console.error);
