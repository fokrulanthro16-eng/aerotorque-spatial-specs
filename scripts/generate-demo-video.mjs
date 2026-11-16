import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync, execSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const demoDir = path.join(rootDir, 'demo');
const audioDir = path.join(demoDir, 'audio');
const rawDir = path.join(demoDir, 'raw');
const finalVideoPath = path.join(demoDir, 'AeroTorque_Spatial_Demo.mp4');

const SCENES = [
  {
    id: 'seg_01',
    name: 'Scene 1: Hook & Zero Face-HUD',
    text: "Most augmented reality apps fail because they float a flat website right in front of your face. AeroTorque Spatial is engineered from the ground up for Snap SPECS. There are zero floating screens blocking your vision. Every guide is locked in true one-to-one millimeter scale directly onto the physical workbench, keeping the technician's hands completely free.",
  },
  {
    id: 'seg_02',
    name: 'Scene 2: Problem & 4-Zone Architecture',
    text: "In aerospace and autonomous drone maintenance, assembling a propulsion mount leaves zero room for error. Tightening bolts out of sequence warps the metal flange. Reading an angle gauge off-axis causes optical parallax error. And a single wrench left behind becomes a catastrophic Foreign Object Debris hazard. That is why we built a collision-free, four-zone spatial workbench right on the table.",
  },
  {
    id: 'seg_03',
    name: 'Scene 3: Stage 1 Poka-Yoke Mistake-Proofing',
    text: "First, AeroTorque enforces active poka-yoke mistake-proofing. If a technician reaches for an adjacent bolt out of sequence, SPECS immediately projects a crimson three-dimensional interlock ring on that bolt—blocking flange warp before it happens and directing their eyes along a glowing parabolic arc to the proper diagonal bolt.",
  },
  {
    id: 'seg_04',
    name: 'Scene 4: Hands-Free 21-Joint Pinch Star Sequence',
    text: "Using twenty-one-joint hand tracking, a simple thumb-index pinch confirms each twelve-point-five Newton-meter torque click. Completed bolts instantly collapse their callout stems into flush emerald collars, keeping the view clean as clamping symmetry reaches one hundred percent.",
  },
  {
    id: 'seg_05',
    name: 'Scene 5: Stage 2 Parallax-Free 1:1 Optical Protractor',
    text: "Once all four bolts lock, Stage Two illuminates a true-scale optical protractor right beside the wing flap. A coaxial sightline reticle eliminates parallax error, verifying that the physical flap hits plus fifteen degrees within a point-two-degree tolerance.",
  },
  {
    id: 'seg_06',
    name: 'Scene 6: Stage 3 Zero-FOD & FAA Airworthiness Stamp',
    text: "Finally, in Stage Three, returning the torque wrench into its shadow silhouette clears the safety interlock. SPECS then projects an FAA Part Forty-Three and Part One-Zero-Eight Airworthy Stamp sealed with a cryptographic audit hash.",
  },
  {
    id: 'seg_07',
    name: 'Scene 7: Zero-Overlap Audit & Closing',
    text: "Planned with the official Devpost Learn skill pack, built for Lens Studio with CLAD and MCP, and verified with zero bounding-box collisions and twenty-three passing LEAF tests, AeroTorque Spatial turns Snap SPECS into a zero-error aerospace workbench.",
  },
];

// Helper: check if server on port 8080 is reachable
function checkServer(port = 8080) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/preview/index.html`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Helper: Measure audio duration in milliseconds via ffmpeg
function getAudioDurationMs(filePath) {
  const result = spawnSync('ffmpeg', ['-i', filePath], { encoding: 'utf-8' });
  const output = result.stderr || result.stdout || '';
  const match = output.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)/);
  if (!match) {
    throw new Error(`Failed to parse duration from ffmpeg output for ${filePath}:\n${output}`);
  }
  const hours = parseFloat(match[1]);
  const minutes = parseFloat(match[2]);
  const seconds = parseFloat(match[3]);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

// Step 1: Generate Audio Segments
async function generateAllVoiceovers() {
  console.log('\n================================================================');
  console.log('🎙️ STEP 1: GENERATING NEURAL AI VOICEOVER SEGMENTS');
  console.log('================================================================');

  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  const sceneDurations = [];

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    const outputFile = path.join(audioDir, `${scene.id}.mp3`);
    console.log(`\n[TTS] Processing ${scene.id} (${scene.name})...`);

    let generated = false;

    // Check if already generated and valid
    if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 1000) {
      try {
        const d = getAudioDurationMs(outputFile);
        if (d > 3000) {
          generated = true;
          console.log(`  ✓ Reusing existing valid audio file (${(d / 1000).toFixed(2)}s).`);
        }
      } catch (e) {
        // regenerate if invalid
      }
    }

    // Try edge-tts with up to 3 retries
    for (let attempt = 1; attempt <= 3 && !generated; attempt++) {
      try {
        console.log(`  Trying edge-tts (en-US-AndrewNeural, attempt ${attempt}/3)...`);
        const res = spawnSync('python', [
          '-m', 'edge_tts',
          '--voice', 'en-US-AndrewNeural',
          '--rate=+2%',
          '--text', scene.text,
          '--write-media', outputFile
        ], { encoding: 'utf-8', timeout: 35000 });

        if (res.status === 0 && fs.existsSync(outputFile) && fs.statSync(outputFile).size > 1000) {
          generated = true;
          console.log(`  ✓ Generated via edge-tts successfully.`);
        } else {
          console.warn(`  ! Attempt ${attempt} failed: ${res.stderr || res.stdout || 'Unknown error'}`);
          if (attempt < 3) {
            spawnSync('powershell', ['-NoProfile', '-Command', 'Start-Sleep -Milliseconds 1500']);
          }
        }
      } catch (err) {
        console.warn(`  ! Attempt ${attempt} threw: ${err.message}`);
        if (attempt < 3) {
          spawnSync('powershell', ['-NoProfile', '-Command', 'Start-Sleep -Milliseconds 1500']);
        }
      }
    }

    // Fallback: Windows PowerShell SpeechSynthesizer using clean .ps1 script
    if (!generated) {
      try {
        console.log(`  Synthesizing with Windows SpeechSynthesizer fallback...`);
        const tempWav = path.join(audioDir, `${scene.id}_temp.wav`);
        const tempPs1 = path.join(audioDir, `${scene.id}_gen.ps1`);

        const psContent = `Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.SetOutputToWaveFile('${tempWav.replace(/\\/g, '\\\\')}')
$synth.Speak(@"
${scene.text}
"@)
$synth.Dispose()
`;
        fs.writeFileSync(tempPs1, psContent, 'utf-8');

        const psRes = spawnSync('powershell', [
          '-NoProfile',
          '-ExecutionPolicy', 'Bypass',
          '-File', tempPs1
        ], { encoding: 'utf-8' });

        if (fs.existsSync(tempPs1)) fs.unlinkSync(tempPs1);

        if (fs.existsSync(tempWav) && fs.statSync(tempWav).size > 1000) {
          spawnSync('ffmpeg', ['-y', '-i', tempWav, '-q:a', '2', outputFile], { stdio: 'pipe' });
          if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav);
          generated = true;
          console.log(`  ✓ Generated via Windows SpeechSynthesizer fallback.`);
        } else {
          throw new Error(`PowerShell TTS output missing: ${psRes.stderr || psRes.stdout}`);
        }
      } catch (fbErr) {
        throw new Error(`Fatal: All TTS engines failed for scene ${scene.id}: ${fbErr.message}`);
      }
    }

    const durationMs = getAudioDurationMs(outputFile);
    console.log(`  Duration: ${(durationMs / 1000).toFixed(2)}s (${durationMs}ms) | Size: ${fs.statSync(outputFile).size} bytes`);
    sceneDurations.push({ ...scene, file: outputFile, durationMs });
  }

  // Create 400ms silence audio
  const silencePath = path.join(audioDir, 'silence_400ms.mp3');
  console.log(`\n[Audio] Creating 400ms natural breathing pause track...`);
  spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '0.400', '-q:a', '2', silencePath], { stdio: 'pipe' });

  // Create concat list with normalized absolute paths
  const concatListPath = path.join(audioDir, 'concat_list.txt');
  const concatLines = [];
  sceneDurations.forEach((s, idx) => {
    concatLines.push(`file '${s.file.replace(/\\/g, '/')}'`);
    if (idx < sceneDurations.length - 1) {
      concatLines.push(`file '${silencePath.replace(/\\/g, '/')}'`);
    }
  });
  fs.writeFileSync(concatListPath, concatLines.join('\n'));

  // Concatenate master audio track
  const fullAudioPath = path.join(audioDir, 'full_voiceover.mp3');
  console.log(`[Audio] Concatenating master voiceover to full_voiceover.mp3...`);
  const concatRes = spawnSync('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListPath,
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    fullAudioPath,
  ], { encoding: 'utf-8' });

  if (concatRes.status !== 0 || !fs.existsSync(fullAudioPath)) {
    throw new Error(`FFmpeg audio concat failed: ${concatRes.stderr || concatRes.stdout}`);
  }

  const totalAudioDurationMs = getAudioDurationMs(fullAudioPath);
  console.log(`\n🎉 MASTER VOICEOVER READY: ${(totalAudioDurationMs / 1000).toFixed(2)}s (${totalAudioDurationMs}ms)`);
  return { sceneDurations, fullAudioPath, totalAudioDurationMs };
}

// Step 2: Record Synchronized Video with Playwright
async function recordSynchronizedVideo(sceneDurations) {
  console.log('\n================================================================');
  console.log('🎥 STEP 2: RECORDING SYNCHRONIZED 1080P BROWSER ACTIONS');
  console.log('================================================================');

  if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

  // Clean old raw videos
  fs.readdirSync(rawDir).forEach((f) => {
    if (f.endsWith('.webm') || f.endsWith('.mp4')) {
      try { fs.unlinkSync(path.join(rawDir, f)); } catch(e){}
    }
  });

  const isServerLive = await checkServer(8080);
  if (!isServerLive) {
    throw new Error('Local preview server is not responding at http://localhost:8080/preview/index.html');
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--hide-scrollbars'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: rawDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  const url = 'http://localhost:8080/preview/index.html';
  console.log(`[Playwright] Opening ${url} at 1920x1080...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  await page.waitForFunction(() => window.__AeroTorque !== undefined);
  await page.evaluate(() => window.__AeroTorque.setState(0));
  await page.waitForTimeout(800);

  const PAUSE_MS = 400;

  // Scene 1: Hook & Zero Face-HUD
  {
    const d = sceneDurations[0].durationMs;
    console.log(`\n[Scene 1] Hook & Zero Face-HUD (${(d / 1000).toFixed(2)}s)...`);
    const startTime = Date.now();
    await page.mouse.move(960, 520, { steps: 20 });
    await page.waitForTimeout(Math.max(200, Math.round(d * 0.3)));
    await page.mouse.move(920, 480, { steps: 25 });
    await page.waitForTimeout(Math.max(200, Math.round(d * 0.3)));
    await page.mouse.move(980, 500, { steps: 25 });
    const elapsed = Date.now() - startTime;
    const remaining = d + PAUSE_MS - elapsed;
    if (remaining > 0) await page.waitForTimeout(remaining);
  }

  // Scene 2: Problem & 4-Zone Architecture
  {
    const d = sceneDurations[1].durationMs;
    console.log(`\n[Scene 2] Problem & 4-Zone Architecture (${(d / 1000).toFixed(2)}s)...`);
    const startTime = Date.now();
    // 1. Left Zone FOD Mat
    await page.mouse.move(340, 680, { steps: 35 });
    await page.waitForTimeout(Math.max(200, Math.round(d * 0.22)));
    // 2. Center Flange Mount
    await page.mouse.move(960, 500, { steps: 35 });
    await page.waitForTimeout(Math.max(200, Math.round(d * 0.22)));
    // 3. Right Zone Optical Protractor
    await page.mouse.move(1480, 480, { steps: 35 });
    await page.waitForTimeout(Math.max(200, Math.round(d * 0.22)));
    // 4. Rear Stage Header
    await page.mouse.move(960, 150, { steps: 35 });
    const elapsed = Date.now() - startTime;
    const remaining = d + PAUSE_MS - elapsed;
    if (remaining > 0) await page.waitForTimeout(remaining);
  }

  // Scene 3: Stage 1 Poka-Yoke Mistake-Proofing
  {
    const d = sceneDurations[2].durationMs;
    console.log(`\n[Scene 3] Stage 1 Poka-Yoke Mistake-Proofing (${(d / 1000).toFixed(2)}s)...`);
    const startTime = Date.now();
    await page.keyboard.press('p');
    await page.mouse.move(1030, 470, { steps: 30 });
    await page.waitForTimeout(Math.max(400, Math.round(d * 0.5)));
    await page.mouse.move(890, 540, { steps: 25 });
    const elapsed = Date.now() - startTime;
    const remaining = d + PAUSE_MS - elapsed;
    if (remaining > 0) await page.waitForTimeout(remaining);
  }

  // Scene 4: Hands-Free 21-Joint Pinch Star Sequence
  {
    const d = sceneDurations[3].durationMs;
    console.log(`\n[Scene 4] Hands-Free 21-Joint Pinch Star Sequence (${(d / 1000).toFixed(2)}s)...`);
    const startTime = Date.now();
    const stepInterval = Math.round(d / 4);

    // Step 1: Pinch to clear error and lock Bolt 1 -> Bolt 4 Target (25%)
    await page.keyboard.press('Space');
    await page.mouse.move(980, 560, { steps: 20 });
    await page.waitForTimeout(stepInterval);

    // Step 2: Pinch to lock Bolt 4 -> Bolt 2 Target (50%)
    await page.keyboard.press('Space');
    await page.mouse.move(1030, 470, { steps: 20 });
    await page.waitForTimeout(stepInterval);

    // Step 3: Pinch to lock Bolt 2 -> Bolt 3 Target (75%)
    await page.keyboard.press('Space');
    await page.mouse.move(890, 560, { steps: 20 });
    await page.waitForTimeout(stepInterval);

    const elapsed = Date.now() - startTime;
    const remaining = d + PAUSE_MS - elapsed;
    if (remaining > 0) await page.waitForTimeout(remaining);
  }

  // Scene 5: Stage 2 Parallax-Free 1:1 Optical Protractor
  {
    const d = sceneDurations[4].durationMs;
    console.log(`\n[Scene 5] Stage 2 Parallax-Free 1:1 Optical Protractor (${(d / 1000).toFixed(2)}s)...`);
    const startTime = Date.now();
    // Press Space to lock final bolt (100%) and illuminate Stage 2 Protractor
    await page.keyboard.press('Space');
    await page.mouse.move(1420, 480, { steps: 30 });
    await page.waitForTimeout(Math.max(400, Math.round(d * 0.4)));
    await page.mouse.move(1480, 440, { steps: 25 });
    const elapsed = Date.now() - startTime;
    const remaining = d + PAUSE_MS - elapsed;
    if (remaining > 0) await page.waitForTimeout(remaining);
  }

  // Scene 6: Stage 3 Zero-FOD & FAA Airworthiness Stamp
  {
    const d = sceneDurations[5].durationMs;
    console.log(`\n[Scene 6] Stage 3 Zero-FOD & FAA Airworthiness Stamp (${(d / 1000).toFixed(2)}s)...`);
    const startTime = Date.now();
    // Press Space to stow wrench and lock Airworthy MRO Stamp
    await page.keyboard.press('Space');
    await page.mouse.move(340, 680, { steps: 30 });
    await page.waitForTimeout(Math.max(400, Math.round(d * 0.45)));
    await page.mouse.move(960, 150, { steps: 30 });
    const elapsed = Date.now() - startTime;
    const remaining = d + PAUSE_MS - elapsed;
    if (remaining > 0) await page.waitForTimeout(remaining);
  }

  // Scene 7: Zero-Overlap Audit & Closing
  {
    const d = sceneDurations[6].durationMs;
    console.log(`\n[Scene 7] Zero-Overlap Audit & Closing (${(d / 1000).toFixed(2)}s)...`);
    const startTime = Date.now();
    // Press B to toggle zero-overlap bounding boxes
    await page.keyboard.press('b');
    await page.mouse.move(960, 500, { steps: 25 });
    await page.waitForTimeout(d);
    // Hold 2 seconds for visual impact
    await page.waitForTimeout(2000);
  }

  console.log(`\n[Playwright] Finalizing video recording...`);
  const videoObj = page.video();
  await page.close();
  const rawVideoPath = await videoObj.path();
  await context.close();
  await browser.close();

  console.log(`✓ Raw WebM video recorded at: ${rawVideoPath}`);
  return rawVideoPath;
}

// Step 3: Mux Audio + Video into Production MP4 with FFmpeg
async function muxFinalVideo(rawVideoPath, fullAudioPath) {
  console.log('\n================================================================');
  console.log('🎞️ STEP 3: MUXING H.264 + AAC PRODUCTION MP4 (1080P)');
  console.log('================================================================');

  if (fs.existsSync(finalVideoPath)) {
    fs.unlinkSync(finalVideoPath);
  }

  console.log(`Source Video: ${rawVideoPath}`);
  console.log(`Source Audio: ${fullAudioPath}`);
  console.log(`Target MP4:   ${finalVideoPath}`);

  const ffmpegArgs = [
    '-y',
    '-i', rawVideoPath,
    '-i', fullAudioPath,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '17',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    finalVideoPath,
  ];

  console.log(`[FFmpeg] Running command: ffmpeg ${ffmpegArgs.join(' ')}`);
  const res = spawnSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

  if (res.status !== 0) {
    throw new Error(`FFmpeg failed with exit code ${res.status}`);
  }

  if (!fs.existsSync(finalVideoPath)) {
    throw new Error(`Target file ${finalVideoPath} was not created!`);
  }

  const inspectRes = spawnSync('ffmpeg', ['-i', finalVideoPath], { encoding: 'utf-8' });
  const inspectOutput = inspectRes.stderr || '';

  const durationMatch = inspectOutput.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)/);
  const videoMatch = inspectOutput.match(/Video:\s*([^,]+)/);
  const audioMatch = inspectOutput.match(/Audio:\s*([^,]+)/);
  const resMatch = inspectOutput.match(/(\d{3,4})x(\d{3,4})/);

  const stats = fs.statSync(finalVideoPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n================================================================');
  console.log('🏆 PRODUCTION DEMO VIDEO READY');
  console.log('================================================================');
  console.log(`File:       ${finalVideoPath}`);
  console.log(`File Size:  ${sizeMb} MB (${stats.size} bytes)`);
  console.log(`Duration:   ${durationMatch ? durationMatch[0] : 'Unknown'}`);
  console.log(`Resolution: ${resMatch ? resMatch[0] : '1920x1080'}`);
  console.log(`Video Codec:${videoMatch ? videoMatch[1] : 'H.264'}`);
  console.log(`Audio Codec:${audioMatch ? audioMatch[1] : 'AAC'}`);
  console.log('================================================================\n');

  return {
    path: finalVideoPath,
    sizeBytes: stats.size,
    sizeMb,
    duration: durationMatch ? durationMatch[0] : '',
    resolution: resMatch ? resMatch[0] : '1920x1080',
  };
}

// Master Pipeline Execution
async function main() {
  console.log('================================================================');
  console.log('🚀 AEROTORQUE SPATIAL: AUTOMATED AI DEMO VIDEO GENERATOR');
  console.log('================================================================');

  const { sceneDurations, fullAudioPath } = await generateAllVoiceovers();
  const rawVideoPath = await recordSynchronizedVideo(sceneDurations);
  const finalResult = await muxFinalVideo(rawVideoPath, fullAudioPath);

  console.log('🎉 PIPELINE COMPLETED SUCCESSFULLY! Ready for YouTube upload.');
}

main().catch((err) => {
  console.error('\n❌ FATAL PIPELINE ERROR:', err);
  process.exit(1);
});
