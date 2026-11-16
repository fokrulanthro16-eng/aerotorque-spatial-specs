/**
 * OpticalProtractorRig.ts
 * Manages the 1:1 true-scale 3D Optical Protractor, dual-ring sightline reticle,
 * and articulated UAV control flap deflection sweep.
 */

export interface OpticalAlignmentStatus {
  isAligned: boolean;
  angularParallaxDeg: number;
  toleranceMet: boolean;
}

export class OpticalProtractorRig {
  public static readonly ARC_RADIUS_M: number = 0.12; // 120mm radius
  public static readonly MIN_ANGLE_DEG: number = -15.0;
  public static readonly MAX_ANGLE_DEG: number = 15.0;
  public static readonly TARGET_DEFLECTION_DEG: number = 15.0;
  public static readonly TOLERANCE_DEG: number = 0.2; // FAA Part 23/108 ±0.2°
  public static readonly RETICLE_SEPARATION_M: number = 0.04; // 40mm between front & rear ring

  private currentFlapDeflectionDeg: number = 0.0;
  private isProtractorIlluminated: boolean = false;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.currentFlapDeflectionDeg = 0.0;
    this.isProtractorIlluminated = false;
  }

  public setIlluminated(illuminated: boolean): void {
    this.isProtractorIlluminated = illuminated;
  }

  public getIsIlluminated(): boolean {
    return this.isProtractorIlluminated;
  }

  public setFlapDeflection(angleDeg: number): void {
    this.currentFlapDeflectionDeg = Math.max(
      OpticalProtractorRig.MIN_ANGLE_DEG,
      Math.min(OpticalProtractorRig.MAX_ANGLE_DEG, angleDeg)
    );
  }

  public getFlapDeflection(): number {
    return this.currentFlapDeflectionDeg;
  }

  /**
   * Evaluates whether the sightline is aligned coaxial to the dual-ring reticle.
   * eyeOffsetM: lateral displacement from the reticle optical axis in meters.
   */
  public evaluateParallaxAlignment(eyeOffsetM: number): OpticalAlignmentStatus {
    const angularParallaxRad = Math.atan(eyeOffsetM / OpticalProtractorRig.RETICLE_SEPARATION_M);
    const angularParallaxDeg = Math.abs((angularParallaxRad * 180) / Math.PI);

    const isAligned = angularParallaxDeg <= OpticalProtractorRig.TOLERANCE_DEG;
    const deflectionErrorDeg = Math.abs(this.currentFlapDeflectionDeg - OpticalProtractorRig.TARGET_DEFLECTION_DEG);
    const toleranceMet = isAligned && deflectionErrorDeg <= OpticalProtractorRig.TOLERANCE_DEG;

    return {
      isAligned,
      angularParallaxDeg,
      toleranceMet,
    };
  }

  /**
   * Generates vernier arc tick marks for 1:1 3D visualization.
   */
  public getVernierTicks(stepDeg: number = 1.0): { angleDeg: number; isMajor: boolean; label?: string }[] {
    const ticks: { angleDeg: number; isMajor: boolean; label?: string }[] = [];
    for (let a = OpticalProtractorRig.MIN_ANGLE_DEG; a <= OpticalProtractorRig.MAX_ANGLE_DEG; a += stepDeg) {
      const isMajor = a === -15 || a === 0 || a === 15;
      const label = isMajor ? (a > 0 ? `+${a.toFixed(1)}°` : `${a.toFixed(1)}°`) : undefined;
      ticks.push({
        angleDeg: a,
        isMajor,
        label,
      });
    }
    return ticks;
  }
}
