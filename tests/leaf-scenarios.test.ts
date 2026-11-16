import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AeroTorqueController, AeroTorqueState } from '../Assets/Scripts/AeroTorqueController.js';

describe('LEAF End-to-End Operational Scenarios', () => {
  test('Scenario 1: State 0 - Bolt #1 Target Initial Activation', () => {
    const controller = new AeroTorqueController();
    controller.applyState(AeroTorqueState.STATE_0_BOLT1_TARGET);
    const snap = controller.getSnapshot();

    assert.strictEqual(snap.stateIndex, AeroTorqueState.STATE_0_BOLT1_TARGET);
    assert.strictEqual(snap.activeBolt?.id, 'bolt-1');
    assert.strictEqual(snap.queuedBolt?.id, 'bolt-4');
    assert.strictEqual(snap.clampingSymmetryPercent, 0);
    assert.strictEqual(snap.fodAllStowed, false);
    assert.strictEqual(snap.airworthyStampActive, false);
    assert.ok(snap.guidanceArc !== null);
  });

  test('Scenario 2: State 1 - Poka-Yoke Flange Warp Rejection Demo', () => {
    const controller = new AeroTorqueController();
    controller.triggerPokaYokeError();
    const snap = controller.getSnapshot();

    assert.strictEqual(snap.stateIndex, AeroTorqueState.STATE_1_POKA_YOKE_DEMO);
    assert.strictEqual(snap.pokaYokeActive, true);
    assert.strictEqual(snap.pokaYokeBoltId, 'bolt-2');
    assert.ok(snap.pokaYokeMessage?.includes('FLANGE WARP RISK'));
    assert.strictEqual(snap.clampingSymmetryPercent, 0);
  });

  test('Scenario 3: State 2 - Bolt #1 Locked -> Bolt #4 Target (25% Preload)', () => {
    const controller = new AeroTorqueController();
    controller.applyState(AeroTorqueState.STATE_2_BOLT4_TARGET);
    const snap = controller.getSnapshot();

    assert.strictEqual(snap.stateIndex, AeroTorqueState.STATE_2_BOLT4_TARGET);
    assert.strictEqual(snap.activeBolt?.id, 'bolt-4');
    assert.strictEqual(snap.queuedBolt?.id, 'bolt-2');
    assert.strictEqual(snap.clampingSymmetryPercent, 25);
    assert.strictEqual(snap.lockedBolts.length, 1);
    assert.strictEqual(snap.lockedBolts[0].id, 'bolt-1');
  });

  test('Scenario 4: State 3 - Bolt #4 Locked -> Bolt #2 Target (50% Preload)', () => {
    const controller = new AeroTorqueController();
    controller.applyState(AeroTorqueState.STATE_3_BOLT2_TARGET);
    const snap = controller.getSnapshot();

    assert.strictEqual(snap.stateIndex, AeroTorqueState.STATE_3_BOLT2_TARGET);
    assert.strictEqual(snap.activeBolt?.id, 'bolt-2');
    assert.strictEqual(snap.queuedBolt?.id, 'bolt-3');
    assert.strictEqual(snap.clampingSymmetryPercent, 50);
    assert.strictEqual(snap.lockedBolts.length, 2);
  });

  test('Scenario 5: State 4 - Bolt #2 Locked -> Bolt #3 Target (75% Preload)', () => {
    const controller = new AeroTorqueController();
    controller.applyState(AeroTorqueState.STATE_4_BOLT3_TARGET);
    const snap = controller.getSnapshot();

    assert.strictEqual(snap.stateIndex, AeroTorqueState.STATE_4_BOLT3_TARGET);
    assert.strictEqual(snap.activeBolt?.id, 'bolt-3');
    assert.strictEqual(snap.queuedBolt, null);
    assert.strictEqual(snap.clampingSymmetryPercent, 75);
    assert.strictEqual(snap.lockedBolts.length, 3);
  });

  test('Scenario 6: State 5 - Stage 2: 1:1 Optical Protractor & +15.0° Deflection', () => {
    const controller = new AeroTorqueController();
    controller.applyState(AeroTorqueState.STATE_5_OPTICAL_PROTRACTOR);
    const snap = controller.getSnapshot();

    assert.strictEqual(snap.stateIndex, AeroTorqueState.STATE_5_OPTICAL_PROTRACTOR);
    assert.strictEqual(snap.clampingSymmetryPercent, 100);
    assert.strictEqual(snap.activeBolt, null); // Stems retracted!
    assert.strictEqual(snap.opticalProtractorActive, true);
    assert.strictEqual(snap.flapAngleDeg, 15.0);
    assert.strictEqual(snap.opticalAlignment.toleranceMet, true);
  });

  test('Scenario 7: State 6 - Stage 3: FOD Stowed & Airworthy MRO Stamp Verification', () => {
    const controller = new AeroTorqueController();
    controller.applyState(AeroTorqueState.STATE_6_AIRWORTHY_STAMP);
    const snap = controller.getSnapshot();

    assert.strictEqual(snap.stateIndex, AeroTorqueState.STATE_6_AIRWORTHY_STAMP);
    assert.strictEqual(snap.fodAllStowed, true);
    assert.strictEqual(snap.airworthyStampActive, true);
    assert.strictEqual(snap.inspectionHash, AeroTorqueController.DETERMINISTIC_SHA256);
    assert.ok(snap.fodStatusText.includes('ZERO FOD'));
  });
});
