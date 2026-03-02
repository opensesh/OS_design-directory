/**
 * Favicon analysis script for automated logoBg detection
 *
 * Analyzes Google Favicons for each resource and determines optimal
 * logoBg values based on pixel data:
 * - Dark/black icons → logoBg: "light" (warm neutral background)
 * - Icons with transparent padding + dominant color → logoBg: "#RRGGBB"
 *
 * Run with: bun run analyze-favicons
 * Options:
 *   --dry-run    Print proposed changes without writing
 *   --id=41      Analyze a single resource by ID
 *   --force      Re-analyze resources that already have logoBg
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESOURCES_JSON_PATH = path.join(__dirname, '..', 'src', 'data', 'resources.json');
const FAVICON_SIZE = 64;
const DOWNLOAD_DELAY_MS = 200;

// Pixel classification thresholds
const ALPHA_THRESHOLD = 10;      // Below this = transparent
const DARK_BRIGHTNESS = 40;      // Below this = near-black
const WHITE_BRIGHTNESS = 215;    // Above this = near-white

// Decision thresholds
const DARK_RATIO_THRESHOLD = 0.6;        // >60% dark pixels → "light" bg
const TRANSPARENT_RATIO_THRESHOLD = 0.35; // >35% transparent → extract dominant color

interface Resource {
  id: number;
  name: string;
  url: string;
  logoBg?: string | null;
  [key: string]: unknown;
}

interface AnalysisResult {
  id: number;
  name: string;
  domain: string;
  logoBg: string | null;
  reason: string;
  stats: {
    totalPixels: number;
    transparentRatio: number;
    darkRatio: number;
    whiteRatio: number;
    coloredCount: number;
    dominantColor: string | null;
  };
}

// Parse CLI flags
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const idFlag = args.find(a => a.startsWith('--id='));
const targetId = idFlag ? parseInt(idFlag.split('=')[1], 10) : null;

/**
 * Download a favicon from Google's Favicon API as a Buffer.
 */
async function downloadFavicon(domain: string): Promise<Buffer | null> {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=${FAVICON_SIZE}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/**
 * Extract domain from a URL string.
 */
function getDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Quantize an RGB color to a 4-bit-per-channel bucket key.
 * This creates 16^3 = 4096 possible buckets.
 */
function quantizeKey(r: number, g: number, b: number): string {
  const rq = (r >> 4) & 0xf;
  const gq = (g >> 4) & 0xf;
  const bq = (b >> 4) & 0xf;
  return `${rq},${gq},${bq}`;
}

/**
 * Convert RGB values to a hex color string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Compute pixel brightness (simple average).
 */
function brightness(r: number, g: number, b: number): number {
  return (r + g + b) / 3;
}

/**
 * Analyze raw RGBA pixel data to determine the optimal logoBg value.
 */
function analyzePixels(
  data: Buffer,
  width: number,
  height: number,
): { logoBg: string | null; reason: string; stats: AnalysisResult['stats'] } {
  const totalPixels = width * height;

  let transparentCount = 0;
  let darkCount = 0;
  let whiteCount = 0;

  // Histogram buckets for colored pixels
  const buckets: Map<string, { count: number; rSum: number; gSum: number; bSum: number }> = new Map();
  let coloredCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Transparent
    if (a < ALPHA_THRESHOLD) {
      transparentCount++;
      continue;
    }

    const br = brightness(r, g, b);

    // Near-black
    if (br < DARK_BRIGHTNESS) {
      darkCount++;
      continue;
    }

    // Near-white
    if (br > WHITE_BRIGHTNESS) {
      whiteCount++;
      continue;
    }

    // Colored pixel → add to histogram
    coloredCount++;
    const key = quantizeKey(r, g, b);
    const existing = buckets.get(key);
    if (existing) {
      existing.count++;
      existing.rSum += r;
      existing.gSum += g;
      existing.bSum += b;
    } else {
      buckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b });
    }
  }

  const opaqueCount = totalPixels - transparentCount;
  const transparentRatio = transparentCount / totalPixels;
  const darkRatio = opaqueCount > 0 ? darkCount / opaqueCount : 0;
  const whiteRatio = opaqueCount > 0 ? whiteCount / opaqueCount : 0;

  // Find dominant color bucket
  let dominantColor: string | null = null;
  if (buckets.size > 0) {
    let maxBucket: { count: number; rSum: number; gSum: number; bSum: number } | null = null;
    for (const bucket of buckets.values()) {
      if (!maxBucket || bucket.count > maxBucket.count) {
        maxBucket = bucket;
      }
    }
    if (maxBucket && maxBucket.count > 0) {
      dominantColor = rgbToHex(
        maxBucket.rSum / maxBucket.count,
        maxBucket.gSum / maxBucket.count,
        maxBucket.bSum / maxBucket.count,
      );
    }
  }

  const stats: AnalysisResult['stats'] = {
    totalPixels,
    transparentRatio: Math.round(transparentRatio * 100) / 100,
    darkRatio: Math.round(darkRatio * 100) / 100,
    whiteRatio: Math.round(whiteRatio * 100) / 100,
    coloredCount,
    dominantColor,
  };

  // Decision: too few opaque pixels → skip (favicon is essentially empty)
  if (opaqueCount < totalPixels * 0.05) {
    return { logoBg: null, reason: 'skip: favicon is mostly empty', stats };
  }

  // Decision: predominantly dark icon → needs light background
  if (darkRatio > DARK_RATIO_THRESHOLD) {
    return { logoBg: 'light', reason: `dark icon (${Math.round(darkRatio * 100)}% dark pixels)`, stats };
  }

  // Decision: significant transparent padding with a clear dominant color
  if (transparentRatio > TRANSPARENT_RATIO_THRESHOLD && dominantColor) {
    return {
      logoBg: dominantColor,
      reason: `transparent padding (${Math.round(transparentRatio * 100)}% transparent), dominant: ${dominantColor}`,
      stats,
    };
  }

  return { logoBg: null, reason: 'skip: icon renders fine on default bg', stats };
}

/**
 * Analyze a single resource's favicon.
 */
async function analyzeResource(resource: Resource): Promise<AnalysisResult | null> {
  const domain = getDomain(resource.url);
  if (!domain) {
    console.log(`  ⚠ Skipping ${resource.name} (invalid URL)`);
    return null;
  }

  const buffer = await downloadFavicon(domain);
  if (!buffer || buffer.length === 0) {
    console.log(`  ⚠ Skipping ${resource.name} (download failed)`);
    return null;
  }

  try {
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { logoBg, reason, stats } = analyzePixels(data, info.width, info.height);

    return {
      id: resource.id,
      name: resource.name,
      domain,
      logoBg,
      reason,
      stats,
    };
  } catch (err) {
    console.log(`  ⚠ Skipping ${resource.name} (image parse error: ${err})`);
    return null;
  }
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔍 Favicon Analysis Script');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (targetId !== null) console.log(`   Target: ID ${targetId}`);
  if (force) console.log('   Force: re-analyzing existing overrides');
  console.log();

  // Load resources
  const rawData = fs.readFileSync(RESOURCES_JSON_PATH, 'utf-8');
  const resources: Resource[] = JSON.parse(rawData);
  console.log(`📦 Loaded ${resources.length} resources\n`);

  // Filter resources to analyze
  let toAnalyze = resources.filter(r => {
    if (targetId !== null) return r.id === targetId;
    if (!force && r.logoBg) return false; // Skip resources with existing overrides
    return true;
  });

  if (toAnalyze.length === 0) {
    console.log('No resources to analyze.');
    return;
  }

  console.log(`🔬 Analyzing ${toAnalyze.length} resources...\n`);

  const results: AnalysisResult[] = [];
  const changes: { id: number; name: string; logoBg: string; reason: string }[] = [];

  for (let i = 0; i < toAnalyze.length; i++) {
    const resource = toAnalyze[i];
    console.log(`[${i + 1}/${toAnalyze.length}] ${resource.name} (${getDomain(resource.url)})`);

    const result = await analyzeResource(resource);
    if (result) {
      results.push(result);
      if (result.logoBg) {
        changes.push({
          id: result.id,
          name: result.name,
          logoBg: result.logoBg,
          reason: result.reason,
        });
        console.log(`  ✅ logoBg: "${result.logoBg}" — ${result.reason}`);
      } else {
        console.log(`  ⏭ ${result.reason}`);
      }
    }

    // Rate limiting
    if (i < toAnalyze.length - 1) {
      await sleep(DOWNLOAD_DELAY_MS);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`\n📊 Results Summary`);
  console.log(`   Total analyzed: ${results.length}`);
  console.log(`   Changes proposed: ${changes.length}`);

  if (changes.length > 0) {
    console.log('\n   Proposed changes:');
    for (const change of changes) {
      console.log(`   • [${change.id}] ${change.name} → logoBg: "${change.logoBg}" (${change.reason})`);
    }
  }

  // Apply changes
  if (!dryRun && changes.length > 0) {
    console.log('\n💾 Writing changes to resources.json...');

    // Create a map for quick lookup
    const changeMap = new Map(changes.map(c => [c.id, c.logoBg]));

    const updatedResources = resources.map(r => {
      const newLogoBg = changeMap.get(r.id);
      if (newLogoBg) {
        return { ...r, logoBg: newLogoBg };
      }
      return r;
    });

    fs.writeFileSync(RESOURCES_JSON_PATH, JSON.stringify(updatedResources, null, 2) + '\n');
    console.log(`   ✅ Updated ${changes.length} resources`);
  } else if (dryRun && changes.length > 0) {
    console.log('\n📝 Dry run complete. Run without --dry-run to apply changes.');
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
