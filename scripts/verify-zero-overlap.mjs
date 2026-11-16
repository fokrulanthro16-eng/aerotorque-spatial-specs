import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from './serve.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'screenshots');

const STATE_NAMES = [
  '01_bolt1_star_arc',
  '02_poka_yoke_interlock',
  '03_bolt4_target',
  '04_bolt2_target',
  '05_bolt3_target',
  '06_optical_protractor',
  '07_airworthy_mro_stamp',
];

async function runZeroOverlapAudit() {
  console.log('================================================================');
  console.log('🚀 AERO-TORQUE SPATIAL: AUTOMATED ZERO-OVERLAP BOUNDING BOX AUDIT');
  console.log('================================================================\n');

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const PORT = 8085;
  const server = await createServer(PORT);

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'],
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const url = `http://localhost:${PORT}/preview/index.html`;
  console.log(`[Playwright] Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for 3D canvas and window.__AeroTorque API
  await page.waitForFunction(() => window.__AeroTorque !== undefined);
  await page.waitForTimeout(1000); // Allow initial Three.js render frame to settle

  let totalCollisions = 0;
  const auditResults = [];

  for (let s = 0; s <= 6; s++) {
    const stateFileName = STATE_NAMES[s];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`[AUDIT] Inspecting State ${s}: ${stateFileName}`);

    // Set state
    await page.evaluate((stateIndex) => {
      window.__AeroTorque.setState(stateIndex);
    }, s);

    // Wait for projection updates
    await page.waitForTimeout(300);

    // Extract visible bounding boxes
    const boxes = await page.evaluate(() => {
      return window.__AeroTorque.getVisibleBoundingBoxes();
    });

    console.log(`  Visible Spatial Badges: ${boxes.length}`);
    boxes.forEach((b) => {
      console.log(
        `    - [${b.id}]: pos=(${Math.round(b.left)}, ${Math.round(b.top)}) size=${Math.round(b.width)}x${Math.round(b.height)}`
      );
    });

    // Check pairwise collisions
    let stateCollisions = 0;
    const pairwiseDetails = [];

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];

        const overlapWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const overlapHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const overlapArea = overlapWidth * overlapHeight;

        // Calculate minimum margin if not overlapping
        const dx = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
        const dy = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
        const marginPx = Math.round(Math.hypot(dx, dy));

        if (overlapArea > 0) {
          stateCollisions++;
          totalCollisions++;
          console.error(
            `  ❌ COLLISION DETECTED between [${a.id}] and [${b.id}]! Overlap: ${Math.round(overlapArea)} px²`
          );
        } else {
          console.log(`  ✓ Pair [${a.id}] <-> [${b.id}]: 0px overlap (Clearance margin: ${marginPx}px)`);
        }

        pairwiseDetails.push({ pair: `${a.id} <-> ${b.id}`, overlapArea, marginPx });
      }
    }

    // Capture 1920x1080 screenshot
    const screenshotPath = path.join(screenshotsDir, `${stateFileName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  📸 Screenshot saved: screenshots/${stateFileName}.png`);

    auditResults.push({
      state: s,
      name: stateFileName,
      visibleCount: boxes.length,
      collisions: stateCollisions,
      pairwiseDetails,
    });
  }

  await browser.close();
  server.close();

  console.log('\n================================================================');
  console.log('📊 AUDIT SUMMARY REPORT');
  console.log('================================================================');
  auditResults.forEach((r) => {
    const status = r.collisions === 0 ? 'PASSED (0px Collision)' : 'FAILED';
    console.log(`State ${r.state} [${r.name}]: ${status}`);
  });
  console.log('----------------------------------------------------------------');
  console.log(`TOTAL BOUNDING BOX COLLISIONS: ${totalCollisions}`);
  console.log('================================================================\n');

  if (totalCollisions > 0) {
    console.error(`Audit failed: ${totalCollisions} collisions detected.`);
    process.exit(1);
  } else {
    console.log('🎉 AUDIT SUCCESS: 100% Zero-Overlap Verified across all 7 states (0px collisions)!');
    process.exit(0);
  }
}

runZeroOverlapAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
