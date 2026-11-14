import assert from "node:assert/strict";
import test from "node:test";
import {
  SAFE_HALF_WIDTH,
  TRACK_DATA,
  TRACK_SAMPLES,
  computeSignedProgressDelta,
  forwardFromHeading,
  getTrackSampleAt,
  headingFromTangent,
  projectPointToTrack,
} from "../lib/games/raceTrack.ts";
import {
  calculateRaceScore,
  computeGearAndRpm,
  createInitialRacers,
  formatRaceTime,
  resolveCarCollisions,
  sortRaceStandings,
  stepAiDecision,
  stepCarPhysics,
} from "../lib/games/raceEngine.ts";

test("track curve samples form a closed loop with orthogonal planar right vectors", () => {
  assert.equal(TRACK_DATA.samples.length, TRACK_SAMPLES);
  assert.ok(TRACK_DATA.totalLength > 1200);

  for (const sample of TRACK_DATA.samples) {
    const dotXZ = sample.tangent.x * sample.right.x + sample.tangent.z * sample.right.z;
    assert.ok(Math.abs(dotXZ) < 1e-6);

    const h = headingFromTangent(sample.tangent.x, sample.tangent.z);
    const fwd = forwardFromHeading(h);
    const tXZLen = Math.hypot(sample.tangent.x, sample.tangent.z) || 1;
    assert.ok(Math.abs(fwd.x - sample.tangent.x / tXZLen) < 1e-5);
    assert.ok(Math.abs(fwd.z - sample.tangent.z / tXZLen) < 1e-5);
  }
});

test("projectPointToTrack computes exact lateral offsets and wraparound deltas", () => {
  const sample = getTrackSampleAt(0.25);
  const offset = 3.2;
  const proj = projectPointToTrack(
    sample.point.x + sample.right.x * offset,
    sample.point.z + sample.right.z * offset,
    sample.index
  );

  assert.ok(Math.abs(proj.lateralOffset - offset) < 0.25);
  assert.ok(Math.abs(computeSignedProgressDelta(0.98, 0.02) - 0.04) < 1e-9);
  assert.ok(Math.abs(computeSignedProgressDelta(0.02, 0.98) + 0.04) < 1e-9);
});

test("stepCarPhysics accelerates, drift-charges mini-turbo, and contains barriers", () => {
  const racers = createInitialRacers();
  const player = racers.find((r) => r.isPlayer)!;

  // Accelerate across the start/finish line onto lap 1
  for (let i = 0; i < 90; i++) {
    stepCarPhysics(player, { throttle: 1, steer: 0, drift: false, useBoost: false }, 1 / 60, i * 16.6);
  }
  assert.ok(player.speed > 20);
  assert.ok(player.progress > 0);

  // Drift smoothly along an arc long enough (>= 0.45s) to trigger mini-turbo burst
  const meterBefore = player.boostMeter;
  for (let i = 0; i < 32; i++) {
    const steerCurve = i < 16 ? -0.35 : 0.35;
    stepCarPhysics(player, { throttle: 1, steer: steerCurve, drift: true, useBoost: false }, 1 / 60, 1500 + i * 16.6);
  }
  assert.equal(player.isDrifting, true);
  assert.ok(player.boostMeter > meterBefore);

  const releaseEvents = stepCarPhysics(
    player,
    { throttle: 1, steer: 0, drift: false, useBoost: false },
    1 / 60,
    1800
  );
  assert.equal(releaseEvents.triggeredDriftBurst, true);
  assert.equal(player.driftBoostsCount, 1);

  // Pushing far outside road clamps smoothly inside SAFE_HALF_WIDTH
  player.x += 40;
  const wallEvents = stepCarPhysics(
    player,
    { throttle: 1, steer: 0, drift: false, useBoost: false },
    1 / 60,
    2000
  );
  assert.equal(wallEvents.hitWall, true);
  assert.ok(Math.abs(player.lateralOffset) <= SAFE_HALF_WIDTH + 1e-5);
});

test("AI steering stays finite, car collisions separate overlaps, and standings sort finished first", () => {
  const racers = createInitialRacers();
  const player = racers.find((r) => r.isPlayer)!;
  const ai = racers[0];

  const decision = stepAiDecision(ai, racers, player.progress);
  assert.ok(Number.isFinite(decision.steer) && Math.abs(decision.steer) <= 1);
  assert.ok(Number.isFinite(decision.throttle));

  // Force overlap between two converging racers
  racers[0].x = racers[1].x + 0.4;
  racers[0].z = racers[1].z;
  racers[0].vx = -10;
  racers[1].vx = 10;
  const bumped = resolveCarCollisions(racers);
  assert.equal(bumped, true);

  // Standings rank finished racers by fastest finishTimeMs ahead of trailing cars
  racers[2].finished = true;
  racers[2].finishTimeMs = 42150;
  racers[0].finished = true;
  racers[0].finishTimeMs = 40800;
  const sorted = sortRaceStandings(racers);
  assert.equal(sorted[0].id, racers[0].id);
  assert.equal(sorted[1].id, racers[2].id);

  const score = calculateRaceScore({ rank: 1, totalTimeSeconds: 95, driftBoostsCount: 4, wallHits: 1 });
  assert.equal(score.rankBonus, 1500);
  assert.equal(score.cleanDrivingBonus, 250);
  assert.equal(score.total, 1500 + (130 - 95) * 12 + 4 * 45 + 250);
  assert.equal(formatRaceTime(42156), "00:42.15");

  const lowGear = computeGearAndRpm(5, false);
  const topGear = computeGearAndRpm(50, true);
  assert.equal(lowGear.gear, 1);
  assert.equal(topGear.gear, 7);
  assert.ok(topGear.rpm >= 0.78 && topGear.rpm <= 1);
});

test("Forza-style progressive torque, speed-sensitive steering rack & weight transfer behave naturally", () => {
  const racers = createInitialRacers();
  const car = racers.find((r) => r.isPlayer)!;

  // Frame 1 steering should engage progressively through the rack rather than snapping to full lock
  stepCarPhysics(car, { throttle: 1, steer: 1, drift: false, useBoost: false }, 1 / 60, 16);
  assert.ok(car.steerAngle > 0 && car.steerAngle < 0.15);

  // Straight launch for 0.5s builds speed smoothly without instant hyper-teleport
  for (let i = 0; i < 30; i++) {
    stepCarPhysics(car, { throttle: 1, steer: 0, drift: false, useBoost: false }, 1 / 60, 32 + i * 16.6);
  }
  const speedAtHalfSec = car.speed;
  assert.ok(speedAtHalfSec > 6 && speedAtHalfSec < 15);
  assert.ok(car.visualPitch < -0.005); // rear squat under launch acceleration

  // Coasting for 0.4s lets car glide instead of slamming to a stop
  for (let i = 0; i < 24; i++) {
    stepCarPhysics(car, { throttle: 0, steer: 0, drift: false, useBoost: false }, 1 / 60, 600 + i * 16.6);
  }
  assert.ok(car.speed > speedAtHalfSec * 0.68 && car.speed < speedAtHalfSec);

  // Heavy braking triggers nose dive and active braking flag
  stepCarPhysics(car, { throttle: -1, steer: 0, drift: false, useBoost: false }, 1 / 60, 1020);
  assert.equal(car.isBraking, true);
  assert.ok(car.visualPitch > 0);

  // High-speed steering lock tapers below low-speed lock for straight-line composure
  const lowSpeedSteer = createInitialRacers().find((r) => r.isPlayer)!;
  const lowFwd = forwardFromHeading(lowSpeedSteer.heading);
  lowSpeedSteer.vx = lowFwd.x * 10;
  lowSpeedSteer.vz = lowFwd.z * 10;
  lowSpeedSteer.speed = 10;

  const highSpeedSteer = createInitialRacers().find((r) => r.isPlayer)!;
  const highFwd = forwardFromHeading(highSpeedSteer.heading);
  highSpeedSteer.vx = highFwd.x * 40;
  highSpeedSteer.vz = highFwd.z * 40;
  highSpeedSteer.speed = 40;

  for (let i = 0; i < 45; i++) {
    stepCarPhysics(lowSpeedSteer, { throttle: 0.3, steer: 1, drift: false, useBoost: false }, 1 / 60, 3000 + i * 16.6);
    stepCarPhysics(highSpeedSteer, { throttle: 1, steer: 1, drift: false, useBoost: false }, 1 / 60, 3000 + i * 16.6);
  }
  assert.ok(highSpeedSteer.steerAngle < 0.28);
  assert.ok(highSpeedSteer.steerAngle < lowSpeedSteer.steerAngle);
  assert.ok(Math.abs(highSpeedSteer.visualRoll) > 0.01);
});
