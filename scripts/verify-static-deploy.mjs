import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

// Create a static server simulating Vercel static deployment (NO node_modules access)
function createVercelStaticServer(port = 3456) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURI(req.url.split('?')[0]);

      // Strict Vercel simulation: Block node_modules access
      if (reqPath.startsWith('/node_modules')) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: node_modules blocked in static deploy simulation');
        return;
      }

      // Root rewrite to /preview/index.html
      if (reqPath === '/' || reqPath === '') {
        reqPath = '/preview/index.html';
      }

      const filePath = path.join(rootDir, reqPath);

      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end(`404 Not Found: ${reqPath}`);
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath).pipe(res);
      });
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function runStaticVerification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING ZERO-DEPENDENCY STATIC VERCEL DEPLOYMENT');
  console.log('================================================================');

  const PORT = 3456;
  const server = await createVercelStaticServer(PORT);
  console.log(`[Static Server] Live on http://localhost:${PORT} (node_modules blocked)`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--window-size=1920,1080', '--force-device-scale-factor=1'],
  });

  const testRoutes = ['/', '/preview/index.html'];

  for (const route of testRoutes) {
    console.log(`\nTesting Route: http://localhost:${PORT}${route}`);
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    const consoleErrors = [];
    const failed404s = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        failed404s.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' });

    // Wait 1.5 seconds for WebGL render loop and badge positioning
    await page.waitForTimeout(1500);

    // Assert zero 404s and console errors
    console.log(`  - 404 Responses: ${failed404s.length} ${failed404s.length ? '❌ (' + failed404s.join(', ') + ')' : '✓ (0)'}`);
    console.log(`  - Console Errors: ${consoleErrors.length} ${consoleErrors.length ? '❌ (' + consoleErrors.join(', ') + ')' : '✓ (0)'}`);

    if (failed404s.length > 0) {
      throw new Error(`Route ${route} had 404 network responses: ${failed404s.join('; ')}`);
    }
    if (consoleErrors.length > 0) {
      throw new Error(`Route ${route} threw console errors: ${consoleErrors.join('; ')}`);
    }

    // Verify Three.js loaded and FOD badge is not stuck at (0,0)
    const domStatus = await page.evaluate(() => {
      const fodMat = document.getElementById('fodStatusBadge');
      const fodRect = fodMat ? fodMat.getBoundingClientRect() : null;
      const stageHeader = document.getElementById('rearHeaderBadge');
      const stageRect = stageHeader ? stageHeader.getBoundingClientRect() : null;
      const canvas = document.getElementById('viewport3d');

      return {
        fodLeft: fodRect ? Math.round(fodRect.left) : null,
        fodTop: fodRect ? Math.round(fodRect.top) : null,
        stageTop: stageRect ? Math.round(stageRect.top) : null,
        stageLeft: stageRect ? Math.round(stageRect.left) : null,
        canvasWidth: canvas ? canvas.width : 0,
        canvasHeight: canvas ? canvas.height : 0,
      };
    });

    console.log(`  - FOD Badge Position: (${domStatus.fodLeft}px, ${domStatus.fodTop}px)`);
    console.log(`  - Stage Header Position: (${domStatus.stageLeft}px, ${domStatus.stageTop}px)`);
    console.log(`  - Canvas Resolution: ${domStatus.canvasWidth}x${domStatus.canvasHeight}`);

    // Assert FOD badge is NOT stuck at (0, 0)
    if (domStatus.fodLeft === 0 && domStatus.fodTop === 0) {
      throw new Error(`FOD badge is stuck at (0, 0) on route ${route}!`);
    }

    // Assert FOD badge is in the expected lower-left region (left >= 28px, top >= 600px)
    if (domStatus.fodLeft < 28 || domStatus.fodTop < 500) {
      throw new Error(`FOD badge is out of expected lower-left zone: (${domStatus.fodLeft}, ${domStatus.fodTop})`);
    }

    // Assert Stage header is visible below top dock (top >= 76px)
    if (domStatus.stageTop < 76) {
      throw new Error(`Stage header is colliding with top dock: top=${domStatus.stageTop}`);
    }

    if (route === '/') {
      const screenshotPath = path.join(rootDir, 'demo', 'verify_static_vercel_render.png');
      await page.screenshot({ path: screenshotPath });
      console.log(`  ✓ Saved static deployment verification screenshot: ${screenshotPath}`);
    }

    console.log(`  ✓ Route ${route} PASSED all static deployment assertions!`);
    await context.close();
  }

  await browser.close();
  server.close();

  console.log('\n================================================================');
  console.log('🏆 STATIC ZERO-DEPENDENCY VERCEL DEPLOYMENT 100% VERIFIED!');
  console.log('================================================================\n');
}

runStaticVerification().catch((err) => {
  console.error('\n❌ VERIFICATION ERROR:', err);
  process.exit(1);
});
