---
status: approved
---

# Design Brief: AeroTorque Spatial

<!-- Authored via plan-lens workflow for Learn AR with SPECS (Round 2) -->

## The One Spatial Moment
An aerospace MRO technician stands at a physical avionics/propulsion workbench with both hands holding a calibrated click-type torque wrench. Looking down at the 4-bolt UAV motor mount, they see 1:1 world-locked millimeter-scale 3D Torque Halo Rings surrounding the active bolt boss, an elevated 3D parabolic vector spline arc tracing the diagonal star-pattern to the next bolt, and an immediate crimson poka-yoke warning interlock if their wrench drifts toward an adjacent bolt—preventing flange warping and FOD hazards without taking their hands off the tool or their eyes off the flight hardware.

## Why It Belongs on Glasses
- **Uses:** Shares your view, draws in the world (1:1 true scale), leaves your body free.
- **Shares your view:** The optical surface tracker locks onto the physical workbench mat and airframe chassis in real time, projecting guidance directly on the fastener centroids.
- **Draws in the world (1:1 Millimeter Scale):** Every torque halo, spline arc, and vernier protractor tick is drawn at true physical dimensions (120.0 mm x 120.0 mm bolt square, 18.0 mm bolt boss diameter, 12.5 N·m torque spec, and 1:1 recessed FOD shadow slots).
- **Leaves your body and hands free:** Both hands remain on the physical torque wrench and feeler gauge. Technicians interact seamlessly via hands-free 21-joint 3D hand tracking pinch gestures (thumb-to-index pinch) or standard interactive preview clicks.
- **Zero 2D Face-HUD:** Absolutely no floating 2D browser windows, heads-up cards, or screen-locked text billboards obstructing the technician's line of sight. All visuals are world-locked in the work environment.
- **Why it is vastly superior to a phone or laptop:** Looking away from high-torque aerospace fasteners to check a tablet screen causes lost fastener count, improper cross-star sequence execution (leading to uneven preload and flange micro-warping), parallax reading errors on control surface protractors, and uncataloged tools left on the airframe (Foreign Object Debris / FOD). With SPECS glasses, guidance is anchored directly onto the physical fasteners.

## Product or Overlay
- **Type:** Overlay (world-locked AR overlay registered onto physical aerospace assembly hardware and workbench mat).
- **What the real version would sense:** Real-world workbench plane (Y = 0.00m), optical surface tracking of 4-bolt propulsion flange, 21-joint hand tracking for gesture confirmations, and computer vision verification of tool presence in shadow mat.
- **Stand-in for the preview:** A high-precision virtual CNC aluminum motor mount flange, calibrated torque wrench and rigging pin 3D models, workbench carbon-fiber mat, and interactive mouse/pinch controls in Lens Studio Interactive Preview.

## Where Things Live
- **Where the user is looking during the main task:** Downward at approximately 25°–30° declination toward the physical workbench plane at a working distance of 0.55 m to 0.75 m.
- **Strict 4-Zone Spatial Partitioning (Guaranteed 0px Visual Collision Across All Views):**
  - **Left Zone (`X = -0.34m, Y = 0.00m, Z = 0.00m`):** 1:1 FOD Tool Accountability Shadow Mat (160 mm x 240 mm). Recessed milled silhouettes for Slot A (12.5 N·m Torque Wrench) and Slot B (Ø 6.0 mm Rigging Calibration Pin). Features a flush, world-locked front-edge status bar: `[FOD SHADOW MAT: WRENCH IN HAND] -> [ALL TOOLS STOWED - ZERO FOD]`.
  - **Center Zone (`X = 0.00m, Y = 0.00m, Z = 0.00m`):** 4-Bolt Propulsion Flange Mount (120.0 mm x 120.0 mm pitch square). Bolt coordinates: Bolt 1 NW (`-0.085m, +0.025m, -0.085m`), Bolt 4 SE (`+0.085m, +0.025m, +0.085m`), Bolt 2 NE (`+0.085m, +0.025m, -0.085m`), Bolt 3 SW (`-0.085m, +0.025m, +0.085m`).
  - **Right Zone (`X = +0.34m, Y = 0.00m, Z = 0.00m`):** Articulated UAV Aileron / Rotor Pitch Flap and 1:1 Parallax-Free 3D Optical Protractor Arc (`-15.0°`, `0.0°`, `+15.0°` vernier ticks) with Dual-Ring Optical Sightline Reticle confirming 0-parallax alignment at `+15.0° ± 0.2°`.
  - **Rear Elevated Zone (`X = 0.00m, Y = +0.23m, Z = -0.19m`):** Spatial Workbench Header and FAA Part 43 / Part 108 Airworthiness Sign-Off Stamp (`12.5 N·m & +15.0° VERIFIED — ZERO FOD`) with deterministic SHA-256 inspection hash.

## Hands and Input
- **Primary Gesture:** 21-joint 3D Hand Tracking thumb-to-index pinch gesture (Euclidean distance between thumb tip and index tip `< 18.0 mm` with 250 ms debounce).
- **Interactive Preview Fallback:** Single mouse click / tap on interactive SIK buttons or directly onto 3D bolt bosses.
- **Keyboard Shortcuts (Interactive Studio):** `Space` to step/pinch forward, `P` to simulate out-of-sequence poka-yoke violation, `1`–`7` for deterministic state selection, `A` for autonomous looping presentation demo mode.
- **Targets:** Ergonomically oversized 3D collision volumes (Ø 40 mm collider around each 18 mm bolt boss) with luminous highlight halos when targeted.

## When Things Show (Single-Active Callout & Anti-Overlap Policy)
- **Active TARGET Bolt Only:** Elevates a single vertical 3D leader stem to `Y = +0.145m` with a compact spatial badge (`BOLT #1 [NW] | TARGET: 12.5 N·m | STAR SEQ 1/4`), rotating clockwise torque direction vector ring, and live clamping symmetry preload gauge.
- **Next QUEUED Diagonal Bolt:** Connected via an elevated 3D parabolic vector spline arc (peaking at `Y = +0.095m`) with animated directional chevron pulses (`1 -> 4 -> 2 -> 3`). No floating text card is displayed above the queued bolt.
- **Completed LOCKED Bolts:** Immediately retract their vertical leader stem upon pinch confirmation, leaving only a flush emerald collar ring (`Y = +0.026m`) with compact `✓ 12.5 N·m` micro-engraving on the flange face.
- **Poka-Yoke Warning State:** If an adjacent bolt is probed out of sequence, a crimson 3D octagonal interlock ring illuminates on that bolt (`OUT-OF-SEQUENCE BLOCKED: FLANGE WARP RISK`) while pulsing the parabolic arc toward the correct diagonal fastener.
- **Stage 2 Transition:** When all 4 bolts reach 100% uniform preload, bolt stems retract and the Right Zone 1:1 Optical Protractor illuminates for control surface deflection verification.
- **Stage 3 Transition:** When the torque wrench is returned to the Left Zone shadow slot, the Rear Elevated Zone projects the emerald 3D Airworthiness Stamp.

## Done Criteria
Each criterion is deterministically verifiable in Lens Studio Interactive Preview:
1. **Star-Pattern Torque Sequencing:** Pinching or clicking through the 4 bolts enforces the diagonal sequence `Bolt 1 (NW) -> Bolt 4 (SE) -> Bolt 2 (NE) -> Bolt 3 (SW)`; tightened bolts display flush emerald collar rings (`✓ 12.5 N·m`) and clamping symmetry increments (`25% -> 50% -> 75% -> 100%`).
2. **Poka-Yoke Flange Warp Interlock:** Probing an out-of-sequence adjacent bolt triggers the crimson 3D octagonal interlock banner and blocks advancement until the diagonal fastener is addressed.
3. **Parabolic Spline Guidance Arc:** Directional chevron pulses continuously animate along the 3D parabolic spline arc between active and queued diagonal bolt pairs.
4. **1:1 Optical Protractor & Parallax Alignment:** Sweeping the articulated control flap to `+15.0°` aligns the dual-ring optical sightline reticle, confirming zero parallax and meeting the `±0.2°` aerospace tolerance specification.
5. **FOD Tool Interlock & Airworthy Sign-Off:** The emerald 3D Airworthiness MRO Stamp cannot trigger until the torque wrench is stowed in Slot A of the FOD mat; once stowed, the stamp projects the deterministic SHA-256 inspection hash.
6. **Zero Visual Overlap (0px Collision):** Screen-space projection audit verifies 0 bounding-box collisions across all UI badges, banners, and stamps in all 7 operational states.

## Out of Scope
- Direct BLE integration with digital strain-gauge torque wrench hardware (simulated via world-space spatial state machine).
- Multi-user remote spectator synchronization (Connected Lenses).
- Real-world unstructured mesh plane classification (anchored to physical workbench planar frame).

## Risks and Open Questions
- **Ambient Lighting in MRO Hangars:** Low-contrast reflective metal surfaces could challenge raw monocular feature tracking; mitigated by high-contrast high-visibility cyan/emerald/crimson additive holograms designed specifically for optical see-through displays.
- **Gloves on Technicians:** Thick aerospace nitrile gloves can alter hand mesh topology; mitigated by oversized 18 mm pinch threshold with temporal hysteresis and interactive click fallbacks.

## Build Notes for CLAD
- Build for Snap SPECS (Lens Studio 5.23+ / 5.24) with full Interactive Preview compatibility.
- Anchor all geometries to root `MRO_Workbench_Anchor` (`Y = 0.00m`).
- Implement modular TypeScript architecture: `AeroTorqueController.ts`, `StarSequenceEngine.ts`, `ParabolicArcGenerator.ts`, `OpticalProtractorRig.ts`, `FodShadowTracker.ts`, and `SpatialInputHandler.ts`.
- Ensure additive display color harmony: Cyan (`#00E5FF`) for active targets, Emerald (`#00E676`) for locked bolts/sign-off, Amber (`#FFB300`) for active tools, and Crimson (`#FF1744`) for poka-yoke interlocks.
- Zero floating HUD panels: all text must be world-locked 3D planar geometries.

## After the Build: Judge It
1. **Logic Proven:** Star-sequence state machine, poka-yoke rejection logic, parabolic spline evaluation, optical protractor deflection math, and FOD interlock verified by automated LEAF and unit test suites.
2. **Zero-Overlap Proven:** Automated Playwright audit verifies 0px bounding box collision across all 7 states at 1920x1080 resolution.
3. **Interactive Validation:** Open `preview/index.html` in browser or Lens Studio Interactive Preview, press `Space` to advance star sequence, press `P` to verify poka-yoke interlock, and confirm 60 FPS performance.
