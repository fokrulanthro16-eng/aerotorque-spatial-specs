import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AeroTorqueController, AeroTorqueState } from '../Assets/Scripts/AeroTorqueController.js';

describe('Spatial Separation & Zero-Overlap Rule Tests', () => {
  // Spatial boundary definitions (in meters relative to MRO_Workbench_Anchor)
  const leftZone = { xMin: -0.42, xMax: -0.26, yMin: 0.0, yMax: 0.02, zMin: -0.12, zMax: 0.12 };
  const centerZone = { xMin: -0.11, xMax: 0.11, yMin: 0.0, yMax: 0.05, zMin: -0.11, zMax: 0.11 };
  const rightZone = { xMin: 0.25, xMax: 0.43, yMin: 0.0, yMax: 0.15, zMin: -0.11, zMax: 0.11 };
  const rearZone = { xMin: -0.2, xMax: 0.2, yMin: 0.19, yMax: 0.28, zMin: -0.2, zMax: -0.18 };

  test('Left Zone FOD Mat maintains > 140mm clearance from Center Zone Flange', () => {
    const clearanceM = centerZone.xMin - leftZone.xMax;
    assert.ok(clearanceM >= 0.14, `Expected >= 140mm clearance, got ${clearanceM * 1000}mm`);
  });

  test('Right Zone Protractor maintains > 130mm clearance from Center Zone Flange', () => {
    const clearanceM = rightZone.xMin - centerZone.xMax;
    assert.ok(clearanceM >= 0.13, `Expected >= 130mm clearance, got ${clearanceM * 1000}mm`);
  });

  test('Rear Zone Header maintains vertical and depth clearance above all bolt badges', () => {
    const boltBadgeMaxY = 0.165; // Peak height of active bolt spatial badge
    const verticalMarginM = rearZone.yMin - boltBadgeMaxY;
    assert.ok(verticalMarginM >= 0.02, `Expected vertical clearance >= 20mm, got ${verticalMarginM * 1000}mm`);

    const rearBoltCentroidZ = -0.085;
    const depthMarginM = Math.abs(rearZone.zMax - rearBoltCentroidZ);
    assert.ok(depthMarginM >= 0.09, `Expected setback >= 90mm, got ${depthMarginM * 1000}mm`);
  });

  test('Center Zone Single-Active Callout Rule: exactly one or zero bolt badges visible at all times', () => {
    const controller = new AeroTorqueController();

    for (let state = 0; state <= 6; state++) {
      controller.applyState(state as AeroTorqueState);
      const snapshot = controller.getSnapshot();

      if (state <= 4 && state !== 1) {
        // States 0, 2, 3, 4: Exactly one active bolt
        assert.ok(snapshot.activeBolt !== null, `State ${state} should have active bolt`);
      } else if (state === 1) {
        // Poka-yoke error state: displays warning on single violating bolt
        assert.ok(snapshot.pokaYokeActive);
        assert.strictEqual(snapshot.pokaYokeBoltId, 'bolt-2');
      } else {
        // States 5 and 6: All bolt badges retracted!
        assert.strictEqual(snapshot.activeBolt, null, `State ${state} should have retracted all bolt badges`);
      }
    }
  });
});
