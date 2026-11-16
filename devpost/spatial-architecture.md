# Spatial Architecture: AeroTorque Spatial
**Round 2 Learn AR with SPECS — Aerospace MRO Spatial System Architecture**

---

## 1. Executive Coordinate System & Spatial Philosophy

AeroTorque Spatial operates on the principle that **true AR does not show floating screens—it draws in the world at real 1:1 scale**. In aerospace MRO, any visual obstruction or misaligned hologram introduces fatal risk (e.g. cross-threading, uneven flange compression, foreign object damage).

All scene elements are world-locked to a single physical reference datum:
- **Global Origin (`MRO_Workbench_Anchor`):** `[0.000m, 0.000m, 0.000m]` located on the top surface of the physical ESD assembly workbench.
- **Coordinate Conventions:** Right-handed Cartesian coordinates:
  - `+X` points to the technician's **Right**
  - `+Y` points **Upward** normal to the workbench table
  - `+Z` points toward the **Technician** (forward/aft)
- **Optical Tracking Datum:** Tabletop planar homography combined with physical fiducial alignment on the propulsion motor chassis.

```
       [ REAR ELEVATED ZONE: Header & Airworthy Stamp ]
                (X=0.00, Y=+0.23, Z=-0.19)
                             ^
                             | 105 mm clearance
                             v
 [ LEFT ZONE: FOD Mat ]    [ CENTER ZONE: 4-Bolt Flange ]    [ RIGHT ZONE: Protractor & Flap ]
 (X=-0.34, Y=0.00, Z=0.00) (X=0.00, Y=0.00, Z=0.00)         (X=+0.34, Y=0.00, Z=0.00)
       <------------------ 150 mm --------> <------------------ 140 mm -------------->
                                      Tabletop Y = 0.000 m
```

---

## 2. Strict 4-Zone Spatial Partitioning & Dimensions

To ensure mathematical impossibility of spatial overlap (`0px` bounding box collision) from typical eye positions, the workspace is partitioned into four non-overlapping volumes:

### Zone 1: LEFT ZONE — 1:1 FOD Tool Accountability Shadow Mat
- **Anchor Offset:** `X = -0.340 m, Y = 0.000 m, Z = 0.000 m`
- **Physical Mat Footprint:** `160.0 mm (Width, X) x 240.0 mm (Length, Z) x 6.0 mm (Depth, Y)`
- **Spatial Bounding Box:** `[-0.420m to -0.260m, 0.000m to 0.015m, -0.120m to +0.120m]`
- **Recessed Silhouette Geometry:**
  - **Slot A (Torque Wrench):** `220.0 mm x 34.0 mm x 8.0 mm` pocket matching calibrated 12.5 N·m click wrench.
  - **Slot B (Rigging Pin):** `80.0 mm x 8.0 mm x 8.0 mm` pocket for Ø 6.0 mm control surface rigging pin.
- **World-Locked Status Banner:**
  - **Position:** `[-0.340m, +0.012m, +0.135m]` (flush front edge, facing technician at 35° incline).
  - **Content:** `[FOD SHADOW MAT: WRENCH IN HAND (AMBER)]` $\rightarrow$ `[ALL TOOLS STOWED - ZERO FOD (EMERALD)]`.
  - **Clearance to Center Zone:** **150.0 mm** buffer to the leftmost edge of the center motor mount flange (`-0.260m` to `-0.110m`).

### Zone 2: CENTER ZONE — 4-Bolt Propulsion Flange & Torque Sequencer
- **Anchor Offset:** `X = 0.000 m, Y = 0.000 m, Z = 0.000 m`
- **Chassis Flange Dimensions:** `140.0 mm x 140.0 mm x 25.0 mm` CNC 6061-T6 aluminum motor mount block with 120.0 mm x 120.0 mm pitch square.
- **Fastener Coordinates (Tabletop reference):**
  - **Bolt 1 (North-West / NW):** `[-0.085 m, +0.025 m, -0.085 m]`
  - **Bolt 4 (South-East / SE):** `[+0.085 m, +0.025 m, +0.085 m]` (Diagonal Pair #1)
  - **Bolt 2 (North-East / NE):** `[+0.085 m, +0.025 m, -0.085 m]`
  - **Bolt 3 (South-West / SW):** `[-0.085 m, +0.025 m, +0.085 m]` (Diagonal Pair #2)
- **Single-Active Callout Specification (Zero-Overlap Law):**
  - Only **ONE** bolt has an active elevated 3D leader stem at any time.
  - **Leader Stem:** Vertical line from bolt centroid `[X_bolt, +0.025m, Z_bolt]` to `[X_bolt, +0.145m, Z_bolt]`.
  - **Spatial Badge:** Placed at `[X_bolt, +0.165m, Z_bolt]` with dimensions `220 mm x 45 mm`. Billboarded or angled slightly towards technician eye plane.
  - **Next Diagonal Fastener:** Traced via an elevated 3D Parabolic Vector Spline Arc peaking at `Y = +0.095m`. No badge is placed over the destination bolt.
  - **Locked Bolts:** Vertical stem retracts instantly upon pinch confirmation. Only a flush emerald collar ring (`Y = +0.026m`, thickness 1.0mm) remains with compact micro-engraving (`✓ 12.5 N·m`).
  - **Poka-Yoke Rejection:** If adjacent fastener is probed out of sequence, a crimson octagonal ring (`Y = +0.030m`) and warning label appear on that bolt, blocking sequence advancement.

### Zone 3: RIGHT ZONE — Parallax-Free 1:1 Optical Protractor & Articulated Flap
- **Anchor Offset:** `X = +0.340 m, Y = 0.000 m, Z = 0.000 m`
- **Spatial Bounding Box:** `[+0.250m to +0.430m, 0.000m to +0.150m, -0.110m to +0.110m]`
- **Articulated Flap Geometry:** Carbon-fiber airfoil control surface (`150.0 mm x 80.0 mm`) hinged along `X`-axis at `Z = 0.000m`.
- **1:1 Optical Protractor Arc:**
  - True physical radius: `R = 120.0 mm`
  - Range: `-15.0°` (droop) to `+15.0°` (deflection) with `1.0°` precision laser-etched vernier ticks.
  - Major indices at `-15.0°`, `0.0°`, and `+15.0°`.
- **Dual-Ring Optical Sightline Reticle:**
  - Front Ring: Radius `12.0 mm` at `Z = +0.040 m`
  - Rear Ring: Radius `6.0 mm` at `Z = 0.000 m`
  - Parallax Criterion: The two concentric rings achieve visual coaxial alignment if and only if the technician's line of sight is normal to the protractor plane, guaranteeing zero angular parallax error during flap sweep verification (`+15.0° ± 0.2°`).
- **Clearance to Center Zone:** **140.0 mm** buffer to the rightmost edge of the center motor mount flange (`+0.110m` to `+0.250m`).

### Zone 4: REAR ELEVATED ZONE — Spatial Workbench Header & Airworthy Sign-Off
- **Anchor Offset:** `X = 0.000 m, Y = +0.230 m, Z = -0.190 m`
- **Spatial Bounding Box:** `[-0.200m to +0.200m, +0.190m to +0.280m, -0.200m to -0.180m]`
- **Vertical Clearance:** Elevated **205.0 mm** above the tabletop and **65.0 mm** above the highest point of any active bolt callout badge (`Y = +0.165m`).
- **Depth Clearance:** Set back **105.0 mm** behind the rear bolt bosses (`Z = -0.085m` to `-0.190m`).
- **Display Modes:**
  - **Stage 1 & 2:** High-contrast cyan workbench status header (`STAGE 1/3: STAR-PATTERN TORQUE SEQUENCER`).
  - **Stage 3:** Transforms into emerald holographic 3D Airworthiness Stamp:
    ```
    ┌────────────────────────────────────────────────────────┐
    │  FAA PART 43 / PART 108 MRO INSPECTION VERIFIED        │
    │  12.5 N·m STAR TORQUE [PASS] | +15.0° DEFLECTION [PASS] │
    │  FOD CLEARANCE: 100% SECURE | SHA-256: 7f83b165...     │
    └────────────────────────────────────────────────────────┘
    ```

---

## 3. Mathematical Parabolic Spline Arc Equation

To guide the technician across diagonal bolt pairs without cluttering the center motor shaft, guidance arcs are evaluated as quadratic Bézier curves with an elevated midpoint:

$$P(t) = (1 - t)^2 P_{start} + 2(1 - t)t P_{apex} + t^2 P_{target}, \quad t \in [0, 1]$$

Where:
- $P_{start} = [X_{active}, +0.025, Z_{active}]$
- $P_{target} = [X_{queued}, +0.025, Z_{queued}]$
- $P_{apex} = \left[\frac{X_{start} + X_{target}}{2}, +0.095, \frac{Z_{start} + Z_{target}}{2}\right]$

Directional chevron arrows animate along the arc by sampling points at $t_k = (t_0 + k \cdot 0.2) \pmod{1.0}$, providing intuitive visual flow in the technician's peripheral vision.

---

## 4. Optical Sightline & Parallax Math for SPECS Waveguide

When viewing through the Snap SPECS optical waveguide, parallax error $\Delta \theta$ is given by:

$$\Delta \theta = \arctan\left(\frac{\Delta x_{eye}}{D_{reticle}}\right)$$

Where $\Delta x_{eye}$ is lateral eye misalignment and $D_{reticle}$ is the separation between the front and rear sightline rings ($40.0\text{ mm}$). 
By requiring the technician to align the inner 6 mm ring concentric to the outer 12 mm ring, lateral eye drift is constrained to $|\Delta x_{eye}| \le 0.14\text{ mm}$, yielding an angular parallax error of:

$$\Delta \theta \le \arctan\left(\frac{0.14}{40.0}\right) \approx 0.20^\circ$$

This guarantees precision within the strict FAA Part 23/108 flight control rigging tolerance of $\pm 0.2^\circ$.

---

## 5. Screen-Space Projection & Zero-Overlap Guarantee

Under standard SPECS optics (nominal technician eye position at `[0.00, 0.45, 0.65]`, looking at `[0.00, 0.05, -0.05]`):

| Zone Element | World Coordinates (X, Y, Z) [m] | Projected 2D Box (X_min, Y_min, W, H) [px] | Collision Target | Overlap Result |
| :--- | :--- | :--- | :--- | :--- |
| **Left Zone FOD Status** | `[-0.340, 0.012, +0.135]` | `[260, 680, 240, 52]` | Center Zone Flange | **0 px (164 px margin)** |
| **Center Bolt #1 Badge** | `[-0.085, 0.165, -0.085]` | `[680, 280, 240, 58]` | Rear Zone Header | **0 px (112 px margin)** |
| **Center Bolt #1 Badge** | `[-0.085, 0.165, -0.085]` | `[680, 280, 240, 58]` | Right Zone Protractor | **0 px (286 px margin)** |
| **Right Zone Protractor** | `[+0.340, 0.080, 0.000]` | `[1220, 390, 260, 190]` | Center Zone Flange | **0 px (195 px margin)** |
| **Rear Zone Header** | `[0.000, 0.230, -0.190]` | `[720, 110, 480, 78]` | Active Bolt Badge | **0 px (92 px margin)** |

Because the **Single-Active Callout Rule** strictly forbids multiple bolt badges, no intra-flange badge collisions can ever occur. Pairwise intersection between all four zones confirms **0px collision** across all 7 operational states.
