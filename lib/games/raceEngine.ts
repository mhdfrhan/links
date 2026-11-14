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
  isBraking: boolean;
  onCurb: boolean;
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

export const CAR_COLLISION_RADIUS = 1.25;
export const BASE_MAX_SPEED = 42;
export const BOOST_MAX_SPEED = 55;

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
      isBraking: false,
      onCurb: false,
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
  };

  const throttle = Math.max(-1, Math.min(1, rawInput.throttle));
  const steer = Math.max(-1, Math.min(1, rawInput.steer));

  // Pad boost countdown
  if (car.padBoostTimer > 0) {
    car.padBoostTimer = Math.max(0, car.padBoostTimer - dt);
  }

  // Nitro consumption & passive trickle regeneration
  const manualBoostActive = rawInput.useBoost && car.boostMeter > 2 && throttle > -0.2;
  if (manualBoostActive) {
    car.boostMeter = Math.max(0, car.boostMeter - 36 * dt);
  } else {
    car.boostMeter = Math.min(100, car.boostMeter + 5.5 * dt);
  }

  const boosting = manualBoostActive || car.padBoostTimer > 0;
  car.isBoosting = boosting;

  const paceFactor = car.isPlayer ? 1.0 : car.aiBasePace;
  const maxForwardSpeed = (boosting ? BOOST_MAX_SPEED : BASE_MAX_SPEED) * paceFactor;
  const maxReverseSpeed = -18;

  // Drift handling & charge release
  const canDrift = rawInput.drift && car.speed > 18 && Math.abs(steer) > 0.12 && !car.finished;
  if (canDrift) {
    car.isDrifting = true;
    car.driftDirection = steer;
    car.driftCharge = Math.min(1.5, car.driftCharge + dt);
    car.boostMeter = Math.min(100, car.boostMeter + 24 * dt);
  } else {
    if (car.isDrifting && car.driftCharge >= 0.45 && throttle > 0) {
      car.padBoostTimer = Math.max(car.padBoostTimer, 0.55);
      car.driftBoostsCount += 1;
      events.triggeredDriftBurst = true;
    }
    car.isDrifting = false;
    car.driftCharge = 0;
    car.driftDirection = 0;
  }

  // Longitudinal drive torque, aerodynamic drag, and progressive weight-transfer braking
  const fwd = forwardFromHeading(car.heading);
  const currentForwardSpeed = car.vx * fwd.x + car.vz * fwd.z;
  car.isBraking = throttle < -0.1 && currentForwardSpeed > 2;

  const forwardMag = Math.max(0, currentForwardSpeed);
  const aeroAndRollingDrag = 0.9 + 0.0044 * currentForwardSpeed * Math.abs(currentForwardSpeed);

  let nextForwardSpeed = currentForwardSpeed;
  if (boosting) {
    // Sustained overdrive thrust layered above the torque band
    const basePull = Math.max(10, 21 - forwardMag * 0.22);
    const boostThrust = (basePull + 17) * paceFactor - aeroAndRollingDrag * 0.72;
    nextForwardSpeed = Math.min(maxForwardSpeed, currentForwardSpeed + boostThrust * dt);
  } else if (throttle > 0.05) {
    // Progressive Forza-paced torque curve: smooth launch -> mid punch -> readable top speed
    const torqueAccel =
      forwardMag < 8
        ? 16.5 + forwardMag * 0.65
        : forwardMag < 26
          ? 21.7 - (forwardMag - 8) * 0.28
          : Math.max(8.8, 16.66 - (forwardMag - 26) * 0.38);
    const netAccel = torqueAccel * throttle * paceFactor - aeroAndRollingDrag;

    if (currentForwardSpeed < maxForwardSpeed) {
      nextForwardSpeed = Math.min(
        maxForwardSpeed,
        Math.max(0, currentForwardSpeed + netAccel * dt)
      );
    } else {
      // Smooth aerodynamic bleed when coasting down from nitro/slipstream excess speed
      nextForwardSpeed = Math.max(
        maxForwardSpeed,
        currentForwardSpeed - (8 + aeroAndRollingDrag * 0.65) * dt
      );
    }
  } else if (throttle < -0.05) {
    if (currentForwardSpeed > 0.8) {
      // Downforce-assisted threshold braking
      const brakeDecel = 30 + Math.min(24, forwardMag * 0.5);
      nextForwardSpeed = Math.max(0, currentForwardSpeed + brakeDecel * throttle * dt);
    } else {
      nextForwardSpeed = Math.max(maxReverseSpeed, currentForwardSpeed + 18 * throttle * dt);
    }
  } else {
    // Natural Forza-style coasting glide (rolling drag + quadratic aero)
    const coastDrag = (1.8 + 0.0042 * currentForwardSpeed * currentForwardSpeed) * dt;
    const signedDrag = currentForwardSpeed >= 0 ? -coastDrag : coastDrag;
    nextForwardSpeed =
      Math.abs(currentForwardSpeed) <= Math.abs(signedDrag) ? 0 : currentForwardSpeed + signedDrag;
  }

  // Progressive steering rack smoothing, self-centering caster & high-speed lock taper
  const maxFrontWheelRad = 0.42;
  const speedRatio = Math.min(1, Math.abs(nextForwardSpeed) / BASE_MAX_SPEED);
  const steerAuthority = 1.0 - speedRatio * 0.44;
  const prevRack = car.steerAngle / maxFrontWheelRad;
  const targetRack = steer * steerAuthority;
  const isReturning =
    Math.abs(targetRack) < Math.abs(prevRack) || targetRack * prevRack < -0.01;
  const rackRate = isReturning ? 9.2 : 6.8 - speedRatio * 2.2;
  const nextRack = prevRack + (targetRack - prevRack) * Math.min(1, dt * rackRate);
  car.steerAngle = nextRack * maxFrontWheelRad;

  const lowSpeedTurnScale = Math.min(1, Math.abs(nextForwardSpeed) / 14);
  const reverseSign = nextForwardSpeed >= -0.5 ? 1 : -1;
  const driftTurnBoost = car.isDrifting ? 1.16 : 1.0;
  // Positive steer = turn right => decreasing Three.js yaw heading
  const turnRate = -nextRack * 2.05 * lowSpeedTurnScale * reverseSign * driftTurnBoost;
  car.heading = normalizeAngle(car.heading + turnRate * dt);

  const newFwd = forwardFromHeading(car.heading);
  const newRightX = -newFwd.z;
  const newRightZ = newFwd.x;

  // Slip-angle lateral grip saturation so high-speed turns feel weighted & planted
  const prevLateralSpeed = car.vx * newRightX + car.vz * newRightZ;
  const lateralDecayRate = car.isDrifting ? 3.2 : 8.4;
  const rawLatDelta = prevLateralSpeed * (1 - Math.exp(-lateralDecayRate * dt));
  const maxGripAccel = car.isDrifting ? 22 : 34 + Math.min(22, Math.abs(nextForwardSpeed) * 0.45);
  const maxLatDelta = maxGripAccel * dt;
  const clampedLatDelta = Math.sign(rawLatDelta) * Math.min(Math.abs(rawLatDelta), maxLatDelta);
  const nextLateralSpeed = prevLateralSpeed - clampedLatDelta;

  // Mild tire scrubbing drag when carrying heavy slip angle during drift slides
  const slipScrub =
    car.isDrifting && nextForwardSpeed > 14
      ? Math.min(4.5, Math.abs(nextLateralSpeed) * 0.35) * dt
      : 0;
  const scrubbedForwardSpeed = Math.max(0, nextForwardSpeed - slipScrub);

  car.vx = newFwd.x * scrubbedForwardSpeed + newRightX * nextLateralSpeed;
  car.vz = newFwd.z * scrubbedForwardSpeed + newRightZ * nextLateralSpeed;
  car.speed = Math.hypot(car.vx, car.vz);
  const longAccel = (nextForwardSpeed - currentForwardSpeed) / Math.max(1e-4, dt);

  // Advance XZ position
  car.x += car.vx * dt;
  car.z += car.vz * dt;

  // Project back onto closed circuit spline
  const proj = projectPointToTrack(car.x, car.z, car.trackIndex);

  // Barrier containment: slide cleanly along wall tangent without snagging
  if (Math.abs(proj.lateralOffset) > SAFE_HALF_WIDTH) {
    const sign = Math.sign(proj.lateralOffset);
    const clampedOffset = sign * SAFE_HALF_WIDTH;
    car.x = proj.point.x + proj.right.x * clampedOffset;
    car.z = proj.point.z + proj.right.z * clampedOffset;

    const alongTrackSpeed = car.vx * proj.tangent.x + car.vz * proj.tangent.z;
    const retainedSpeed = alongTrackSpeed * 0.86;
    car.vx = proj.tangent.x * retainedSpeed;
    car.vz = proj.tangent.z * retainedSpeed;
    car.speed = Math.abs(retainedSpeed);

    const roadHeading = headingFromTangent(proj.tangent.x, proj.tangent.z);
    const diff = normalizeAngle(roadHeading - car.heading);
    car.heading = normalizeAngle(car.heading + diff * 0.35);

    car.wallHits += 1;
    events.hitWall = true;
    car.lateralOffset = clampedOffset;
  } else {
    car.lateralOffset = proj.lateralOffset;
  }

  // Smooth elevation & suspension follow
  car.y = proj.point.y;
  car.trackIndex = proj.segmentIndex;
  car.onCurb = Math.abs(car.lateralOffset) >= ROAD_HALF_WIDTH - 0.95;

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

  // Visual suspension weight transfer (squat on launch/boost, dive under braking, corner roll)
  const targetRoll =
    nextRack * Math.min(1, car.speed / 36) * (car.isDrifting ? 0.115 : 0.072) +
    Math.max(-0.04, Math.min(0.04, nextLateralSpeed * 0.003));
  car.visualRoll += (targetRoll - car.visualRoll) * Math.min(1, dt * 8.5);

  const roadPitch = Math.asin(Math.max(-0.5, Math.min(0.5, proj.tangent.y)));
  const dynamicPitch = Math.max(-0.055, Math.min(0.068, -longAccel * 0.0018));
  car.visualPitch += (roadPitch + dynamicPitch - car.visualPitch) * Math.min(1, dt * 8.5);
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

  // If headingDiff < 0 -> desired yaw is clockwise (right) => positive steer input
  const headingDiff = normalizeAngle(desiredHeading - ai.heading);
  const steer = Math.max(-1, Math.min(1, -headingDiff * 2.2));

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
 * Pairwise cushioned contact so racers battle wheel-to-wheel without pinball crashes.
 */
export function resolveCarCollisions(cars: RacerState[]): boolean {
  const minDist = CAR_COLLISION_RADIUS * 2;
  const minDistSq = minDist * minDist;
  let hadCollision = false;

  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i];
      const b = cars[j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const distSq = dx * dx + dz * dz;
      if (distSq >= minDistSq || distSq < 1e-6) continue;

      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const nz = dz / dist;
      const overlap = (minDist - dist) * 0.52;

      a.x -= nx * overlap;
      a.z -= nz * overlap;
      b.x += nx * overlap;
      b.z += nz * overlap;

      const relVx = b.vx - a.vx;
      const relVz = b.vz - a.vz;
      const sepVel = relVx * nx + relVz * nz;
      if (sepVel < 0) {
        const impulse = -sepVel * 0.34;
        a.vx -= nx * impulse;
        a.vz -= nz * impulse;
        b.vx += nx * impulse;
        b.vz += nz * impulse;
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

const GEAR_SPEED_THRESHOLDS = [0, 7, 13, 19, 25, 32, 42, 55] as const;

/**
 * Simulates a 7-speed F1 sequential gearbox for authentic engine pitch and HUD telemetry.
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
