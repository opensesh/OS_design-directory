/**
 * Process HDR skybox image for Universe View
 *
 * Converts HDR Silver and Gold Nebulae spheremap to optimized JPEG:
 * - Uses FFmpeg to tone map HDR to 8-bit (Sharp doesn't support Radiance HDR)
 * - Resizes to 4096×2048 (proper 2:1 equirectangular ratio)
 * - Compresses to JPEG at quality 85%
 */

import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const HDR_SOURCE = "/Users/alexbouhdary/Downloads/HDR_silver_and_gold_nebulae.hdr";
const OUTPUT_PATH = path.join(process.cwd(), "public/textures/galaxy/skybox.jpg");
const BACKUP_PATH = path.join(process.cwd(), "public/textures/galaxy/skybox_old_backup.jpg");

async function processSkybox() {
  console.log("🌌 Processing HDR skybox...\n");

  // Check source exists
  if (!fs.existsSync(HDR_SOURCE)) {
    console.error(`❌ HDR source file not found: ${HDR_SOURCE}`);
    process.exit(1);
  }

  // Backup existing skybox if it exists (skip if already backed up)
  if (fs.existsSync(OUTPUT_PATH) && !fs.existsSync(BACKUP_PATH)) {
    console.log("📦 Backing up current skybox...");
    fs.copyFileSync(OUTPUT_PATH, BACKUP_PATH);
    console.log(`   Saved to: ${BACKUP_PATH}\n`);
  }

  console.log("🔄 Converting HDR to JPEG with tone mapping...");

  // Use FFmpeg to convert HDR directly to JPEG with proper tone mapping
  // - exposure=3: Boost HDR values to bring out nebula detail
  // - tonemap=reinhard: Natural-looking HDR to SDR conversion
  // - param=0.3: Controls contrast in highlight areas
  // - desat=0.2: Slight desaturation to avoid oversaturated colors
  // - q:v 2: High quality JPEG output
  const ffmpegCmd = `ffmpeg -y -i "${HDR_SOURCE}" -vf "scale=4096:2048,exposure=exposure=3,tonemap=reinhard:param=0.3:desat=0.2" -update 1 -frames:v 1 -q:v 2 "${OUTPUT_PATH}"`;

  try {
    execSync(ffmpegCmd, { stdio: "pipe" });
    console.log("   HDR converted and tone mapped to JPEG\n");
  } catch (err) {
    console.error("❌ FFmpeg conversion failed:", err);
    process.exit(1);
  }

  // Verify output using ffprobe
  const outputStats = fs.statSync(OUTPUT_PATH);
  const ffprobeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${OUTPUT_PATH}"`;
  const dimensions = execSync(ffprobeCmd, { encoding: "utf-8" }).trim().split(",");
  const width = parseInt(dimensions[0]);
  const height = parseInt(dimensions[1]);

  console.log("✅ Processing complete!");
  console.log("\n📊 Output info:");
  console.log(`   Path: ${OUTPUT_PATH}`);
  console.log(`   Dimensions: ${width}×${height}`);
  console.log(`   Aspect ratio: ${(width / height).toFixed(2)}:1`);
  console.log(`   File size: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);

  // Verify 2:1 ratio
  const ratio = width / height;
  if (Math.abs(ratio - 2) < 0.01) {
    console.log("\n✅ Correct 2:1 equirectangular aspect ratio");
  } else {
    console.log(`\n⚠️  Aspect ratio is ${ratio.toFixed(3)}:1 (expected 2:1)`);
  }

  console.log("\n🎯 Next steps:");
  console.log("   1. Run `bun dev` and check Universe View");
  console.log("   2. Verify no visible seam at horizontal wrap");
  console.log("   3. Check contrast/accessibility");
  console.log("   4. Delete backup if satisfied: rm public/textures/galaxy/skybox_old_backup.jpg");
}

processSkybox().catch((err) => {
  console.error("❌ Error processing skybox:", err);
  process.exit(1);
});
