/**
 * StarSequenceEngine.ts
 * Enforces FAA standard cross-star torquing sequence on 4-bolt propulsion flange mount.
 * Prevents adjacent-bolt torquing to eliminate micro-warping of the mounting surface.
 */

export interface BoltDefinition {
  id: string;
  name: string;
  quadrant: 'NW' | 'SE' | 'NE' | 'SW';
  position: { x: number; y: number; z: number };
  targetTorqueNm: number;
  sequenceStep: number; // 1 to 4
  isLocked: boolean;
  actualTorqueNm: number;
}

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  pokaYokeRisk?: string;
  targetBoltId: string;
}

export class StarSequenceEngine {
  public bolts: BoltDefinition[] = [
    {
      id: 'bolt-1',
      name: 'Bolt #1 (NW)',
      quadrant: 'NW',
      position: { x: -0.085, y: 0.025, z: -0.085 },
      targetTorqueNm: 12.5,
      sequenceStep: 1,
      isLocked: false,
      actualTorqueNm: 0,
    },
    {
      id: 'bolt-4',
      name: 'Bolt #4 (SE)',
      quadrant: 'SE',
      position: { x: 0.085, y: 0.025, z: 0.085 },
      targetTorqueNm: 12.5,
      sequenceStep: 2,
      isLocked: false,
      actualTorqueNm: 0,
    },
    {
      id: 'bolt-2',
      name: 'Bolt #2 (NE)',
      quadrant: 'NE',
      position: { x: 0.085, y: 0.025, z: -0.085 },
      targetTorqueNm: 12.5,
      sequenceStep: 3,
      isLocked: false,
      actualTorqueNm: 0,
    },
    {
      id: 'bolt-3',
      name: 'Bolt #3 (SW)',
      quadrant: 'SW',
      position: { x: -0.085, y: 0.025, z: 0.085 },
      targetTorqueNm: 12.5,
      sequenceStep: 4,
      isLocked: false,
      actualTorqueNm: 0,
    },
  ];

  private currentSequenceIndex: number = 0; // index in this.bolts array (0 = step 1)

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.currentSequenceIndex = 0;
    for (const b of this.bolts) {
      b.isLocked = false;
      b.actualTorqueNm = 0;
    }
  }

  public getActiveBolt(): BoltDefinition | null {
    if (this.currentSequenceIndex >= this.bolts.length) {
      return null;
    }
    return this.bolts[this.currentSequenceIndex];
  }

  public getNextDiagonalBolt(): BoltDefinition | null {
    if (this.currentSequenceIndex + 1 >= this.bolts.length) {
      return null;
    }
    return this.bolts[this.currentSequenceIndex + 1];
  }

  public getLockedBolts(): BoltDefinition[] {
    return this.bolts.filter((b) => b.isLocked);
  }

  public getClampingSymmetryPercent(): number {
    const lockedCount = this.bolts.filter((b) => b.isLocked).length;
    return (lockedCount / this.bolts.length) * 100;
  }

  public isComplete(): boolean {
    return this.bolts.every((b) => b.isLocked);
  }

  /**
   * Validates whether an interaction with a given bolt is allowed under the star pattern.
   * If an adjacent bolt is probed out of sequence, triggers a poka-yoke rejection.
   */
  public validateAndTorqueBolt(boltId: string): ValidationResult {
    const active = this.getActiveBolt();
    if (!active) {
      return {
        allowed: false,
        reason: 'All bolts locked to 100% preload spec.',
        targetBoltId: '',
      };
    }

    if (boltId === active.id) {
      // Correct active target! Lock it.
      active.isLocked = true;
      active.actualTorqueNm = active.targetTorqueNm;
      this.currentSequenceIndex++;
      return {
        allowed: true,
        reason: `Bolt ${active.name} tightened to ${active.targetTorqueNm} N·m.`,
        targetBoltId: active.id,
      };
    }

    // Check if the probed bolt is already locked
    const probed = this.bolts.find((b) => b.id === boltId);
    if (probed && probed.isLocked) {
      return {
        allowed: false,
        reason: `${probed.name} already locked at ${probed.actualTorqueNm} N·m.`,
        targetBoltId: active.id,
      };
    }

    // Probed bolt is out-of-sequence!
    return {
      allowed: false,
      reason: `OUT-OF-SEQUENCE BLOCKED: FLANGE WARP RISK. Follow diagonal star arc to ${active.name}.`,
      pokaYokeRisk: 'ADJACENT_BOLT_WARP_RISK',
      targetBoltId: active.id,
    };
  }

  /**
   * Allows fast-forwarding or setting state for deterministic LEAF / test runs.
   */
  public setSequenceStep(step: number): void {
    this.reset();
    for (let i = 0; i < step && i < this.bolts.length; i++) {
      this.bolts[i].isLocked = true;
      this.bolts[i].actualTorqueNm = this.bolts[i].targetTorqueNm;
    }
    this.currentSequenceIndex = Math.min(step, this.bolts.length);
  }
}
