/**
 * Favicon analysis script for automated logoBg detection
 *
 * Uses EDGE PIXEL SAMPLING to determine the optimal logoBg value.
 * The outer 2px border of a favicon represents its background/container
 * color, which is what we want for the card's logoBg fill.
 *
 * Decision logic based on edge color:
 * - Transparent edge + dark icon → logoBg: "light"
 * - White edge → logoBg: "light"
 * - Dark edge → skip (intentionally dark, fine on dark card bg)
 * - Vibrant color edge → use that hex color
 *
 * Run with: bun run analyze-favicons
 * Options:
 *   --dry-run    Print proposed changes without writing
 *   --id=41      Analyze a single resource by ID
 *   --force      Re-analyze resources that already have logoBg
 *   --verbose    Print detailed pixel stats
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
const EDGE_WIDTH = 2; // Sample outer 2px border

// Pixel classification thresholds
const ALPHA_THRESHOLD = 10;
const DARK_BRIGHTNESS = 40;
const WHITE_BRIGHTNESS = 215;

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
  edgeColor: string | null;
  edgeType: 'transparent' | 'white' | 'dark' | 'color';
}

// Parse CLI flags
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const verbose = args.includes('--verbose');
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
 * Quantize an RGB color to a 4-bit-per-channel bucket key.
 */
function quantizeKey(r: number, g: number, b: number): string {
  return `${(r >> 4) & 0xf},${(g >> 4) & 0xf},${(b >> 4) & 0xf}`;
}

/**
 * Check if a pixel is on the outer edge border of the image.
 */
function isEdgePixel(x: number, y: number, width: number, height: number): boolean {
  return x < EDGE_WIDTH || x >= width - EDGE_WIDTH || y < EDGE_WIDTH || y >= height - EDGE_WIDTH;
}

/**
 * Analyze favicon pixel data using edge pixel sampling.
 *
 * Samples the outer 2px border to determine the favicon's background color,
 * then uses that to decide the optimal logoBg value.
 */
function analyzePixels(
  data: Buffer,
  width: number,
  height: number,
): { logoBg: string | null; reason: string; edgeColor: string | null; edgeType: 'transparent' | 'white' | 'dark' | 'color' } {
  // --- Pass 1: Classify edge pixels ---
  let edgeTransparent = 0;
  let edgeDark = 0;
  let edgeWhite = 0;
  let edgeTotal = 0;

  // Histogram for colored edge pixels
  const edgeBuckets: Map<string, { count: number; rSum: number; gSum: number; bSum: number }> = new Map();
  let edgeColored = 0;

  // --- Pass 2: Classify ALL pixels (for transparent-edge dark-icon detection) ---
  let allDark = 0;
  let allOpaque = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      const isTransparent = a < ALPHA_THRESHOLD;
      const br = brightness(r, g, b);
      const isDark = !isTransparent && br < DARK_BRIGHTNESS;
      const isWhite = !isTransparent && br > WHITE_BRIGHTNESS;

      // Track overall stats for dark-icon detection
      if (!isTransparent) {
        allOpaque++;
        if (isDark) allDark++;
      }

      // Edge pixel classification
      if (isEdgePixel(x, y, width, height)) {
        edgeTotal++;

        if (isTransparent) {
          edgeTransparent++;
        } else if (isDark) {
          edgeDark++;
        } else if (isWhite) {
          edgeWhite++;
        } else {
          edgeColored++;
          const key = quantizeKey(r, g, b);
          const existing = edgeBuckets.get(key);
          if (existing) {
            existing.count++;
            existing.rSum += r;
            existing.gSum += g;
            existing.bSum += b;
          } else {
            edgeBuckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b });
          }
        }
      }
    }
  }

  // --- Compute edge ratios ---
  const edgeTransparentRatio = edgeTotal > 0 ? edgeTransparent / edgeTotal : 0;
  const edgeDarkRatio = edgeTotal > 0 ? edgeDark / edgeTotal : 0;
  const edgeWhiteRatio = edgeTotal > 0 ? edgeWhite / edgeTotal : 0;
  const edgeColoredRatio = edgeTotal > 0 ? edgeColored / edgeTotal : 0;

  // Find dominant edge color
  let dominantEdgeColor: string | null = null;
  if (edgeBuckets.size > 0) {
    let maxBucket: { count: number; rSum: number; gSum: number; bSum: number } | null = null;
    for (const bucket of edgeBuckets.values()) {
      if (!maxBucket || bucket.count > maxBucket.count) {
        maxBucket = bucket;
      }
    }
    if (maxBucket && maxBucket.count > 0) {
      dominantEdgeColor = rgbToHex(
        maxBucket.rSum / maxBucket.count,
        maxBucket.gSum / maxBucket.count,
        maxBucket.bSum / maxBucket.count,
      );
    }
  }

  if (verbose) {
    const pct = (n: number) => `${Math.round(n * 100)}%`;
    console.log(`     edge: transparent=${pct(edgeTransparentRatio)} dark=${pct(edgeDarkRatio)} white=${pct(edgeWhiteRatio)} colored=${pct(edgeColoredRatio)} dominantEdge=${dominantEdgeColor}`);
    console.log(`     all:  opaque=${allOpaque} dark=${allDark} darkRatio=${allOpaque > 0 ? Math.round(allDark / allOpaque * 100) : 0}%`);
  }

  // --- Decision logic based on edge type ---

  // 1. Edge is mostly transparent → favicon has no container/background
  if (edgeTransparentRatio > 0.5) {
    const darkRatio = allOpaque > 0 ? allDark / allOpaque : 0;
    if (darkRatio > 0.6) {
      // Dark icon on transparent background (e.g. Three.js)
      return { logoBg: 'light', reason: `transparent edge, dark icon (${Math.round(darkRatio * 100)}% dark)`, edgeColor: null, edgeType: 'transparent' };
    }
    // Colored icon on transparent — shows fine on dark card bg
    return { logoBg: null, reason: 'skip: transparent edge, colored icon fine on dark bg', edgeColor: null, edgeType: 'transparent' };
  }

  // 2. Edge is mostly white → Google's default white background
  if (edgeWhiteRatio > 0.5) {
    return { logoBg: 'light', reason: `white edge (${Math.round(edgeWhiteRatio * 100)}% white)`, edgeColor: '#FFFFFF', edgeType: 'white' };
  }

  // 3. Edge is mostly dark → intentionally dark container, fine on dark card bg
  if (edgeDarkRatio > 0.5) {
    return { logoBg: null, reason: 'skip: dark edge, intentionally dark container', edgeColor: null, edgeType: 'dark' };
  }

  // 4. Edge is a solid vibrant color → use it as logoBg
  if (edgeColoredRatio > 0.3 && dominantEdgeColor) {
    return { logoBg: dominantEdgeColor, reason: `colored edge: ${dominantEdgeColor}`, edgeColor: dominantEdgeColor, edgeType: 'color' };
  }

  // 5. Mixed edge — could be dark+colored or other combos
  // If dark+colored makes up most of the edge, and there's a dominant color, use it
  if ((edgeDarkRatio + edgeColoredRatio) > 0.5 && dominantEdgeColor) {
    return { logoBg: dominantEdgeColor, reason: `mixed edge, dominant: ${dominantEdgeColor}`, edgeColor: dominantEdgeColor, edgeType: 'color' };
  }

  return { logoBg: null, reason: 'skip: ambiguous edge, leaving default', edgeColor: null, edgeType: 'transparent' };
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

    const { logoBg, reason, edgeColor, edgeType } = analyzePixels(data, info.width, info.height);

    return {
      id: resource.id,
      name: resource.name,
      domain,
      logoBg,
      reason,
      edgeColor,
      edgeType,
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
  console.log('🔍 Favicon Analysis Script (Edge Sampling)');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (targetId !== null) console.log(`   Target: ID ${targetId}`);
  if (force) console.log('   Force: re-analyzing existing overrides');
  console.log();

  // Load resources
  const rawData = fs.readFileSync(RESOURCES_JSON_PATH, 'utf-8');
  const resources: Resource[] = JSON.parse(rawData);
  console.log(`📦 Loaded ${resources.length} resources\n`);

  // Filter resources to analyze
  const toAnalyze = resources.filter(r => {
    if (targetId !== null) return r.id === targetId;
    if (!force && r.logoBg) return false;
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
