import { test, describe } from 'node:test';
import assert from 'node:assert';
import { StarSequenceEngine } from '../Assets/Scripts/StarSequenceEngine.js';

describe('StarSequenceEngine Tests', () => {
  test('Enforces cross-star sequence: Bolt 1 (NW) -> Bolt 4 (SE) -> Bolt 2 (NE) -> Bolt 3 (SW)', () => {
    const engine = new StarSequenceEngine();

    // Step 1: Bolt 1 NW
    const active0 = engine.getActiveBolt();
    assert.strictEqual(active0?.id, 'bolt-1');
    assert.strictEqual(active0?.quadrant, 'NW');
    assert.strictEqual(active0?.targetTorqueNm, 12.5);

    const next0 = engine.getNextDiagonalBolt();
    assert.strictEqual(next0?.id, 'bolt-4');
    assert.strictEqual(next0?.quadrant, 'SE'); // True diagonal opposite

    // Step 2: Confirm Bolt 1 -> Next is Bolt 4
    const res1 = engine.validateAndTorqueBolt('bolt-1');
    assert.strictEqual(res1.allowed, true);
    assert.strictEqual(engine.getActiveBolt()?.id, 'bolt-4');
    assert.strictEqual(engine.getNextDiagonalBolt()?.id, 'bolt-2');

    // Step 3: Confirm Bolt 4 -> Next is Bolt 2
    const res4 = engine.validateAndTorqueBolt('bolt-4');
    assert.strictEqual(res4.allowed, true);
    assert.strictEqual(engine.getActiveBolt()?.id, 'bolt-2');
    assert.strictEqual(engine.getNextDiagonalBolt()?.id, 'bolt-3');

    // Step 4: Confirm Bolt 2 -> Next is Bolt 3
    const res2 = engine.validateAndTorqueBolt('bolt-2');
    assert.strictEqual(res2.allowed, true);
    assert.strictEqual(engine.getActiveBolt()?.id, 'bolt-3');
    assert.strictEqual(engine.getNextDiagonalBolt(), null);

    // Step 5: Confirm Bolt 3 -> Completed
    const res3 = engine.validateAndTorqueBolt('bolt-3');
    assert.strictEqual(res3.allowed, true);
    assert.strictEqual(engine.getActiveBolt(), null);
    assert.strictEqual(engine.isComplete(), true);
  });

  test('Increments clamping load symmetry percent deterministically (25% -> 50% -> 75% -> 100%)', () => {
    const engine = new StarSequenceEngine();
    assert.strictEqual(engine.getClampingSymmetryPercent(), 0);

    engine.validateAndTorqueBolt('bolt-1');
    assert.strictEqual(engine.getClampingSymmetryPercent(), 25);

    engine.validateAndTorqueBolt('bolt-4');
    assert.strictEqual(engine.getClampingSymmetryPercent(), 50);

    engine.validateAndTorqueBolt('bolt-2');
    assert.strictEqual(engine.getClampingSymmetryPercent(), 75);

    engine.validateAndTorqueBolt('bolt-3');
    assert.strictEqual(engine.getClampingSymmetryPercent(), 100);
  });

  test('setSequenceStep allows direct fast-forwarding for LEAF tests', () => {
    const engine = new StarSequenceEngine();
    engine.setSequenceStep(2);
    assert.strictEqual(engine.getClampingSymmetryPercent(), 50);
    assert.strictEqual(engine.getActiveBolt()?.id, 'bolt-2');
    assert.strictEqual(engine.getLockedBolts().length, 2);
  });
});
