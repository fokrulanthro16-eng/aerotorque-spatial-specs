/**
 * ParabolicArcGenerator.ts
 * Procedurally generates 3D quadratic Bézier parabolic spline arcs
 * and animated directional chevrons connecting active to queued diagonal bolts.
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface SplineSample {
  position: Vector3;
  tangent: Vector3;
  t: number;
}

export class ParabolicArcGenerator {
  public static readonly APEX_HEIGHT: number = 0.095; // 95mm tabletop elevation

  /**
   * Evaluates a point along a quadratic Bézier curve at parameter t in [0, 1].
   */
  public static evaluateBezierPoint(p0: Vector3, pMid: Vector3, p1: Vector3, t: number): Vector3 {
    const oneMinusT = 1 - t;
    const oneMinusTSq = oneMinusT * oneMinusT;
    const twoOneMinusTT = 2 * oneMinusT * t;
    const tSq = t * t;

    return {
      x: oneMinusTSq * p0.x + twoOneMinusTT * pMid.x + tSq * p1.x,
      y: oneMinusTSq * p0.y + twoOneMinusTT * pMid.y + tSq * p1.y,
      z: oneMinusTSq * p0.z + twoOneMinusTT * pMid.z + tSq * p1.z,
    };
  }

  /**
   * Evaluates the first derivative (tangent vector) along the quadratic Bézier curve.
   */
  public static evaluateBezierTangent(p0: Vector3, pMid: Vector3, p1: Vector3, t: number): Vector3 {
    // dP/dt = 2*(1-t)*(pMid - p0) + 2*t*(p1 - pMid)
    const factor0 = 2 * (1 - t);
    const factor1 = 2 * t;

    const tx = factor0 * (pMid.x - p0.x) + factor1 * (p1.x - pMid.x);
    const ty = factor0 * (pMid.y - p0.y) + factor1 * (p1.y - pMid.y);
    const tz = factor0 * (pMid.z - p0.z) + factor1 * (p1.z - pMid.z);

    const len = Math.hypot(tx, ty, tz) || 1.0;
    return { x: tx / len, y: ty / len, z: tz / len };
  }

  /**
   * Generates a discrete set of points along the 3D parabolic arc between p0 and p1.
   */
  public static generateArcSamples(p0: Vector3, p1: Vector3, numSegments: number = 24): SplineSample[] {
    // Midpoint elevated to APEX_HEIGHT
    const pMid: Vector3 = {
      x: (p0.x + p1.x) / 2,
      y: this.APEX_HEIGHT,
      z: (p0.z + p1.z) / 2,
    };

    const samples: SplineSample[] = [];
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      samples.push({
        position: this.evaluateBezierPoint(p0, pMid, p1, t),
        tangent: this.evaluateBezierTangent(p0, pMid, p1, t),
        t,
      });
    }

    return samples;
  }

  /**
   * Calculates animated chevron positions along the arc given an animation time offset.
   */
  public static getAnimatedChevronPositions(
    p0: Vector3,
    p1: Vector3,
    timeSeconds: number,
    numChevrons: number = 3,
    speed: number = 0.5
  ): SplineSample[] {
    const pMid: Vector3 = {
      x: (p0.x + p1.x) / 2,
      y: this.APEX_HEIGHT,
      z: (p0.z + p1.z) / 2,
    };

    const chevrons: SplineSample[] = [];
    for (let i = 0; i < numChevrons; i++) {
      // Space chevrons out and shift forward with time
      const offset = i / numChevrons;
      const t = (timeSeconds * speed + offset) % 1.0;
      chevrons.push({
        position: this.evaluateBezierPoint(p0, pMid, p1, t),
        tangent: this.evaluateBezierTangent(p0, pMid, p1, t),
        t,
      });
    }

    return chevrons;
  }
}
