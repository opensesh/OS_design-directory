/**
 * Script to capture screenshots of resources that don't have them
 * using shot-scraper CLI tool.
 *
 * Run with: npm run capture-screenshots
 *
 * Prerequisites:
 * - shot-scraper installed: pip3 install --user shot-scraper
 * - Browser installed: shot-scraper install
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

// Paths
const DESIGN_DIR_ROOT = path.join(__dirname, '..');
const SCREENSHOTS_DIR = path.join(DESIGN_DIR_ROOT, 'public', 'assets', 'screenshots');
const RESOURCES_JSON_PATH = path.join(DESIGN_DIR_ROOT, 'src', 'data', 'resources.json');

// shot-scraper path (may need to be adjusted for your system)
const SHOT_SCRAPER_PATH = '/Users/alexbouhdary/Library/Python/3.8/bin/shot-scraper';

// Screenshot settings
const SCREENSHOT_WIDTH = 1280;
const SCREENSHOT_HEIGHT = 800;
const WAIT_TIME = 3000; // Wait 3s for page to load
const DELAY_BETWEEN = 2000; // 2s delay between requests
const QUALITY = 85;

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
 * Sanitize filename from resource name
 */
function sanitizeFilename(name: string, id: number): string {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  return `${id}-${safeName}.jpg`;
}

/**
 * Capture a screenshot of a URL using shot-scraper
 */
async function captureScreenshot(url: string, outputPath: string): Promise<boolean> {
  try {
    const command = `"${SHOT_SCRAPER_PATH}" "${url}" -o "${outputPath}" -w ${SCREENSHOT_WIDTH} -h ${SCREENSHOT_HEIGHT} --wait ${WAIT_TIME} --quality ${QUALITY}`;

    await execAsync(command, { timeout: 60000 });
    return true;
  } catch (error) {
    const err = error as Error & { stderr?: string };
    console.error(`  ✗ Failed: ${err.message || err.stderr || 'Unknown error'}`);
    return false;
  }
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const limit = args.find(a => a.startsWith('--limit='));
  const maxCaptures = limit ? parseInt(limit.split('=')[1], 10) : Infinity;
  const dryRun = args.includes('--dry-run');

  console.log('📸 Capturing screenshots for resources without them\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No screenshots will be captured\n');
  }

  // Check if shot-scraper exists
  if (!dryRun && !fs.existsSync(SHOT_SCRAPER_PATH)) {
    console.error(`❌ shot-scraper not found at: ${SHOT_SCRAPER_PATH}`);
    console.error('\nInstall with: pip3 install --user shot-scraper');
    console.error('Then run: shot-scraper install');
    process.exit(1);
  }

  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log('✓ Created screenshots directory\n');
  }

  // Read resources
  const resourcesData = fs.readFileSync(RESOURCES_JSON_PATH, 'utf-8');
  const resources: Resource[] = JSON.parse(resourcesData);

  // Filter to resources without screenshots
  const needsScreenshot = resources.filter(r => !r.screenshot || r.screenshot.trim() === '');
  const alreadyHas = resources.length - needsScreenshot.length;

  console.log(`📋 Total resources: ${resources.length}`);
  console.log(`✓ Already have screenshots: ${alreadyHas}`);
  console.log(`⏳ Need screenshots: ${needsScreenshot.length}`);

  if (maxCaptures !== Infinity) {
    console.log(`🎯 Limit: ${maxCaptures} captures\n`);
  }

  if (needsScreenshot.length === 0) {
    console.log('\n✅ All resources already have screenshots!');
    process.exit(0);
  }

  const toCapture = needsScreenshot.slice(0, maxCaptures);

  console.log('\n' + '─'.repeat(60));
  console.log(`Capturing ${toCapture.length} screenshots...\n`);

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < toCapture.length; i++) {
    const resource = toCapture[i];
    const progress = `[${i + 1}/${toCapture.length}]`;

    console.log(`${progress} ${resource.name}`);
    console.log(`    URL: ${resource.url}`);

    if (dryRun) {
      console.log(`    → Would save: ${sanitizeFilename(resource.name, resource.id)}`);
      successful++;
      continue;
    }

    // Generate filename
    const filename = sanitizeFilename(resource.name, resource.id);
    const outputPath = path.join(SCREENSHOTS_DIR, filename);
    const relativePath = `/assets/screenshots/${filename}`;

    // Capture screenshot
    const success = await captureScreenshot(resource.url, outputPath);

    if (success && fs.existsSync(outputPath)) {
      // Update resource with screenshot path
      resource.screenshot = relativePath;

      const stats = fs.statSync(outputPath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`    ✓ Saved: ${filename} (${sizeKB} KB)`);
      successful++;
    } else {
      failed++;
    }

    // Delay between requests (except for last one)
    if (!dryRun && i < toCapture.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN));
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`\n✅ Complete! ${successful} successful, ${failed} failed.`);

  // Save updated resources.json if not dry run and we had successes
  if (!dryRun && successful > 0) {
    fs.writeFileSync(
      RESOURCES_JSON_PATH,
      JSON.stringify(resources, null, 2) + '\n',
      'utf-8'
    );
    console.log(`\n💾 Updated resources.json with ${successful} new screenshot paths`);
  }

  if (failed > 0) {
    console.log(`\nTip: Run again to retry failed resources.`);
  }

  // Show disk usage
  const files = fs.readdirSync(SCREENSHOTS_DIR);
  if (files.length > 0) {
    const totalSize = files.reduce((sum, file) => {
      const filePath = path.join(SCREENSHOTS_DIR, file);
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
