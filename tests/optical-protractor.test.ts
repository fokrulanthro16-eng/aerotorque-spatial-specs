import { test, describe } from 'node:test';
import assert from 'node:assert';
import { OpticalProtractorRig } from '../Assets/Scripts/OpticalProtractorRig.js';

describe('OpticalProtractorRig Tests', () => {
  test('Generates full vernier ticks from -15° to +15° with major ticks', () => {
    const rig = new OpticalProtractorRig();
    const ticks = rig.getVernierTicks(1.0);

    assert.strictEqual(ticks.length, 31); // -15 to +15 inclusive
    const tickNeg15 = ticks.find((t) => t.angleDeg === -15);
    const tick0 = ticks.find((t) => t.angleDeg === 0);
    const tickPos15 = ticks.find((t) => t.angleDeg === 15);

    assert.ok(tickNeg15?.isMajor);
    assert.strictEqual(tickNeg15?.label, '-15.0°');
    assert.ok(tick0?.isMajor);
    assert.strictEqual(tick0?.label, '0.0°');
    assert.ok(tickPos15?.isMajor);
    assert.strictEqual(tickPos15?.label, '+15.0°');
  });

  test('Clamps flap deflection within mechanical limits [-15.0°, +15.0°]', () => {
    const rig = new OpticalProtractorRig();
    rig.setFlapDeflection(25.0);
    assert.strictEqual(rig.getFlapDeflection(), 15.0);

    rig.setFlapDeflection(-30.0);
    assert.strictEqual(rig.getFlapDeflection(), -15.0);

    rig.setFlapDeflection(15.0);
    assert.strictEqual(rig.getFlapDeflection(), 15.0);
  });

  test('Dual-ring reticle verifies alignment and flags parallax misalignment', () => {
    const rig = new OpticalProtractorRig();
    rig.setFlapDeflection(15.0);

    // Lateral eye offset of 0.10 mm (small -> aligned)
    const alignedStatus = rig.evaluateParallaxAlignment(0.0001);
    assert.strictEqual(alignedStatus.isAligned, true);
    assert.strictEqual(alignedStatus.toleranceMet, true);
    assert.ok(alignedStatus.angularParallaxDeg <= 0.2);

    // Lateral eye offset of 5.0 mm (large -> out of alignment)
    const misalignedStatus = rig.evaluateParallaxAlignment(0.005);
    assert.strictEqual(misalignedStatus.isAligned, false);
    assert.strictEqual(misalignedStatus.toleranceMet, false);
    assert.ok(misalignedStatus.angularParallaxDeg > 0.2);
  });
});
