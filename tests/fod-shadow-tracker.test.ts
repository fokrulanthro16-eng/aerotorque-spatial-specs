import { test, describe } from 'node:test';
import assert from 'node:assert';
import { FodShadowTracker } from '../Assets/Scripts/FodShadowTracker.js';

describe('FodShadowTracker Tests', () => {
  test('Initial state reflects torque wrench in hand and pin stowed', () => {
    const tracker = new FodShadowTracker();
    assert.strictEqual(tracker.isSlotOccupied('slot-a-wrench'), false);
    assert.strictEqual(tracker.isSlotOccupied('slot-b-pin'), true);
    assert.strictEqual(tracker.isZeroFodCompliant(), false);

    const status = tracker.getStatusDisplay();
    assert.strictEqual(status.isClear, false);
    assert.strictEqual(status.colorHex, '#FFB300'); // Amber
    assert.ok(status.text.includes('WRENCH IN HAND'));
  });

  test('Stowing torque wrench in Slot A enables Zero-FOD compliance', () => {
    const tracker = new FodShadowTracker();
    tracker.setToolOccupied('slot-a-wrench', true);

    assert.strictEqual(tracker.isSlotOccupied('slot-a-wrench'), true);
    assert.strictEqual(tracker.isZeroFodCompliant(), true);

    const status = tracker.getStatusDisplay();
    assert.strictEqual(status.isClear, true);
    assert.strictEqual(status.colorHex, '#00E676'); // Emerald
    assert.ok(status.text.includes('ALL TOOLS STOWED'));
  });

  test('Removing rigging pin breaks Zero-FOD compliance', () => {
    const tracker = new FodShadowTracker();
    tracker.setToolOccupied('slot-a-wrench', true);
    tracker.setToolOccupied('slot-b-pin', false);

    assert.strictEqual(tracker.isZeroFodCompliant(), false);
  });
});
