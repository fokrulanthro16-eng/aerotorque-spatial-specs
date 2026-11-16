/**
 * FodShadowTracker.ts
 * Manages the 1:1 FOD Tool Accountability Shadow Mat in the Left Zone.
 * Enforces FAA Part 108 zero-FOD compliance: Airworthiness stamp is hard-locked until tools are stowed.
 */

export interface ToolSlot {
  slotId: 'slot-a-wrench' | 'slot-b-pin';
  name: string;
  isOccupied: boolean;
  dimensionsMm: { width: number; length: number; depth: number };
  worldPosition: { x: number; y: number; z: number };
}

export class FodShadowTracker {
  public slots: ToolSlot[] = [
    {
      slotId: 'slot-a-wrench',
      name: 'Click-Type Torque Wrench (12.5 N·m Calibrated)',
      isOccupied: false, // Initially in technician's hand
      dimensionsMm: { width: 34.0, length: 220.0, depth: 8.0 },
      worldPosition: { x: -0.34, y: 0.006, z: -0.02 },
    },
    {
      slotId: 'slot-b-pin',
      name: 'Rigging Calibration Pin (Ø 6.0 mm)',
      isOccupied: true, // In slot
      dimensionsMm: { width: 8.0, length: 80.0, depth: 8.0 },
      worldPosition: { x: -0.34, y: 0.006, z: 0.08 },
    },
  ];

  constructor() {
    this.reset();
  }

  public reset(): void {
    // Wrench is in hand at start; pin is seated
    this.slots[0].isOccupied = false;
    this.slots[1].isOccupied = true;
  }

  public setToolOccupied(slotId: 'slot-a-wrench' | 'slot-b-pin', occupied: boolean): void {
    const slot = this.slots.find((s) => s.slotId === slotId);
    if (slot) {
      slot.isOccupied = occupied;
    }
  }

  public isSlotOccupied(slotId: 'slot-a-wrench' | 'slot-b-pin'): boolean {
    const slot = this.slots.find((s) => s.slotId === slotId);
    return slot ? slot.isOccupied : false;
  }

  /**
   * Returns true only when 100% of tools are seated in their respective shadow slots.
   */
  public isZeroFodCompliant(): boolean {
    return this.slots.every((s) => s.isOccupied);
  }

  /**
   * Returns status text and color badge for the flush front-edge status bar.
   */
  public getStatusDisplay(): { text: string; colorHex: string; isClear: boolean } {
    if (this.isZeroFodCompliant()) {
      return {
        text: 'FOD SHADOW MAT: ALL TOOLS STOWED — ZERO FOD',
        colorHex: '#00E676', // Emerald
        isClear: true,
      };
    } else {
      return {
        text: 'FOD SHADOW MAT: WRENCH IN HAND (ACTIVE MRO)',
        colorHex: '#FFB300', // Amber
        isClear: false,
      };
    }
  }
}
