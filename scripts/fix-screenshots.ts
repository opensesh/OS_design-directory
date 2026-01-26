/**
 * Script to audit and fix screenshots for the Design Directory
 *
 * This script:
 * 1. Loads all screenshots from /public/assets/screenshots/
 * 2. Analyzes each with Claude Vision API
 * 3. For bad images (CAPTCHA, error, login, blank): searches Google Images via SerpAPI
 * 4. Downloads, verifies, and replaces automatically
 * 5. Backs up originals to /public/assets/screenshots/backup/
 *
 * Run with: npm run fix-screenshots
 *
 * Prerequisites:
 * - ANTHROPIC_API_KEY in .env
 * - SERPAPI_API_KEY in .env
 */

import { config } from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { getJson } from 'serpapi';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

// Validate environment variables
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const serpapiKey = process.env.SERPAPI_API_KEY;

if (!anthropicKey) {
  console.error('❌ Missing ANTHROPIC_API_KEY environment variable');
  console.error('Add it to your .env file');
  process.exit(1);
}
if (!serpapiKey) {
  console.error('❌ Missing SERPAPI_API_KEY environment variable');
  console.error('Add it to your .env file');
  process.exit(1);
}

// Create clients
const anthropic = new Anthropic({ apiKey: anthropicKey });

// Paths
const DESIGN_DIR_ROOT = path.join(__dirname, '..');
const SCREENSHOTS_DIR = path.join(DESIGN_DIR_ROOT, 'public', 'assets', 'screenshots');
const BACKUP_DIR = path.join(SCREENSHOTS_DIR, 'backup');
const RESOURCES_JSON_PATH = path.join(DESIGN_DIR_ROOT, 'src', 'data', 'resources.json');
const REPORT_PATH = path.join(__dirname, 'image-audit-report.json');

// Screenshot settings
const SCREENSHOT_WIDTH = 1280;
const SCREENSHOT_HEIGHT = 800;

// Rate limiting
const DELAY_BETWEEN_ANALYSIS = 500; // 500ms between Claude API calls
const DELAY_BETWEEN_SEARCH = 1000; // 1s between SerpAPI calls

// Resource interface (matching resources.json)
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
  gravityScore?: number;
  gravityRationale?: string;
}

interface AnalysisResult {
  id: number;
  name: string;
  file: string;
  classification: 'good' | 'bad' | 'partial';
  confidence: number;
  reason: string;
  category?: 'captcha' | 'error' | 'login' | 'blank' | 'partial' | 'good';
  replaced?: boolean;
}

interface AuditReport {
  timestamp: string;
  results: AnalysisResult[];
  summary: {
    total: number;
    analyzed: number;
    good: number;
    partial: number;
    bad: number;
    replaced: number;
    failed: number;
  };
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sanitize filename from resource name (matching capture-screenshots.ts)
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
 * Ensure directories exist
 */
function ensureDirectories(): void {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log('Created screenshots directory');
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('Created backup directory');
  }
}

/**
 * Read image file and convert to base64
 */
function imageToBase64(filePath: string): string {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString('base64');
}

/**
 * Analyze a screenshot using Claude Vision API
 */
async function analyzeScreenshot(
  filePath: string,
  resourceName: string
): Promise<{ classification: 'good' | 'bad' | 'partial'; confidence: number; reason: string; category: string }> {
  const base64Image = imageToBase64(filePath);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: `Analyze this screenshot of "${resourceName}". Determine if it shows:
1. The actual product interface/website (GOOD)
2. A CAPTCHA, verification, or "prove you're human" page (BAD - captcha)
3. An error page (404, 500, access denied, etc.) (BAD - error)
4. A login/authentication page blocking content (BAD - login)
5. A blank, broken, or loading page (BAD - blank)
6. Partially visible content with some obstruction (PARTIAL)

Respond with ONLY valid JSON, no markdown:
{"status": "good" | "bad" | "partial", "category": "good" | "captcha" | "error" | "login" | "blank" | "partial", "confidence": 0.0-1.0, "reason": "brief explanation"}`,
          },
        ],
      },
    ],
  });

  // Parse the response
  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  try {
    // Clean up the response - remove any markdown code blocks if present
    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    const result = JSON.parse(jsonText);
    return {
      classification: result.status,
      confidence: result.confidence,
      reason: result.reason,
      category: result.category,
    };
  } catch (e) {
    console.error('Failed to parse Claude response:', textContent.text);
    throw new Error('Failed to parse Claude response');
  }
}

/**
 * Search for replacement image using SerpAPI
 */
async function searchForReplacementImage(resourceName: string): Promise<string[]> {
  return new Promise((resolve) => {
    getJson(
      {
        api_key: serpapiKey,
        engine: 'google_images',
        q: `"${resourceName}" app screenshot interface`,
        ijn: '0', // First page
        imgsz: 'l', // Large images
      },
      (json: { images_results?: Array<{ original: string }> }) => {
        if (json.images_results && json.images_results.length > 0) {
          // Return top 5 image URLs
          const urls = json.images_results.slice(0, 5).map((img) => img.original);
          resolve(urls);
        } else {
          resolve([]);
        }
      }
    );
  });
}

/**
 * Download an image from URL
 */
async function downloadImage(url: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(
      url,
      {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      },
      (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            downloadImage(redirectUrl, outputPath).then(resolve);
            return;
          }
        }

        if (response.statusCode !== 200) {
          resolve(false);
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            fs.writeFileSync(outputPath, buffer);
            resolve(true);
          } catch {
            resolve(false);
          }
        });
        response.on('error', () => resolve(false));
      }
    );

    request.on('error', () => resolve(false));
    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
  });
}

/**
 * Verify a replacement image shows the actual product
 */
async function verifyReplacementImage(filePath: string, resourceName: string): Promise<boolean> {
  try {
    const base64Image = imageToBase64(filePath);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Does this image show the actual "${resourceName}" product interface/app?
It should NOT be: a logo, icon, marketing graphic, stock photo, or unrelated image.
It SHOULD be: a screenshot or photo of the actual product UI/interface.

Respond with ONLY valid JSON: {"valid": true | false, "reason": "brief explanation"}`,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return false;
    }

    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    const result = JSON.parse(jsonText);
    return result.valid === true;
  } catch {
    return false;
  }
}

/**
 * Resize image to standard dimensions
 */
async function resizeImage(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    await sharp(inputPath).resize(SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT, { fit: 'cover' }).jpeg({ quality: 85 }).toFile(outputPath);
    return true;
  } catch (e) {
    console.error('Failed to resize image:', e);
    return false;
  }
}

/**
 * Backup original image
 */
function backupImage(filename: string): void {
  const sourcePath = path.join(SCREENSHOTS_DIR, filename);
  const backupPath = path.join(BACKUP_DIR, filename);

  if (fs.existsSync(sourcePath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(sourcePath, backupPath);
  }
}

/**
 * Process a single resource: analyze and replace if needed
 */
async function processResource(resource: Resource): Promise<AnalysisResult> {
  const filename = sanitizeFilename(resource.name, resource.id);
  const filePath = path.join(SCREENSHOTS_DIR, filename);

  // Check if screenshot exists
  if (!fs.existsSync(filePath)) {
    return {
      id: resource.id,
      name: resource.name,
      file: filename,
      classification: 'bad',
      confidence: 1.0,
      reason: 'Screenshot file does not exist',
      category: 'blank',
      replaced: false,
    };
  }

  // Analyze the screenshot
  console.log(`  Analyzing: ${resource.name}`);
  const analysis = await analyzeScreenshot(filePath, resource.name);

  const result: AnalysisResult = {
    id: resource.id,
    name: resource.name,
    file: filename,
    classification: analysis.classification,
    confidence: analysis.confidence,
    reason: analysis.reason,
    category: analysis.category as 'captcha' | 'error' | 'login' | 'blank' | 'partial' | 'good',
    replaced: false,
  };

  // If good, no need to replace
  if (analysis.classification === 'good') {
    return result;
  }

  // Try to find a replacement
  console.log(`  Searching for replacement (${analysis.category}): ${resource.name}`);
  await sleep(DELAY_BETWEEN_SEARCH);

  const imageUrls = await searchForReplacementImage(resource.name);

  if (imageUrls.length === 0) {
    console.log(`  No replacement images found for: ${resource.name}`);
    return result;
  }

  // Try each candidate image
  const tempPath = path.join(SCREENSHOTS_DIR, `temp-${resource.id}.jpg`);
  const resizedPath = path.join(SCREENSHOTS_DIR, `resized-${resource.id}.jpg`);

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    console.log(`  Trying candidate ${i + 1}/${imageUrls.length}...`);

    // Download the image
    const downloaded = await downloadImage(url, tempPath);
    if (!downloaded) {
      console.log(`    Download failed`);
      continue;
    }

    // Resize to standard dimensions
    const resized = await resizeImage(tempPath, resizedPath);
    if (!resized) {
      console.log(`    Resize failed`);
      continue;
    }

    // Verify it shows the actual product
    await sleep(DELAY_BETWEEN_ANALYSIS);
    const valid = await verifyReplacementImage(resizedPath, resource.name);

    if (!valid) {
      console.log(`    Verification failed`);
      continue;
    }

    // Success! Backup original and replace
    backupImage(filename);
    fs.renameSync(resizedPath, filePath);

    // Cleanup temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    console.log(`  ✓ Successfully replaced: ${resource.name}`);

    return { ...result, reason: `Replaced: ${analysis.reason}`, replaced: true };
  }

  // Cleanup temp files
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  if (fs.existsSync(resizedPath)) fs.unlinkSync(resizedPath);

  console.log(`  Could not find valid replacement for: ${resource.name}`);
  return result;
}

/**
 * Main function
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const limit = args.find((a) => a.startsWith('--limit='));
  const maxProcess = limit ? parseInt(limit.split('=')[1], 10) : Infinity;
  const analyzeOnly = args.includes('--analyze-only');

  console.log('═'.repeat(60));
  console.log('  Screenshot Quality Audit & Fix');
  console.log('═'.repeat(60));
  console.log('');

  if (analyzeOnly) {
    console.log('📊 ANALYZE ONLY MODE - No replacements will be made\n');
  }

  // Ensure directories exist
  ensureDirectories();

  // Read resources
  console.log('📂 Loading resources from resources.json...');
  const resourcesData = fs.readFileSync(RESOURCES_JSON_PATH, 'utf-8');
  const resources: Resource[] = JSON.parse(resourcesData);

  // Filter to resources with screenshots
  const withScreenshots = resources.filter((r) => r.screenshot && r.screenshot.trim() !== '');

  console.log(`   Total resources: ${resources.length}`);
  console.log(`   With screenshots: ${withScreenshots.length}`);

  if (maxProcess !== Infinity) {
    console.log(`   Limit: ${maxProcess} resources\n`);
  }

  console.log('─'.repeat(60));

  // Process each resource
  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    results: [],
    summary: {
      total: resources.length,
      analyzed: 0,
      good: 0,
      partial: 0,
      bad: 0,
      replaced: 0,
      failed: 0,
    },
  };

  const toProcess = withScreenshots.slice(0, maxProcess);

  for (let i = 0; i < toProcess.length; i++) {
    const resource = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;

    console.log(`\n${progress} ${resource.name}`);

    try {
      const result = await processResource(resource);
      report.results.push(result);
      report.summary.analyzed++;

      // Update summary
      if (result.classification === 'good') {
        report.summary.good++;
      } else if (result.classification === 'partial') {
        report.summary.partial++;
      } else {
        report.summary.bad++;
      }

      if (result.replaced) {
        report.summary.replaced++;
      }

      // Rate limiting
      await sleep(DELAY_BETWEEN_ANALYSIS);
    } catch (error) {
      console.error(`  ✗ Error processing ${resource.name}:`, error);
      report.summary.failed++;
    }
  }

  // Save report
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('  Summary');
  console.log('═'.repeat(60));
  console.log(`
Total Resources: ${report.summary.total}
Analyzed: ${report.summary.analyzed}
Good Screenshots: ${report.summary.good}
Partial Screenshots: ${report.summary.partial}
Bad Screenshots: ${report.summary.bad}
Successfully Replaced: ${report.summary.replaced}
Failed to Process: ${report.summary.failed}

Report saved to: ${REPORT_PATH}
Backups saved to: ${BACKUP_DIR}
`);

  // List bad screenshots that weren't replaced
  const unreplacedBad = report.results.filter((r) => r.classification !== 'good' && !r.replaced);

  if (unreplacedBad.length > 0) {
    console.log('Screenshots needing manual attention:');
    unreplacedBad.forEach((r) => {
      console.log(`  - [${r.id}] ${r.name} (${r.category}): ${r.reason}`);
    });
  }

  // Show disk usage
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter((f) => f.endsWith('.jpg') && !f.startsWith('temp-') && !f.startsWith('resized-'));
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
