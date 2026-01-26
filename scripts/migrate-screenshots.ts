/**
 * Script to migrate screenshots from BOS-2.0 to design-directory
 *
 * Matches resources by sanitized name, copies screenshots with new IDs,
 * and updates resources.json with screenshot paths.
 *
 * Run with: npx tsx scripts/migrate-screenshots.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DESIGN_DIR_ROOT = path.join(__dirname, '..');
const BOS_SCREENSHOTS_DIR = '/Users/alexbouhdary/Documents/GitHub/BOS-2.0/public/assets/screenshots';
const TARGET_SCREENSHOTS_DIR = path.join(DESIGN_DIR_ROOT, 'public', 'assets', 'screenshots');
const RESOURCES_JSON_PATH = path.join(DESIGN_DIR_ROOT, 'src', 'data', 'resources.json');

// Resource interface
interface Resource {
  id: number;
  name: string;
  url: string;
  description: string | null;
  category: string;
  subCategory: string;
  pricing: string;
  featured: boolean;
  opensource: boolean;
  tags: string[];
  count: null;
  tier: number;
  thumbnail: string | null;
  screenshot: string | null;
}

/**
 * Sanitize a name to match the BOS-2.0 screenshot naming convention
 */
function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Extract the sanitized name from a BOS-2.0 screenshot filename
 * Format: {id}-{sanitized-name}.jpg
 */
function extractNameFromFilename(filename: string): string {
  // Remove .jpg extension
  const withoutExt = filename.replace('.jpg', '');
  // Remove the ID prefix (everything before first dash followed by non-digit)
  const match = withoutExt.match(/^\d+-(.+)$/);
  return match ? match[1] : withoutExt;
}

async function main() {
  console.log('📸 Migrating screenshots from BOS-2.0 to design-directory\n');

  // Ensure target directory exists
  if (!fs.existsSync(TARGET_SCREENSHOTS_DIR)) {
    fs.mkdirSync(TARGET_SCREENSHOTS_DIR, { recursive: true });
    console.log('✓ Created screenshots directory\n');
  }

  // Read design-directory resources
  const resourcesData = fs.readFileSync(RESOURCES_JSON_PATH, 'utf-8');
  const resources: Resource[] = JSON.parse(resourcesData);
  console.log(`📋 Found ${resources.length} resources in design-directory\n`);

  // Build a map of sanitized names to resources
  const nameToResource = new Map<string, Resource>();
  for (const resource of resources) {
    const sanitized = sanitizeName(resource.name);
    nameToResource.set(sanitized, resource);
  }

  // Read BOS-2.0 screenshots
  const bosScreenshots = fs.readdirSync(BOS_SCREENSHOTS_DIR).filter(f => f.endsWith('.jpg'));
  console.log(`📁 Found ${bosScreenshots.length} screenshots in BOS-2.0\n`);

  // Build a map of sanitized names to screenshot filenames
  const nameToScreenshot = new Map<string, string>();
  for (const filename of bosScreenshots) {
    const name = extractNameFromFilename(filename);
    nameToScreenshot.set(name, filename);
  }

  // Match and copy screenshots
  let matched = 0;
  let skipped = 0;
  const updates: { resource: Resource; newPath: string }[] = [];

  console.log('─'.repeat(60));
  console.log('Matching resources to screenshots...\n');

  for (const resource of resources) {
    const sanitized = sanitizeName(resource.name);
    const screenshotFilename = nameToScreenshot.get(sanitized);

    if (screenshotFilename) {
      // Generate new filename with design-directory ID
      const newFilename = `${resource.id}-${sanitized}.jpg`;
      const sourcePath = path.join(BOS_SCREENSHOTS_DIR, screenshotFilename);
      const targetPath = path.join(TARGET_SCREENSHOTS_DIR, newFilename);
      const relativePath = `/assets/screenshots/${newFilename}`;

      // Copy file if not already exists
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        const stats = fs.statSync(targetPath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`  ✓ ${resource.name} → ${newFilename} (${sizeKB} KB)`);
      } else {
        console.log(`  ○ ${resource.name} → already exists`);
      }

      updates.push({ resource, newPath: relativePath });
      matched++;
    } else {
      skipped++;
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`\n✅ Matched: ${matched} resources`);
  console.log(`⏭  No match: ${skipped} resources\n`);

  // Update resources.json
  if (updates.length > 0) {
    console.log('Updating resources.json...');

    for (const { resource, newPath } of updates) {
      resource.screenshot = newPath;
    }

    fs.writeFileSync(
      RESOURCES_JSON_PATH,
      JSON.stringify(resources, null, 2) + '\n',
      'utf-8'
    );

    console.log(`✓ Updated ${updates.length} resources with screenshot paths\n`);
  }

  // Show unmatched resources for reference
  if (skipped > 0) {
    console.log('Resources without screenshots:');
    for (const resource of resources) {
      const sanitized = sanitizeName(resource.name);
      if (!nameToScreenshot.has(sanitized)) {
        console.log(`  - ${resource.name} (${sanitized})`);
      }
    }
  }

  // Show disk usage
  const files = fs.readdirSync(TARGET_SCREENSHOTS_DIR);
  if (files.length > 0) {
    const totalSize = files.reduce((sum, file) => {
      const filePath = path.join(TARGET_SCREENSHOTS_DIR, file);
      try {
        return sum + fs.statSync(filePath).size;
      } catch {
        return sum;
      }
    }, 0);
    const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`\n📁 Screenshots folder: ${files.length} files, ${totalMB} MB total`);
  }
}

main().catch(console.error);
