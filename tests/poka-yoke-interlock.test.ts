import { test, describe } from 'node:test';
import assert from 'node:assert';
import { StarSequenceEngine } from '../Assets/Scripts/StarSequenceEngine.js';

describe('Poka-Yoke Interlock Tests', () => {
  test('Rejects adjacent bolt tightening attempt with ADJACENT_BOLT_WARP_RISK', () => {
    const engine = new StarSequenceEngine();
    // Bolt 1 is active. User reaches for adjacent Bolt 2 (NE)
    const result = engine.validateAndTorqueBolt('bolt-2');

    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.pokaYokeRisk, 'ADJACENT_BOLT_WARP_RISK');
    assert.ok(result.reason?.includes('FLANGE WARP RISK'));
    assert.strictEqual(result.targetBoltId, 'bolt-1');
  });

  test('Rejects re-torquing already locked bolts', () => {
    const engine = new StarSequenceEngine();
    engine.validateAndTorqueBolt('bolt-1'); // Locked!

    // Try to re-torque Bolt 1
    const reResult = engine.validateAndTorqueBolt('bolt-1');
    assert.strictEqual(reResult.allowed, false);
    assert.ok(reResult.reason?.includes('already locked'));
  });

  test('Poka-yoke does not block when the correct diagonal bolt is torqued', () => {
    const engine = new StarSequenceEngine();
    engine.validateAndTorqueBolt('bolt-1'); // Bolt 1 locked

    // Target is now Bolt 4 (SE). Attempting Bolt 4 should be allowed.
    const result = engine.validateAndTorqueBolt('bolt-4');
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.pokaYokeRisk, undefined);
  });
});
