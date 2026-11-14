/**
 * Pure simulation engine for APEX // CIRCUIT: arcade vehicle physics, drift &
 * nitro boost mechanics, car-to-car collisions, AI racing intelligence, and scoring.
 */

import {
  BOOST_PADS,
  ROAD_HALF_WIDTH,
  SAFE_HALF_WIDTH,
  TOTAL_LAPS,
  TRACK_DATA,
  computeSignedProgressDelta,
  forwardDeltaU,
  forwardFromHeading,
  getTrackSampleAt,
  headingFromTangent,
  normalizeAngle,
  projectPointToTrack,
  wrapU,
} from "./raceTrack.ts";

export interface ControlInput {
  throttle: number; // -1 (reverse/brake) .. +1 (full gas)
  steer: number; // -1 (left) .. +1 (right)
  drift: boolean;
  useBoost: boolean;
}

export interface RacerState {
  id: string;
  name: string;
  tag: string;
  color: string;
  isPlayer: boolean;
  x: number;
  y: number;
  z: number;
  heading: number;
  vx: number;
  vz: number;
  speed: number;
  angularVel: number;
  lateralSlipSpeed: number;
  u: number;
  trackIndex: number;
  lateralOffset: number;
  progress: number;
  lap: number;
  finished: boolean;
  finishTimeMs: number | null;
  bestLapMs: number | null;
  lapStartMs: number;
  boostMeter: number;
  isBoosting: boolean;
  padBoostTimer: number;
  isDrifting: boolean;
  driftCharge: number;
  driftDirection: number;
  driftBoostsCount: number;
  wallHits: number;
  wallContactTimer: number;
  gear: number;
  shiftDipTimer: number;
  isBraking: boolean;
  onCurb: boolean;
  isScrapingWall: boolean;
  scrapeSide: -1 | 0 | 1;
  impactIntensity: number;
  impactShake: number;
  lastImpactX: number;
  lastImpactZ: number;
  lastImpactNx: number;
  lastImpactNz: number;
  steerAngle: number;
  visualRoll: number;
  visualPitch: number;
  wheelSpin: number;
  aiPreferredOffset: number;
  aiBasePace: number;
}

export interface StepCarEvents {
  lapCompleted: boolean;
  justFinished: boolean;
  hitBoostPad: boolean;
  triggeredDriftBurst: boolean;
  hitWall: boolean;
  impactSeverity: number;
  upshifted: boolean;
  downshifted: boolean;
}

export interface RaceScoreInput {
  rank: number;
  totalTimeSeconds: number;
  driftBoostsCount: number;
  wallHits: number;
}

export interface RaceScoreBreakdown {
  total: number;
  rankBonus: number;
  speedBonus: number;
  driftBonus: number;
  cleanDrivingBonus: number;
}

export const CAR_COLLISION_RADIUS = 1.15;
export const BASE_MAX_SPEED = 45;
export const BOOST_MAX_SPEED = 57;

const GEAR_SPEED_THRESHOLDS = [0, 7.5, 14, 21, 28.5, 36.5, 45, 57] as const;
const GEAR_TORQUE_MULTIPLIERS = [1.32, 1.24, 1.14, 1.04, 0.94, 0.84, 0.74] as const;

const RANK_BONUS_BY_POSITION: Record<number, number> = {
  1: 1500,
  2: 950,
  3: 550,
  4: 250,
};

const GRID_SLOTS = [
  {
    id: "ai-kai",
    name: "KAI",
    tag: "VORTEX AI",
    color: "#38bdf8",
    isPlayer: false,
    u: 0.9965,
    lateral: -3.6,
    aiPreferredOffset: -4.2,
    aiBasePace: 0.965,
  },
  {
    id: "ai-nova",
    name: "NOVA",
    tag: "APEX AI",
    color: "#a855f7",
    isPlayer: false,
    u: 0.9935,
    lateral: 3.6,
    aiPreferredOffset: 4.2,
    aiBasePace: 0.945,
  },
  {
    id: "ai-rex",
    name: "REX",
    tag: "TITAN AI",
    color: "#f59e0b",
    isPlayer: false,
    u: 0.9905,
    lateral: -3.6,
    aiPreferredOffset: -0.6,
    aiBasePace: 0.925,
  },
  {
    id: "player",
    name: "YOU",
    tag: "CHALLENGER",
    color: "#ed5d31",
    isPlayer: true,
    u: 0.9875,
    lateral: 3.6,
    aiPreferredOffset: 0,
    aiBasePace: 1.0,
  },
] as const;

export function createInitialRacers(): RacerState[] {
  return GRID_SLOTS.map((slot) => {
    const sample = getTrackSampleAt(slot.u);
    const x = sample.point.x + sample.right.x * slot.lateral;
    const y = sample.point.y;
    const z = sample.point.z + sample.right.z * slot.lateral;
    const heading = headingFromTangent(sample.tangent.x, sample.tangent.z);

    return {
      id: slot.id,
      name: slot.name,
      tag: slot.tag,
      color: slot.color,
      isPlayer: slot.isPlayer,
      x,
      y,
      z,
      heading,
      vx: 0,
      vz: 0,
      speed: 0,
      angularVel: 0,
      lateralSlipSpeed: 0,
      u: slot.u,
      trackIndex: sample.index,
      lateralOffset: slot.lateral,
      progress: slot.u - 1, // Negative until crossing Start/Finish line at u = 0
      lap: 1,
      finished: false,
      finishTimeMs: null,
      bestLapMs: null,
      lapStartMs: 0,
      boostMeter: 45,
      isBoosting: false,
      padBoostTimer: 0,
      isDrifting: false,
      driftCharge: 0,
      driftDirection: 0,
      driftBoostsCount: 0,
      wallHits: 0,
      wallContactTimer: 0,
      gear: 1,
      shiftDipTimer: 0,
      isBraking: false,
      onCurb: false,
      isScrapingWall: false,
      scrapeSide: 0,
      impactIntensity: 0,
      impactShake: 0,
      lastImpactX: x,
      lastImpactZ: z,
      lastImpactNx: 0,
      lastImpactNz: 0,
      steerAngle: 0,
      visualRoll: 0,
      visualPitch: 0,
      wheelSpin: 0,
      aiPreferredOffset: slot.aiPreferredOffset,
      aiBasePace: slot.aiBasePace,
    };
  });
}

export function stepCarPhysics(
  car: RacerState,
  rawInput: ControlInput,
  deltaSeconds: number,
  raceElapsedMs: number
): StepCarEvents {
  const dt = Math.min(Math.max(deltaSeconds, 0.001), 0.05);
  const events: StepCarEvents = {
    lapCompleted: false,
    justFinished: false,
    hitBoostPad: false,
    triggeredDriftBurst: false,
    hitWall: false,
    impactSeverity: 0,
    upshifted: false,
    downshifted: false,
  };

  const throttle = Math.max(-1, Math.min(1, rawInput.throttle));
  const steer = Math.max(-1, Math.min(1, rawInput.steer));

  // Decay per-frame impact & cooldown timers cleanly
  car.wallContactTimer = Math.max(0, car.wallContactTimer - dt);
  car.shiftDipTimer = Math.max(0, car.shiftDipTimer - dt);
  car.impactIntensity = Math.max(0, car.impactIntensity - dt * 3.8);
  car.impactShake = Math.max(0, car.impactShake - dt * 3.2);
  car.isScrapingWall = false;
  car.scrapeSide = 0;

  // Pad boost countdown
  if (car.padBoostTimer > 0) {
    car.padBoostTimer = Math.max(0, car.padBoostTimer - dt);
  }

  // Nitro consumption & passive trickle regeneration
  const manualBoostActive = rawInput.useBoost && car.boostMeter > 2 && throttle > -0.2;
  if (manualBoostActive) {
    car.boostMeter = Math.max(0, car.boostMeter - 35 * dt);
  } else {
    car.boostMeter = Math.min(100, car.boostMeter + 5.8 * dt);
  }

  const boosting = manualBoostActive || car.padBoostTimer > 0;
  car.isBoosting = boosting;

  const paceFactor = car.isPlayer ? 1.0 : car.aiBasePace;
  const maxForwardSpeed = (boosting ? BOOST_MAX_SPEED : BASE_MAX_SPEED) * paceFactor;
  const maxReverseSpeed = -18;

  // Drift handling & charge release
  const canDrift = rawInput.drift && car.speed > 17 && Math.abs(steer) > 0.12 && !car.finished;
  if (canDrift) {
    car.isDrifting = true;
    car.driftDirection = steer;
    car.driftCharge = Math.min(1.5, car.driftCharge + dt);
    car.boostMeter = Math.min(100, car.boostMeter + 24 * dt);
  } else {
    if (car.isDrifting && car.driftCharge >= 0.45 && throttle > 0) {
      car.padBoostTimer = Math.max(car.padBoostTimer, 0.58);
      car.driftBoostsCount += 1;
      events.triggeredDriftBurst = true;
    }
    car.isDrifting = false;
    car.driftCharge = 0;
    car.driftDirection = 0;
  }

  // Sequential gearbox tracking + powerband calculation
  const fwd = forwardFromHeading(car.heading);
  const currentForwardSpeed = car.vx * fwd.x + car.vz * fwd.z;
  car.isBraking = throttle < -0.1 && currentForwardSpeed > 2;

  const forwardMag = Math.max(0, currentForwardSpeed);
  const { gear: computedGear, rpm: computedRpm } = computeGearAndRpm(forwardMag, boosting);
  if (computedGear > car.gear && forwardMag > 6 && throttle > 0.1) {
    events.upshifted = true;
    car.shiftDipTimer = 0.052;
  } else if (computedGear < car.gear && forwardMag > 10) {
    events.downshifted = true;
  }
  car.gear = computedGear;

  const gearTorqueMult = GEAR_TORQUE_MULTIPLIERS[Math.max(0, Math.min(6, computedGear - 1))];
  // Peak mid-band torque swell between 45%-92% RPM; brief torque cut during upshift gear change
  const powerBand = 0.88 + Math.sin(Math.min(1, computedRpm) * Math.PI * 0.86) * 0.24;
  const shiftClutchCut = car.shiftDipTimer > 0 && !boosting ? 0.36 : 1.0;

  // Quadratic aerodynamic drag + rolling resistance (smooth, grounded top-end curve)
  const aeroAndRollingDrag = 0.85 + 0.0041 * currentForwardSpeed * Math.abs(currentForwardSpeed);

  let nextForwardSpeed = currentForwardSpeed;
  if (boosting) {
    const basePull = Math.max(10.5, 22 - forwardMag * 0.21);
    const boostThrust = (basePull + 18) * paceFactor - aeroAndRollingDrag * 0.72;
    nextForwardSpeed = Math.min(maxForwardSpeed, currentForwardSpeed + boostThrust * dt);
  } else if (throttle > 0.05) {
    // Launch traction limits initial wheelspin while mid-gears pull strongly through corners
    const tractionRamp = forwardMag < 5 ? 0.82 + (forwardMag / 5) * 0.18 : 1.0;
    const rawDriveForce = 18.2 * gearTorqueMult * powerBand * tractionRamp * shiftClutchCut;
    const netAccel = rawDriveForce * throttle * paceFactor - aeroAndRollingDrag;

    if (currentForwardSpeed < maxForwardSpeed) {
      nextForwardSpeed = Math.min(
        maxForwardSpeed,
        Math.max(0, currentForwardSpeed + netAccel * dt)
      );
    } else {
      nextForwardSpeed = Math.max(
        maxForwardSpeed,
        currentForwardSpeed - (7.5 + aeroAndRollingDrag * 0.6) * dt
      );
    }
  } else if (throttle < -0.05) {
    if (currentForwardSpeed > 0.8) {
      // Progressive downforce-assisted threshold braking + engine braking
      const downforceAssist = Math.min(26, forwardMag * 0.56);
      const brakeDecel = 31 + downforceAssist;
      nextForwardSpeed = Math.max(0, currentForwardSpeed + brakeDecel * throttle * dt);
    } else {
      nextForwardSpeed = Math.max(maxReverseSpeed, currentForwardSpeed + 18.5 * throttle * dt);
    }
  } else {
    // Realistic engine braking + aero coasting glide
    const coastDrag = (1.65 + 0.0038 * currentForwardSpeed * currentForwardSpeed) * dt;
    const signedDrag = currentForwardSpeed >= 0 ? -coastDrag : coastDrag;
    nextForwardSpeed =
      Math.abs(currentForwardSpeed) <= Math.abs(signedDrag) ? 0 : currentForwardSpeed + signedDrag;
  }

  // Progressive steering rack smoothing, weight transfer front bite & speed-tapered lock
  const maxFrontWheelRad = 0.42;
  const speedRatio = Math.min(1, Math.abs(nextForwardSpeed) / BASE_MAX_SPEED);
  const steerAuthority = 1.0 - speedRatio * 0.46;
  const prevRack = car.steerAngle / maxFrontWheelRad;
  const targetRack = steer * steerAuthority;
  const isReturning =
    Math.abs(targetRack) < Math.abs(prevRack) || targetRack * prevRack < -0.01;
  const rackRate = isReturning ? 9.6 : 6.8 - speedRatio * 2.1;
  const nextRack = prevRack + (targetRack - prevRack) * Math.min(1, dt * rackRate);
  car.steerAngle = nextRack * maxFrontWheelRad;

  // Weight-transfer turn-in modifiers:
  // Trail-braking puts load on front tires (+bite); heavy exit gas on slow turns induces slight push/slip
  const trailBrakeBite =
    car.isBraking && forwardMag > 9 ? 1.0 + Math.min(0.22, Math.abs(throttle) * 0.22) : 1.0;
  const curbGripFactor = car.onCurb ? 0.94 : 1.0;
  const lowSpeedTurnScale = Math.min(1, Math.abs(nextForwardSpeed) / 13.5);
  const reverseSign = nextForwardSpeed >= -0.5 ? 1 : -1;
  const driftTurnBoost = car.isDrifting ? 1.2 : 1.0;

  // Yaw angular velocity dynamics (inertia & self-aligning tire stiffness rather than digital snap!)
  const desiredYawRate =
    -nextRack * 2.12 * lowSpeedTurnScale * reverseSign * trailBrakeBite * driftTurnBoost * curbGripFactor;
  const yawStiffness = car.isDrifting ? 9.8 : 14.2;
  car.angularVel += (desiredYawRate - car.angularVel) * Math.min(1, dt * yawStiffness);
  car.heading = normalizeAngle(car.heading + car.angularVel * dt);

  const newFwd = forwardFromHeading(car.heading);
  const newRightX = -newFwd.z;
  const newRightZ = newFwd.x;

  // Slip-angle lateral tire grip saturation with real traction curve & subtle throttle slip
  const prevLateralSpeed = car.vx * newRightX + car.vz * newRightZ;
  const cornerPowerOversteer =
    !car.isDrifting && forwardMag > 10 && throttle > 0.8 && Math.abs(nextRack) > 0.25 ? 0.88 : 1.0;
  const lateralDecayRate = (car.isDrifting ? 2.95 : 8.1) * curbGripFactor * cornerPowerOversteer;
  const rawLatDelta = prevLateralSpeed * (1 - Math.exp(-lateralDecayRate * dt));
  const maxGripAccel =
    (car.isDrifting ? 21 : 35 + Math.min(26, forwardMag * 0.52)) * curbGripFactor;
  const maxLatDelta = maxGripAccel * dt;
  const clampedLatDelta = Math.sign(rawLatDelta) * Math.min(Math.abs(rawLatDelta), maxLatDelta);
  const nextLateralSpeed = prevLateralSpeed - clampedLatDelta;
  car.lateralSlipSpeed = nextLateralSpeed;

  // Tire scrub bleed when carrying heavy slip angle through overheated corners or drift slides
  const highSlipAngleBleed =
    Math.abs(nextLateralSpeed) > 3.6 && nextForwardSpeed > 12
      ? Math.min(4.8, (Math.abs(nextLateralSpeed) - 3.6) * 0.42) * dt
      : 0;
  const scrubbedForwardSpeed = Math.max(0, nextForwardSpeed - highSlipAngleBleed);

  car.vx = newFwd.x * scrubbedForwardSpeed + newRightX * nextLateralSpeed;
  car.vz = newFwd.z * scrubbedForwardSpeed + newRightZ * nextLateralSpeed;
  car.speed = Math.hypot(car.vx, car.vz);
  const longAccel = (nextForwardSpeed - currentForwardSpeed) / Math.max(1e-4, dt);

  // Advance XZ position
  car.x += car.vx * dt;
  car.z += car.vz * dt;

  // Project back onto closed circuit spline
  const proj = projectPointToTrack(car.x, car.z, car.trackIndex);

  // Incident-angle barrier physics: smooth glancing rail-scrape vs real bouncy crash (NEVER instant dead-stop!)
  if (Math.abs(proj.lateralOffset) > SAFE_HALF_WIDTH) {
    const wallSide = Math.sign(proj.lateralOffset) as -1 | 1;
    const excess = Math.abs(proj.lateralOffset) - SAFE_HALF_WIDTH;
    const clampedOffset = wallSide * SAFE_HALF_WIDTH;
    car.x = proj.point.x + proj.right.x * clampedOffset;
    car.z = proj.point.z + proj.right.z * clampedOffset;

    const vAlong = car.vx * proj.tangent.x + car.vz * proj.tangent.z;
    const vIntoWall = (car.vx * proj.right.x + car.vz * proj.right.z) * wallSide;
    const roadHeading = headingFromTangent(proj.tangent.x, proj.tangent.z);

    // Track impact location at the touching outer wheel/sidepod side of the barrier
    car.lastImpactX = car.x + proj.right.x * wallSide * 0.92;
    car.lastImpactZ = car.z + proj.right.z * wallSide * 0.92;
    car.lastImpactNx = -proj.right.x * wallSide;
    car.lastImpactNz = -proj.right.z * wallSide;

    if (vIntoWall > 0.25 || excess > 0.35) {
      const impactNormal = Math.max(0, vIntoWall);
      if (impactNormal < 6.0 && excess < 1.5) {
        // Glancing brush / wall-grind: keep sliding momentum smoothly along barrier with spark friction
        const scrapeDecel = (2.2 + impactNormal * 1.15) * dt;
        const retainedAlong = Math.sign(vAlong) * Math.max(0, Math.abs(vAlong) - scrapeDecel);
        const gentleBounceOut = -wallSide * Math.min(2.6, 0.75 + impactNormal * 0.36);

        car.vx = proj.tangent.x * retainedAlong + proj.right.x * gentleBounceOut;
        car.vz = proj.tangent.z * retainedAlong + proj.right.z * gentleBounceOut;
        car.speed = Math.hypot(car.vx, car.vz);

        // Gently guide nose parallel/away from guardrail (positive wallSide = right rail -> +heading turns left off rail)
        const safeDeflectAngle = normalizeAngle(roadHeading + wallSide * 0.045 - car.heading);
        car.heading = normalizeAngle(car.heading + safeDeflectAngle * Math.min(1, dt * 8.0));
        car.angularVel *= 0.65;

        const scrapeSev = Math.min(0.35, 0.12 + impactNormal * 0.035);
        car.isScrapingWall = true;
        car.scrapeSide = wallSide;
        car.impactIntensity = Math.max(car.impactIntensity, scrapeSev);
        car.impactShake = Math.max(car.impactShake, scrapeSev * 0.45);
        car.visualRoll -= wallSide * scrapeSev * 0.14;

        if (car.wallContactTimer <= 0 && (impactNormal >= 2.2 || excess > 0.35)) {
          car.wallHits += 1;
          car.wallContactTimer = 0.45;
          events.hitWall = true;
          events.impactSeverity = Math.max(events.impactSeverity, scrapeSev);
        }
      } else {
        // Hard angled/frontal wall crash: physical restitution bounce, aligned ricochet heading & chassis shock!
        const effectiveNormal = Math.max(impactNormal, excess > 1.5 ? Math.min(18, car.speed * 0.45) : 6.0);
        const severity = Math.min(1, Math.max(0.28, (effectiveNormal - 3.5) / 17.5));
        const restitution = 0.40 + severity * 0.12;
        const bounceOut = -wallSide * Math.max(3.6, effectiveNormal * restitution);
        const oneShotLoss = car.wallContactTimer <= 0 ? Math.min(0.42, 0.10 + severity * 0.28) : 0.02;
        const retainedAlong = Math.sign(vAlong || 1) * Math.max(Math.abs(vAlong) * (1 - oneShotLoss), car.speed * (0.48 - severity * 0.18));

        car.vx = proj.tangent.x * retainedAlong + proj.right.x * bounceOut;
        car.vz = proj.tangent.z * retainedAlong + proj.right.z * bounceOut;
        car.speed = Math.hypot(car.vx, car.vz);

        // Align chassis heading toward post-rebound velocity so lateral tire grip doesn't brake-stall the ricochet
        const reboundHeading = headingFromTangent(car.vx, car.vz);
        const reboundDiff = normalizeAngle(reboundHeading - car.heading);
        car.heading = normalizeAngle(car.heading + reboundDiff * 0.72);
        car.angularVel = wallSide * (0.45 + severity * 0.95);
        car.visualRoll -= wallSide * (0.05 + severity * 0.11);
        car.visualPitch += 0.035 + severity * 0.055;

        car.isScrapingWall = true;
        car.scrapeSide = wallSide;
        car.impactIntensity = Math.max(car.impactIntensity, severity);
        car.impactShake = Math.max(car.impactShake, 0.38 + severity * 0.62);

        if (car.wallContactTimer <= 0) {
          car.wallHits += 1;
          car.wallContactTimer = 0.45;
          events.hitWall = true;
          events.impactSeverity = Math.max(events.impactSeverity, severity);
        }
      }
    } else {
      // Driver is actively steering back onto track: allow effortless pull-away with zero speed choke!
      const alongV = car.vx * proj.tangent.x + car.vz * proj.tangent.z;
      const outV = (car.vx * proj.right.x + car.vz * proj.right.z) * wallSide;
      const safeOut = Math.min(-0.4, outV);
      car.vx = proj.tangent.x * alongV + proj.right.x * (safeOut * wallSide);
      car.vz = proj.tangent.z * alongV + proj.right.z * (safeOut * wallSide);
      car.speed = Math.hypot(car.vx, car.vz);
    }

    car.lateralOffset = clampedOffset;
  } else {
    car.lateralOffset = proj.lateralOffset;
  }

  // Smooth elevation & suspension follow
  car.y = proj.point.y;
  car.trackIndex = proj.segmentIndex;
  // Curb visual strip begins at ROAD_HALF_WIDTH - 0.16; tire outer wheel rides curbs past ROAD_HALF_WIDTH - 0.72
  car.onCurb = Math.abs(car.lateralOffset) >= ROAD_HALF_WIDTH - 0.72;

  // Check boost pads
  for (const pad of BOOST_PADS) {
    const du = Math.abs(normalizeAngle((proj.u - pad.u) * Math.PI * 2) / (Math.PI * 2));
    if (du <= pad.lengthU && Math.abs(car.lateralOffset - pad.lateral) <= pad.width * 0.52) {
      if (car.padBoostTimer < 0.35) {
        car.padBoostTimer = 0.95;
        car.boostMeter = Math.min(100, car.boostMeter + 22);
        events.hitBoostPad = true;
      }
    }
  }

  // Lap & progress update
  const prevLap = car.lap;
  const prevU = car.u;
  const deltaU = computeSignedProgressDelta(prevU, proj.u);
  car.u = proj.u;
  car.progress += deltaU;

  if (!car.finished) {
    const computedLap = Math.min(TOTAL_LAPS, Math.floor(Math.max(0, car.progress)) + 1);
    if (computedLap > prevLap) {
      const lapDuration = raceElapsedMs - car.lapStartMs;
      if (lapDuration > 2500) {
        car.bestLapMs =
          car.bestLapMs === null ? lapDuration : Math.min(car.bestLapMs, lapDuration);
      }
      car.lapStartMs = raceElapsedMs;
      car.lap = computedLap;
      events.lapCompleted = true;
    }

    if (car.progress >= TOTAL_LAPS) {
      const finalLapDuration = raceElapsedMs - car.lapStartMs;
      if (finalLapDuration > 2500) {
        car.bestLapMs =
          car.bestLapMs === null ? finalLapDuration : Math.min(car.bestLapMs, finalLapDuration);
      }
      car.finished = true;
      car.finishTimeMs = raceElapsedMs;
      events.justFinished = true;
    }
  }

  // Visual suspension weight transfer (squat on launch/boost, dive under braking, shift kick, corner roll)
  const targetRoll =
    nextRack * Math.min(1, car.speed / 36) * (car.isDrifting ? 0.12 : 0.075) +
    Math.max(-0.045, Math.min(0.045, nextLateralSpeed * 0.0032));
  car.visualRoll += (targetRoll - car.visualRoll) * Math.min(1, dt * 8.5);

  const roadPitch = Math.asin(Math.max(-0.5, Math.min(0.5, proj.tangent.y)));
  const shiftPitchKick = events.upshifted ? 0.014 : 0;
  const curbSuspensionBump =
    car.onCurb && car.speed > 10 ? Math.sin(car.wheelSpin * 2.4) * 0.012 : 0;
  const dynamicPitch =
    Math.max(-0.058, Math.min(0.072, -longAccel * 0.0019)) + shiftPitchKick + curbSuspensionBump;
  car.visualPitch += (roadPitch + dynamicPitch - car.visualPitch) * Math.min(1, dt * 9.0);
  car.wheelSpin += scrubbedForwardSpeed * dt * 2.1;

  return events;
}

/**
 * Computes steering, throttle, drifting, and nitro decisions for an AI opponent.
 */
export function stepAiDecision(
  ai: RacerState,
  allCars: readonly RacerState[],
  playerProgress: number
): ControlInput {
  if (ai.finished) {
    return { throttle: 0.35, steer: 0, drift: false, useBoost: false };
  }

  // Light rubber-band modulation (±5%) so races stay tense without feeling unfair
  const gapToPlayer = ai.progress - playerProgress;
  if (gapToPlayer > 0.12) {
    ai.aiBasePace = 0.935;
  } else if (gapToPlayer < -0.08) {
    ai.aiBasePace = 1.015;
  } else {
    ai.aiBasePace = ai.id === "ai-kai" ? 0.98 : ai.id === "ai-nova" ? 0.96 : 0.94;
  }

  const speedFactor = Math.min(1, ai.speed / BASE_MAX_SPEED);
  const lookAheadU = wrapU(ai.u + 0.016 + speedFactor * 0.016);
  const lookSample = getTrackSampleAt(lookAheadU);

  // Target inside apex on upcoming corners across the wide 21m track
  let desiredLateral = ai.aiPreferredOffset - lookSample.signedCurvature * 4.2;

  // Seek boost pad if ahead within range
  for (const pad of BOOST_PADS) {
    const du = forwardDeltaU(ai.u, pad.u);
    if (du > 0.003 && du < 0.028) {
      desiredLateral = desiredLateral * 0.35 + pad.lateral * 0.65;
      break;
    }
  }

  // Clean overtaking & side-by-side lane discipline to prevent unnecessary shunts
  let trafficThrottleCap = 1.0;
  for (const other of allCars) {
    if (other.id === ai.id) continue;
    const du = forwardDeltaU(ai.u, other.u);
    const isAlongsideOrAhead = du < 0.024 || du > 0.996;
    if (!isAlongsideOrAhead) continue;

    const latDiff = other.lateralOffset - ai.lateralOffset;
    if (Math.abs(latDiff) < 4.2) {
      const dodgeOffset = other.lateralOffset > 0 ? -5.0 : 5.0;
      desiredLateral = Math.max(
        -SAFE_HALF_WIDTH + 1.4,
        Math.min(SAFE_HALF_WIDTH - 1.4, other.lateralOffset + dodgeOffset)
      );
      if (du < 0.012 && Math.abs(latDiff) < 2.8 && ai.speed > other.speed * 0.96) {
        trafficThrottleCap = 0.45;
      }
      break;
    }
  }

  desiredLateral = Math.max(-SAFE_HALF_WIDTH + 1.4, Math.min(SAFE_HALF_WIDTH - 1.4, desiredLateral));

  const targetX = lookSample.point.x + lookSample.right.x * desiredLateral;
  const targetZ = lookSample.point.z + lookSample.right.z * desiredLateral;
  const toTargetX = targetX - ai.x;
  const toTargetZ = targetZ - ai.z;
  const desiredHeading = headingFromTangent(toTargetX, toTargetZ);

  // If headingDiff < 0 -> desired yaw is clockwise (right) => positive steer input (+PD yaw damping)
  const headingDiff = normalizeAngle(desiredHeading - ai.heading);
  const steer = Math.max(-1, Math.min(1, -headingDiff * 2.25 + ai.angularVel * 0.08));

  // Corner slowdown planning tuned for controlled, readable cornering
  const midAhead = getTrackSampleAt(wrapU(ai.u + 0.024));
  const maxCurvature = Math.max(lookSample.curvature, midAhead.curvature);
  const targetCornerSpeed = BASE_MAX_SPEED * (1 - maxCurvature * 0.44);

  let throttle = trafficThrottleCap;
  if (ai.speed > targetCornerSpeed && maxCurvature > 0.42) {
    throttle = -0.35;
  } else if (ai.speed > targetCornerSpeed) {
    throttle = Math.min(throttle, 0.35);
  }

  const useBoost = maxCurvature < 0.18 && ai.boostMeter > 60 && Math.abs(steer) < 0.25 && trafficThrottleCap > 0.8;
  const drift = maxCurvature > 0.54 && Math.abs(steer) > 0.55 && ai.speed > 26;

  return { throttle, steer, drift, useBoost };
}

/**
 * Pairwise multi-zone chassis contact (front wing, center tub, rear diffuser)
 * so F1 cars battle wheel-to-wheel with authentic collision impulses, yaw deflection,
 * and impact coordinates rather than clipping noses or pinballing.
 */
export function resolveCarCollisions(cars: RacerState[]): boolean {
  const sphereOffsets = [-0.95, 0, 0.95] as const;
  const carSphereRadius = 0.94;
  const minDist = carSphereRadius * 2;
  const minDistSq = minDist * minDist;
  let hadCollision = false;

  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i];
      const b = cars[j];
      // Fast coarse bounding check (~4.2m apart cannot overlap any sphere)
      const coarseDx = b.x - a.x;
      const coarseDz = b.z - a.z;
      if (coarseDx * coarseDx + coarseDz * coarseDz > 20) continue;

      const aFwd = forwardFromHeading(a.heading);
      const bFwd = forwardFromHeading(b.heading);

      let bestDistSq = minDistSq;
      let bestAx = a.x;
      let bestAz = a.z;
      let bestBx = b.x;
      let bestBz = b.z;
      let bestAOff = 0;
      let bestBOff = 0;
      let foundOverlap = false;

      for (const aOff of sphereOffsets) {
        const ax = a.x + aFwd.x * aOff;
        const az = a.z + aFwd.z * aOff;
        for (const bOff of sphereOffsets) {
          const bx = b.x + bFwd.x * bOff;
          const bz = b.z + bFwd.z * bOff;
          const dx = bx - ax;
          const dz = bz - az;
          const d2 = dx * dx + dz * dz;
          if (d2 < bestDistSq && d2 >= 1e-6) {
            bestDistSq = d2;
            bestAx = ax;
            bestAz = az;
            bestBx = bx;
            bestBz = bz;
            bestAOff = aOff;
            bestBOff = bOff;
            foundOverlap = true;
          }
        }
      }

      if (!foundOverlap) continue;

      const dx = bestBx - bestAx;
      const dz = bestBz - bestAz;
      const dist = Math.sqrt(bestDistSq);
      const nx = dx / dist;
      const nz = dz / dist;
      const overlap = (minDist - dist) * 0.54;

      a.x -= nx * overlap;
      a.z -= nz * overlap;
      b.x += nx * overlap;
      b.z += nz * overlap;

      const relVx = b.vx - a.vx;
      const relVz = b.vz - a.vz;
      const sepVel = relVx * nx + relVz * nz;
      if (sepVel < 0) {
        const approachSpeed = -sepVel;
        // Higher relative crash velocity increases restitution snap + yaw torque
        const restitution = 0.44 + Math.min(0.14, approachSpeed * 0.008);
        const normalImpulse = approachSpeed * restitution;
        a.vx -= nx * normalImpulse;
        a.vz -= nz * normalImpulse;
        b.vx += nx * normalImpulse;
        b.vz += nz * normalImpulse;

        // Slight sliding friction along tangent of bodywork contact
        const tx = -nz;
        const tz = nx;
        const slipAlong = relVx * tx + relVz * tz;
        const tangImpulse = slipAlong * 0.075;
        a.vx += tx * tangImpulse;
        a.vz += tz * tangImpulse;
        b.vx -= tx * tangImpulse;
        b.vz -= tz * tangImpulse;

        // Off-center front/rear bumper tap induces realistic slight yaw twist
        const severity = Math.min(1, Math.max(0.15, (approachSpeed - 1.0) / 16.0));
        const aSpinDir = (aFwd.x * nz - aFwd.z * nx) * (bestAOff >= 0 ? 1 : -1);
        const bSpinDir = (bFwd.x * nz - bFwd.z * nx) * (bestBOff >= 0 ? -1 : 1);
        a.angularVel += aSpinDir * severity * 1.15;
        b.angularVel += bSpinDir * severity * 1.15;

        // Visual body roll jolt & impact coordinates
        const aSideDir = (-aFwd.z * nx + aFwd.x * nz);
        const bSideDir = (-bFwd.z * nx + bFwd.x * nz);
        a.visualRoll += aSideDir * (0.04 + severity * 0.07);
        b.visualRoll -= bSideDir * (0.04 + severity * 0.07);
        a.visualPitch += (bestAOff >= 0 ? 1 : -1) * severity * 0.045;
        b.visualPitch += (bestBOff >= 0 ? -1 : 1) * severity * 0.045;

        const ix = (bestAx + bestBx) * 0.5;
        const iz = (bestAz + bestBz) * 0.5;
        a.lastImpactX = ix;
        a.lastImpactZ = iz;
        a.lastImpactNx = -nx;
        a.lastImpactNz = -nz;
        a.impactIntensity = Math.max(a.impactIntensity, severity);
        a.impactShake = Math.max(a.impactShake, 0.28 + severity * 0.65);

        b.lastImpactX = ix;
        b.lastImpactZ = iz;
        b.lastImpactNx = nx;
        b.lastImpactNz = nz;
        b.impactIntensity = Math.max(b.impactIntensity, severity);
        b.impactShake = Math.max(b.impactShake, 0.28 + severity * 0.65);

        a.speed = Math.hypot(a.vx, a.vz);
        b.speed = Math.hypot(b.vx, b.vz);
        hadCollision = true;
      }
    }
  }

  return hadCollision;
}

export function sortRaceStandings(cars: readonly RacerState[]): RacerState[] {
  return [...cars].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishTimeMs ?? Number.MAX_SAFE_INTEGER) - (b.finishTimeMs ?? Number.MAX_SAFE_INTEGER);
    }
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });
}

export function calculateRaceScore({
  rank,
  totalTimeSeconds,
  driftBoostsCount,
  wallHits,
}: RaceScoreInput): RaceScoreBreakdown {
  const clampedRank = Math.max(1, Math.min(4, Math.floor(rank)));
  const rankBonus = RANK_BONUS_BY_POSITION[clampedRank] ?? 200;
  const safeSeconds = Math.max(0, Number.isFinite(totalTimeSeconds) ? totalTimeSeconds : 95);
  const speedBonus = Math.round(Math.max(0, 130 - safeSeconds) * 12);
  const driftBonus = Math.min(450, Math.max(0, Math.floor(driftBoostsCount)) * 45);
  const cleanDrivingBonus = wallHits <= 2 ? 250 : 0;
  const total = Math.max(150, rankBonus + speedBonus + driftBonus + cleanDrivingBonus);

  return {
    total,
    rankBonus,
    speedBonus,
    driftBonus,
    cleanDrivingBonus,
  };
}

export function formatRaceTime(ms: number): string {
  const safeMs = Math.max(0, Number.isFinite(ms) ? ms : 0);
  const totalSecs = safeMs / 1000;
  const mins = Math.floor(totalSecs / 60);
  const rem = totalSecs - mins * 60;
  const whole = Math.floor(rem);
  const hundredths = Math.floor((rem - whole) * 100);
  return `${String(mins).padStart(2, "0")}:${String(whole).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

interface SvgBoundsTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const TRACK_XZ_BOUNDS = (() => {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const s of TRACK_DATA.samples) {
    if (s.point.x < minX) minX = s.point.x;
    if (s.point.x > maxX) maxX = s.point.x;
    if (s.point.z < minZ) minZ = s.point.z;
    if (s.point.z > maxZ) maxZ = s.point.z;
  }

  return {
    minX,
    minZ,
    spanX: maxX - minX || 1,
    spanZ: maxZ - minZ || 1,
  };
})();

function getSvgBoundsTransform(width: number, height: number, padding: number): SvgBoundsTransform {
  const scale = Math.min(
    (width - padding * 2) / TRACK_XZ_BOUNDS.spanX,
    (height - padding * 2) / TRACK_XZ_BOUNDS.spanZ
  );
  return {
    scale,
    offsetX: (width - TRACK_XZ_BOUNDS.spanX * scale) * 0.5 - TRACK_XZ_BOUNDS.minX * scale,
    offsetY: (height - TRACK_XZ_BOUNDS.spanZ * scale) * 0.5 - TRACK_XZ_BOUNDS.minZ * scale,
  };
}

export function buildTrackSvgPath(width = 160, height = 160, padding = 14): string {
  const samples = TRACK_DATA.samples;
  const { scale, offsetX, offsetY } = getSvgBoundsTransform(width, height, padding);

  const commands: string[] = [];
  for (let i = 0; i < samples.length; i += 3) {
    const px = (samples[i].point.x * scale + offsetX).toFixed(1);
    const py = (samples[i].point.z * scale + offsetY).toFixed(1);
    commands.push(`${i === 0 ? "M" : "L"}${px},${py}`);
  }
  commands.push("Z");
  return commands.join(" ");
}

export function mapPointToSvg(
  x: number,
  z: number,
  width = 160,
  height = 160,
  padding = 14
): { cx: number; cy: number } {
  const { scale, offsetX, offsetY } = getSvgBoundsTransform(width, height, padding);
  return {
    cx: x * scale + offsetX,
    cy: z * scale + offsetY,
  };
}

/**
 * Simulates a 7-speed F1 sequential gearbox for authentic engine pitch, torque curve, and HUD telemetry.
 */
export function computeGearAndRpm(
  speed: number,
  isBoosting: boolean
): { gear: number; rpm: number } {
  const safeSpeed = Math.max(0, Number.isFinite(speed) ? speed : 0);
  for (let g = 1; g <= 7; g++) {
    const low = GEAR_SPEED_THRESHOLDS[g - 1];
    const high = GEAR_SPEED_THRESHOLDS[g];
    if (safeSpeed <= high || g === 7) {
      const frac = high > low ? Math.min(1, Math.max(0, (safeSpeed - low) / (high - low))) : 1;
      const rpmBase = g === 1 ? 0.22 + frac * 0.78 : 0.42 + frac * 0.58;
      return {
        gear: g,
        rpm: Math.min(1, isBoosting ? Math.max(rpmBase, 0.78) : rpmBase),
      };
    }
  }
  return { gear: 7, rpm: 1 };
}
