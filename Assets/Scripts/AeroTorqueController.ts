/**
 * AeroTorqueController.ts
 * Master 7-State Deterministic Coordinator for AeroTorque Spatial on Snap SPECS.
 * Orchestrates star-pattern torquing, poka-yoke flange warp interlock,
 * 1:1 optical protractor deflection, and FOD safety certification.
 */

import { StarSequenceEngine, BoltDefinition, ValidationResult } from './StarSequenceEngine.js';
import { ParabolicArcGenerator, SplineSample, Vector3 } from './ParabolicArcGenerator.js';
import { OpticalProtractorRig, OpticalAlignmentStatus } from './OpticalProtractorRig.js';
import { FodShadowTracker } from './FodShadowTracker.js';
import { SpatialInputHandler } from './SpatialInputHandler.js';

export enum AeroTorqueState {
  STATE_0_BOLT1_TARGET = 0,
  STATE_1_POKA_YOKE_DEMO = 1,
  STATE_2_BOLT4_TARGET = 2,
  STATE_3_BOLT2_TARGET = 3,
  STATE_4_BOLT3_TARGET = 4,
  STATE_5_OPTICAL_PROTRACTOR = 5,
  STATE_6_AIRWORTHY_STAMP = 6,
}

export interface StateSnapshot {
  stateIndex: AeroTorqueState;
  stateName: string;
  stageName: string;
  activeBolt: BoltDefinition | null;
  queuedBolt: BoltDefinition | null;
  lockedBolts: BoltDefinition[];
  clampingSymmetryPercent: number;
  pokaYokeActive: boolean;
  pokaYokeBoltId: string | null;
  pokaYokeMessage: string | null;
  opticalProtractorActive: boolean;
  flapAngleDeg: number;
  opticalAlignment: OpticalAlignmentStatus;
  fodAllStowed: boolean;
  fodStatusText: string;
  airworthyStampActive: boolean;
  inspectionHash: string | null;
  guidanceArc: SplineSample[] | null;
}

export class AeroTorqueController {
  public starEngine: StarSequenceEngine;
  public arcGen: typeof ParabolicArcGenerator;
  public protractorRig: OpticalProtractorRig;
  public fodTracker: FodShadowTracker;
  public inputHandler: SpatialInputHandler;

  private currentState: AeroTorqueState = AeroTorqueState.STATE_0_BOLT1_TARGET;
  private pokaYokeViolatingBoltId: string | null = null;
  private pokaYokeWarningMsg: string | null = null;

  public static readonly DETERMINISTIC_SHA256: string =
    '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';

  constructor() {
    this.starEngine = new StarSequenceEngine();
    this.arcGen = ParabolicArcGenerator;
    this.protractorRig = new OpticalProtractorRig();
    this.fodTracker = new FodShadowTracker();
    this.inputHandler = new SpatialInputHandler();

    this.applyState(AeroTorqueState.STATE_0_BOLT1_TARGET);
  }

  public getCurrentState(): AeroTorqueState {
    return this.currentState;
  }

  /**
   * Applies one of the 7 deterministic states cleanly and predictably.
   */
  public applyState(state: AeroTorqueState): void {
    this.currentState = state;
    this.pokaYokeViolatingBoltId = null;
    this.pokaYokeWarningMsg = null;

    switch (state) {
      case AeroTorqueState.STATE_0_BOLT1_TARGET:
        this.starEngine.setSequenceStep(0); // Bolt 1 active, 0 locked
        this.protractorRig.reset();
        this.fodTracker.reset(); // Wrench in hand
        break;

      case AeroTorqueState.STATE_1_POKA_YOKE_DEMO:
        this.starEngine.setSequenceStep(0); // Bolt 1 is the rightful target
        this.pokaYokeViolatingBoltId = 'bolt-2'; // Simulating adjacent Bolt 2 probe
        this.pokaYokeWarningMsg =
          'OUT-OF-SEQUENCE BLOCKED: FLANGE WARP RISK. Follow diagonal star arc to Bolt #4 (SE).';
        this.protractorRig.reset();
        this.fodTracker.reset();
        break;

      case AeroTorqueState.STATE_2_BOLT4_TARGET:
        this.starEngine.setSequenceStep(1); // Bolt 1 locked (25%), Bolt 4 active
        this.protractorRig.reset();
        this.fodTracker.reset();
        break;

      case AeroTorqueState.STATE_3_BOLT2_TARGET:
        this.starEngine.setSequenceStep(2); // Bolt 1 & 4 locked (50%), Bolt 2 active
        this.protractorRig.reset();
        this.fodTracker.reset();
        break;

      case AeroTorqueState.STATE_4_BOLT3_TARGET:
        this.starEngine.setSequenceStep(3); // Bolt 1, 4, 2 locked (75%), Bolt 3 active
        this.protractorRig.reset();
        this.fodTracker.reset();
        break;

      case AeroTorqueState.STATE_5_OPTICAL_PROTRACTOR:
        this.starEngine.setSequenceStep(4); // All 4 bolts locked (100% Preload)
        this.protractorRig.setIlluminated(true);
        this.protractorRig.setFlapDeflection(15.0); // +15.0° verified deflection
        this.fodTracker.reset(); // Wrench still in hand
        break;

      case AeroTorqueState.STATE_6_AIRWORTHY_STAMP:
        this.starEngine.setSequenceStep(4); // 100% Preload
        this.protractorRig.setIlluminated(true);
        this.protractorRig.setFlapDeflection(15.0);
        this.fodTracker.setToolOccupied('slot-a-wrench', true); // Wrench stowed -> ZERO FOD
        break;
    }
  }

  /**
   * Advances sequentially to the next state (wraps or caps at State 6).
   */
  public advanceNext(): void {
    if (this.currentState < AeroTorqueState.STATE_6_AIRWORTHY_STAMP) {
      this.applyState(this.currentState + 1);
    }
  }

  public stepPrevious(): void {
    if (this.currentState > AeroTorqueState.STATE_0_BOLT1_TARGET) {
      this.applyState(this.currentState - 1);
    }
  }

  /**
   * Simulates an intentional or accidental adjacent-bolt probe to demo Poka-Yoke error handling.
   */
  public triggerPokaYokeError(): void {
    this.applyState(AeroTorqueState.STATE_1_POKA_YOKE_DEMO);
  }

  /**
   * Executes a user pinch confirmation on the current active item.
   */
  public handlePinchAction(): void {
    if (this.currentState === AeroTorqueState.STATE_1_POKA_YOKE_DEMO) {
      // Pinching clears error and guides back to Bolt 1 / Bolt 4
      this.applyState(AeroTorqueState.STATE_2_BOLT4_TARGET);
    } else {
      this.advanceNext();
    }
  }

  /**
   * Captures a comprehensive snapshot of the entire spatial scene state.
   */
  public getSnapshot(): StateSnapshot {
    const activeBolt = this.starEngine.getActiveBolt();
    const queuedBolt = this.starEngine.getNextDiagonalBolt();
    const lockedBolts = this.starEngine.getLockedBolts();
    const clampingSymmetryPercent = this.starEngine.getClampingSymmetryPercent();

    let guidanceArc: SplineSample[] | null = null;
    if (activeBolt && queuedBolt) {
      guidanceArc = this.arcGen.generateArcSamples(
        activeBolt.position,
        queuedBolt.position,
        24
      );
    }

    const stageName =
      this.currentState <= AeroTorqueState.STATE_4_BOLT3_TARGET
        ? 'STAGE 1/3: STAR-PATTERN TORQUE SEQUENCER'
        : this.currentState === AeroTorqueState.STATE_5_OPTICAL_PROTRACTOR
        ? 'STAGE 2/3: 1:1 OPTICAL DEFLECTION PROTRACTOR'
        : 'STAGE 3/3: AIRWORTHINESS SIGN-OFF & ZERO FOD';

    const stateNames = [
      'STATE 0: Bolt #1 Target (12.5 N·m) -> Star Arc to Bolt #4',
      'STATE 1: Poka-Yoke Interlock Demo (Bolt #2 Rejected - Flange Warp Risk)',
      'STATE 2: Bolt #1 Locked -> Bolt #4 Target (25% Preload)',
      'STATE 3: Bolt #4 Locked -> Bolt #2 Target (50% Preload)',
      'STATE 4: Bolt #2 Locked -> Bolt #3 Target (75% Preload)',
      'STATE 5: Stage 2 - 1:1 Optical Protractor & Flap Deflection (+15.0° Verified)',
      'STATE 6: Stage 3 - FOD Tools Stowed & 3D Airworthy MRO Stamp Locked',
    ];

    const fodStatus = this.fodTracker.getStatusDisplay();

    return {
      stateIndex: this.currentState,
      stateName: stateNames[this.currentState],
      stageName,
      activeBolt,
      queuedBolt,
      lockedBolts,
      clampingSymmetryPercent,
      pokaYokeActive: this.currentState === AeroTorqueState.STATE_1_POKA_YOKE_DEMO,
      pokaYokeBoltId: this.pokaYokeViolatingBoltId,
      pokaYokeMessage: this.pokaYokeWarningMsg,
      opticalProtractorActive: this.protractorRig.getIsIlluminated(),
      flapAngleDeg: this.protractorRig.getFlapDeflection(),
      opticalAlignment: this.protractorRig.evaluateParallaxAlignment(0.0001), // 0.1mm eye alignment (within 0.14mm threshold)
      fodAllStowed: this.fodTracker.isZeroFodCompliant(),
      fodStatusText: fodStatus.text,
      airworthyStampActive:
        this.currentState === AeroTorqueState.STATE_6_AIRWORTHY_STAMP &&
        this.fodTracker.isZeroFodCompliant(),
      inspectionHash:
        this.currentState === AeroTorqueState.STATE_6_AIRWORTHY_STAMP
          ? AeroTorqueController.DETERMINISTIC_SHA256
          : null,
      guidanceArc,
    };
  }
}
