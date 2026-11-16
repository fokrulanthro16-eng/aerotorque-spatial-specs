/**
 * SpatialInputHandler.ts
 * Manages 21-joint 3D Hand Tracking pinch detection and interactive preview fallbacks.
 * Enforces 18.0 mm pinch distance threshold with 250 ms temporal debounce.
 */

export interface HandJointPosition {
  x: number;
  y: number;
  z: number;
}

export interface PinchEvent {
  isPinching: boolean;
  distanceMm: number;
  timestampMs: number;
}

export class SpatialInputHandler {
  public static readonly PINCH_THRESHOLD_MM: number = 18.0; // 18 mm threshold
  public static readonly DEBOUNCE_TIME_MS: number = 250; // 250 ms debounce window

  private lastPinchTimestampMs: number = 0;
  private isCurrentlyPinching: boolean = false;

  /**
   * Calculates Euclidean distance between thumb tip and index tip in millimeters.
   */
  public static calculateTipDistanceMm(thumbTip: HandJointPosition, indexTip: HandJointPosition): number {
    const dx = (thumbTip.x - indexTip.x) * 1000;
    const dy = (thumbTip.y - indexTip.y) * 1000;
    const dz = (thumbTip.z - indexTip.z) * 1000;
    return Math.hypot(dx, dy, dz);
  }

  /**
   * Processes hand tracking frame for 21-joint hand model.
   * Returns a valid PinchEvent if a debounced pinch has just commenced.
   */
  public processHandFrame(
    thumbTip: HandJointPosition,
    indexTip: HandJointPosition,
    currentTimestampMs: number
  ): { didTriggerPinch: boolean; distanceMm: number } {
    const distanceMm = SpatialInputHandler.calculateTipDistanceMm(thumbTip, indexTip);
    const belowThreshold = distanceMm < SpatialInputHandler.PINCH_THRESHOLD_MM;

    if (belowThreshold && !this.isCurrentlyPinching) {
      if (currentTimestampMs - this.lastPinchTimestampMs >= SpatialInputHandler.DEBOUNCE_TIME_MS) {
        this.lastPinchTimestampMs = currentTimestampMs;
        this.isCurrentlyPinching = true;
        return { didTriggerPinch: true, distanceMm };
      }
    } else if (!belowThreshold) {
      this.isCurrentlyPinching = false;
    }

    return { didTriggerPinch: false, distanceMm };
  }

  /**
   * Allows simulated click / keyboard tap to trigger a synthetic pinch event in preview.
   */
  public triggerSyntheticPinch(currentTimestampMs: number): boolean {
    if (currentTimestampMs - this.lastPinchTimestampMs >= SpatialInputHandler.DEBOUNCE_TIME_MS) {
      this.lastPinchTimestampMs = currentTimestampMs;
      return true;
    }
    return false;
  }
}
