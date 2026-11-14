import assert from "node:assert/strict";
import test from "node:test";
import {
  ROAD_HALF_WIDTH,
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
  computeCameraLookFactors,
  computeGearAndRpm,
  createInitialCameraLookState,
  createInitialRacers,
  formatRaceTime,
  resolveCarCollisions,
  sortRaceStandings,
  stepAiDecision,
  stepCameraLook,
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

test("glancing wall scrape preserves speed, curb riding stays barrier-free, and hard crashes rebound dramatically", () => {
  // 1. Riding painted curb (within ROAD_HALF_WIDTH - 0.35 = 10.15m < SAFE_HALF_WIDTH 10.28m) must NOT hit invisible barrier
  const curbCar = createInitialRacers().find((r) => r.isPlayer)!;
  const sCurb = getTrackSampleAt(curbCar.u);
  curbCar.x = sCurb.point.x + sCurb.right.x * (ROAD_HALF_WIDTH - 0.35);
  curbCar.z = sCurb.point.z + sCurb.right.z * (ROAD_HALF_WIDTH - 0.35);
  const fCurb = forwardFromHeading(curbCar.heading);
  curbCar.vx = fCurb.x * 32;
  curbCar.vz = fCurb.z * 32;
  curbCar.speed = 32;
  const curbEvt = stepCarPhysics(curbCar, { throttle: 1, steer: 0, drift: false, useBoost: false }, 1 / 60, 100);
  assert.equal(curbCar.onCurb, true);
  assert.equal(curbEvt.hitWall, false);
  assert.equal(curbCar.wallHits, 0);

  // 2. Shallow wall brush ("mepet pembatas") must glide continuously rather than dead-stopping
  const grazeCar = createInitialRacers().find((r) => r.isPlayer)!;
  const sGraze = getTrackSampleAt(0.05);
  grazeCar.u = 0.05;
  grazeCar.trackIndex = sGraze.index;
  grazeCar.x = sGraze.point.x + sGraze.right.x * (SAFE_HALF_WIDTH + 0.05);
  grazeCar.z = sGraze.point.z + sGraze.right.z * (SAFE_HALF_WIDTH + 0.05);
  const roadYaw = headingFromTangent(sGraze.tangent.x, sGraze.tangent.z);
  grazeCar.heading = roadYaw - 0.06; // slightly angled into right barrier
  grazeCar.vx = sGraze.tangent.x * 36 + sGraze.right.x * 2.2;
  grazeCar.vz = sGraze.tangent.z * 36 + sGraze.right.z * 2.2;
  grazeCar.speed = Math.hypot(grazeCar.vx, grazeCar.vz);

  let sawScrape = false;
  for (let i = 0; i < 20; i++) {
    stepCarPhysics(grazeCar, { throttle: 1, steer: 0, drift: false, useBoost: false }, 1 / 60, 200 + i * 16.6);
    if (grazeCar.isScrapingWall) sawScrape = true;
  }
  assert.equal(sawScrape, true);
  assert.ok(grazeCar.speed > 28, `Expected smooth glide speed > 28, got ${grazeCar.speed}`);
  assert.ok(grazeCar.wallHits <= 1); // debounced cleanly, never +20 wallHits in 0.3s

  // 3. Hard angled crash emits strong severity, camera shake impulse, and physical rebound off barrier
  const crashCar = createInitialRacers().find((r) => r.isPlayer)!;
  const sCrash = getTrackSampleAt(0.05);
  crashCar.u = 0.05;
  crashCar.trackIndex = sCrash.index;
  crashCar.x = sCrash.point.x + sCrash.right.x * (SAFE_HALF_WIDTH + 0.2);
  crashCar.z = sCrash.point.z + sCrash.right.z * (SAFE_HALF_WIDTH + 0.2);
  crashCar.heading = headingFromTangent(sCrash.tangent.x, sCrash.tangent.z) - 0.65;
  crashCar.vx = sCrash.tangent.x * 28 + sCrash.right.x * 16;
  crashCar.vz = sCrash.tangent.z * 28 + sCrash.right.z * 16;
  crashCar.speed = Math.hypot(crashCar.vx, crashCar.vz);

  const crashEvt = stepCarPhysics(crashCar, { throttle: 1, steer: 0, drift: false, useBoost: false }, 1 / 60, 500);
  assert.equal(crashEvt.hitWall, true);
  assert.ok(crashEvt.impactSeverity > 0.35);
  assert.ok(crashCar.impactShake > 0.35);
  // Outward normal velocity away from right wall must be strictly negative (rebounding back onto track)
  const outVel = crashCar.vx * sCrash.right.x + crashCar.vz * sCrash.right.z;
  assert.ok(outVel < -2, `Expected physical rebound off barrier, got outVel=${outVel}`);

  // Next 10 frames must carry ricochet momentum cleanly (> 16 m/s) instead of sideways brake-stall
  for (let i = 0; i < 10; i++) {
    stepCarPhysics(crashCar, { throttle: 1, steer: 0, drift: false, useBoost: false }, 1 / 60, 520 + i * 16.6);
  }
  assert.ok(crashCar.speed > 16, `Expected clean ricochet momentum > 16 m/s, got ${crashCar.speed}`);
});

test("gearbox hysteresis and empty-nitro lockout prevent 6<->7 flapping and boost chatter at limit", () => {
  const car = createInitialRacers().find((r) => r.isPlayer)!;
  const fwd = forwardFromHeading(car.heading);
  // Cruise at normal top speed (45 m/s -> cleanly in Gear 7)
  car.vx = fwd.x * 45;
  car.vz = fwd.z * 45;
  car.speed = 45;
  car.gear = 7;

  // Mild speed dips to 41.2 m/s (above hysteresis floor 42 - 2.0 = 40.0) stay locked in Gear 7
  for (let i = 0; i < 15; i++) {
    car.gearHoldTimer = 0;
    const f = forwardFromHeading(car.heading);
    car.vx = f.x * (i % 2 === 0 ? 41.2 : 44.8);
    car.vz = f.z * (i % 2 === 0 ? 41.2 : 44.8);
    car.speed = Math.hypot(car.vx, car.vz);
    const evt = stepCarPhysics(car, { throttle: 1, steer: 0, drift: false, useBoost: false }, 1 / 60, 1000 + i * 16.6);
    assert.equal(car.gear, 7);
    assert.equal(evt.downshifted, false);
  }

  // Holding boost past empty tank triggers lockout cleanly without re-engaging until reserve builds
  car.boostMeter = 1.2;
  stepCarPhysics(car, { throttle: 1, steer: 0, drift: false, useBoost: true }, 1 / 60, 1400);
  // Drain to <= 0.5 -> boostExhausted locks cleanly across subsequent holds
  for (let i = 0; i < 10; i++) {
    stepCarPhysics(car, { throttle: 1, steer: 0, drift: false, useBoost: true }, 1 / 60, 1420 + i * 16.6);
    if (car.boostExhausted) {
      assert.equal(car.isBoosting, false);
    }
  }
  assert.equal(car.boostExhausted, true);
});

test("camera look springs smoothly for left, right, back arrows and returns without overshoot", () => {
  const cam = createInitialCameraLookState();
  assert.equal(cam.yaw, 0);

  // Hold ArrowLeft -> smooth monotonic rise toward +PI/2 without overshoot
  let prev = cam.yaw;
  for (let i = 0; i < 60; i++) {
    stepCameraLook(cam, { left: true, right: false, back: false }, 1 / 60);
    assert.ok(cam.yaw >= prev - 1e-6);
    assert.ok(cam.yaw <= Math.PI * 0.5 + 1e-6);
    prev = cam.yaw;
  }
  assert.ok(Math.abs(cam.yaw - Math.PI * 0.5) < 0.005);

  const sideFactors = computeCameraLookFactors(cam.yaw);
  assert.ok(sideFactors.sideFactor > 0.99);
  assert.equal(sideFactors.sideSign, -1);

  // Switch cleanly to ArrowRight -> smooth curve toward -PI/2
  for (let i = 0; i < 60; i++) {
    stepCameraLook(cam, { left: false, right: true, back: false }, 1 / 60);
  }
  assert.ok(Math.abs(cam.yaw + Math.PI * 0.5) < 0.005);
  assert.equal(cam.backSign, -1);

  // Transition directly from Right to ArrowDown -> swings along shorter right flank to -PI
  for (let i = 0; i < 60; i++) {
    stepCameraLook(cam, { left: false, right: false, back: true }, 1 / 60);
    assert.ok(cam.yaw <= 0);
  }
  assert.ok(Math.abs(cam.yaw + Math.PI) < 0.01);

  const rearFactors = computeCameraLookFactors(cam.yaw);
  assert.ok(rearFactors.rearFactor > 0.99);
  assert.ok(rearFactors.forwardWeight < 1e-6);

  // Release -> returns smoothly back to center (0) along same arc without wrapping jump
  prev = cam.yaw;
  for (let i = 0; i < 75; i++) {
    stepCameraLook(cam, { left: false, right: false, back: false }, 1 / 60);
    assert.ok(cam.yaw >= prev - 1e-6);
    assert.ok(cam.yaw <= 1e-6);
    prev = cam.yaw;
  }
  assert.equal(cam.yaw, 0);

  // Simultaneous Left + Right cancels cleanly back toward center
  stepCameraLook(cam, { left: true, right: false, back: false }, 1 / 60);
  assert.ok(cam.yaw > 0);
  for (let i = 0; i < 60; i++) {
    stepCameraLook(cam, { left: true, right: true, back: false }, 1 / 60);
  }
  assert.equal(cam.yaw, 0);
});
