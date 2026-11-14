/**
 * Procedural closed-loop 3D Grand-Prix circuit mathematics, arc-length lookup
 * table, continuous spline projection, and architectural trackside props.
 */

export interface Vec3Obj {
  x: number;
  y: number;
  z: number;
}

export interface TrackSample {
  index: number;
  u: number;
  point: Vec3Obj;
  tangent: Vec3Obj;
  right: Vec3Obj;
  curvature: number;
  signedCurvature: number;
}

export interface TrackProjection {
  u: number;
  segmentIndex: number;
  point: Vec3Obj;
  tangent: Vec3Obj;
  right: Vec3Obj;
  lateralOffset: number;
  distanceSq: number;
  curvature: number;
  signedCurvature: number;
}

export interface BoostPadSpec {
  id: string;
  u: number;
  lateral: number;
  width: number;
  lengthU: number;
}

export interface TrackBuildingSpec {
  id: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  yaw: number;
  crownHeight: number;
  hasSpire: boolean;
  variant: 0 | 1 | 2;
}

export interface TrackLightPoleSpec {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  side: 1 | -1;
}

export interface TrackGrandstandSpec {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  length: number;
}

export interface TrackArchSpec {
  id: string;
  u: number;
  label: string;
}

export const TRACK_SAMPLES = 720;
export const ROAD_HALF_WIDTH = 10.5;
// F1 track half-width ~0.92m -> car centerline touches visual rail (11.24m) near 10.28m
export const BARRIER_MARGIN = 0.22;
export const SAFE_HALF_WIDTH = ROAD_HALF_WIDTH - BARRIER_MARGIN;
export const TOTAL_LAPS = 2;

export const SECTOR_ARCHES: readonly TrackArchSpec[] = [
  { id: "arch-1", u: 0.24, label: "SECTOR 2" },
  { id: "arch-2", u: 0.52, label: "DRS ZONE" },
  { id: "arch-3", u: 0.78, label: "SECTOR 3" },
];

// Flowing ~1.55 km wide Grand Prix city circuit (wide braking zones, S-curves, sweeping straights)
const CIRCUIT_WAYPOINTS: readonly Vec3Obj[] = [
  { x: 0, y: 0, z: 120 },
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 1.5, z: -135 },
  { x: 24, y: 3.4, z: -215 },
  { x: 95, y: 4.5, z: -245 },
  { x: 185, y: 3.0, z: -225 },
  { x: 245, y: 1.0, z: -165 },
  { x: 210, y: 0.2, z: -90 },
  { x: 265, y: 0.5, z: -25 },
  { x: 275, y: 1.5, z: 75 },
  { x: 240, y: 2.0, z: 165 },
  { x: 155, y: 1.0, z: 225 },
  { x: 65, y: 0.4, z: 228 },
  { x: 6, y: 0.0, z: 195 },
];

export const BOOST_PADS: readonly BoostPadSpec[] = [
  { id: "pad-main-straight", u: 0.065, lateral: 0.0, width: 4.8, lengthU: 0.009 },
  { id: "pad-north-sweep", u: 0.28, lateral: -2.4, width: 4.6, lengthU: 0.009 },
  { id: "pad-east-boulevard", u: 0.51, lateral: 2.4, width: 4.6, lengthU: 0.009 },
  { id: "pad-harbor-bend", u: 0.73, lateral: -2.0, width: 4.6, lengthU: 0.009 },
  { id: "pad-final-sprint", u: 0.90, lateral: 1.8, width: 4.8, lengthU: 0.009 },
];

function catmullRomValue(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function sampleRawClosedSpline(tGlobal: number): Vec3Obj {
  const count = CIRCUIT_WAYPOINTS.length;
  const wrapped = ((tGlobal % 1) + 1) % 1;
  const scaled = wrapped * count;
  const idx = Math.floor(scaled);
  const localT = scaled - idx;

  const p0 = CIRCUIT_WAYPOINTS[(idx - 1 + count) % count];
  const p1 = CIRCUIT_WAYPOINTS[idx % count];
  const p2 = CIRCUIT_WAYPOINTS[(idx + 1) % count];
  const p3 = CIRCUIT_WAYPOINTS[(idx + 2) % count];

  return {
    x: catmullRomValue(p0.x, p1.x, p2.x, p3.x, localT),
    y: catmullRomValue(p0.y, p1.y, p2.y, p3.y, localT),
    z: catmullRomValue(p0.z, p1.z, p2.z, p3.z, localT),
  };
}

function buildUniformTrackData(): { samples: TrackSample[]; totalLength: number } {
  const fineCount = TRACK_SAMPLES * 8;
  const finePoints: Vec3Obj[] = [];
  const cumLen: number[] = [0];

  for (let i = 0; i < fineCount; i++) {
    const pt = sampleRawClosedSpline(i / fineCount);
    finePoints.push(pt);
    if (i > 0) {
      const prev = finePoints[i - 1];
      const segLen = Math.hypot(pt.x - prev.x, pt.y - prev.y, pt.z - prev.z);
      cumLen.push(cumLen[i - 1] + segLen);
    }
  }

  const closeSeg = Math.hypot(
    finePoints[0].x - finePoints[fineCount - 1].x,
    finePoints[0].y - finePoints[fineCount - 1].y,
    finePoints[0].z - finePoints[fineCount - 1].z
  );
  const totalLength = cumLen[fineCount - 1] + closeSeg;

  // Resample at equal arc-length intervals
  const points: Vec3Obj[] = [];
  let cursor = 0;
  for (let s = 0; s < TRACK_SAMPLES; s++) {
    const targetLen = (s / TRACK_SAMPLES) * totalLength;
    while (cursor < fineCount - 1 && cumLen[cursor + 1] < targetLen) {
      cursor++;
    }
    const lenA = cumLen[cursor];
    const lenB = cursor === fineCount - 1 ? totalLength : cumLen[cursor + 1];
    const ptA = finePoints[cursor];
    const ptB = finePoints[(cursor + 1) % fineCount];
    const alpha = lenB > lenA ? (targetLen - lenA) / (lenB - lenA) : 0;
    points.push({
      x: ptA.x + (ptB.x - ptA.x) * alpha,
      y: ptA.y + (ptB.y - ptA.y) * alpha,
      z: ptA.z + (ptB.z - ptA.z) * alpha,
    });
  }

  // Compute tangents, right vectors, and signed corner curvatures
  const tangents: Vec3Obj[] = [];
  const rights: Vec3Obj[] = [];

  for (let i = 0; i < TRACK_SAMPLES; i++) {
    const prev = points[(i - 1 + TRACK_SAMPLES) % TRACK_SAMPLES];
    const next = points[(i + 1) % TRACK_SAMPLES];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tz = next.z - prev.z;
    const len = Math.hypot(tx, ty, tz) || 1;
    const tangent = { x: tx / len, y: ty / len, z: tz / len };
    tangents.push(tangent);

    // Driver right vector = normalize(tangent x UP) = (-tz, 0, tx) / hypot(tx, tz)
    const rLen = Math.hypot(tangent.x, tangent.z) || 1;
    rights.push({
      x: -tangent.z / rLen,
      y: 0,
      z: tangent.x / rLen,
    });
  }

  const samples: TrackSample[] = [];
  for (let i = 0; i < TRACK_SAMPLES; i++) {
    const ahead = tangents[(i + 4) % TRACK_SAMPLES];
    const behind = tangents[(i - 4 + TRACK_SAMPLES) % TRACK_SAMPLES];
    // Signed planar cross product y = behind.z * ahead.x - behind.x * ahead.z (right turn positive)
    const crossY = behind.x * ahead.z - behind.z * ahead.x;
    const dot = Math.max(-1, Math.min(1, behind.x * ahead.x + behind.z * ahead.z));
    const angle = Math.acos(dot);
    // Right turn in XZ looking along +forward (where tangent x UP points right): crossY > 0 means turning right
    const signedAngle = (crossY >= 0 ? 1 : -1) * angle;

    samples.push({
      index: i,
      u: i / TRACK_SAMPLES,
      point: points[i],
      tangent: tangents[i],
      right: rights[i],
      curvature: Math.min(1, angle / 0.55),
      signedCurvature: Math.max(-1, Math.min(1, signedAngle / 0.55)),
    });
  }

  return { samples, totalLength };
}

export const TRACK_DATA = buildUniformTrackData();

function isPositionClearOfTrack(cx: number, cz: number, minClearance: number): boolean {
  const minSq = minClearance * minClearance;
  for (let j = 0; j < TRACK_SAMPLES; j += 2) {
    const p = TRACK_DATA.samples[j].point;
    const distSq = (cx - p.x) * (cx - p.x) + (cz - p.z) * (cz - p.z);
    if (distSq < minSq) return false;
  }
  return true;
}

function buildCityBuildings(): TrackBuildingSpec[] {
  const buildings: TrackBuildingSpec[] = [];
  const step = 12;

  for (let i = 0; i < TRACK_SAMPLES; i += step) {
    const sample = TRACK_DATA.samples[i];

    // Inner-ring street circuit high-rises + far skyline towers
    const rings: readonly { side: 1 | -1; offset: number; minH: number; maxH: number }[] = [
      { side: 1, offset: ROAD_HALF_WIDTH + 12.5 + ((i * 5) % 10), minH: 18, maxH: 42 },
      { side: -1, offset: ROAD_HALF_WIDTH + 13.5 + ((i * 7) % 12), minH: 16, maxH: 38 },
      { side: (i / step) % 2 === 0 ? 1 : -1, offset: 42 + ((i * 11) % 30), minH: 32, maxH: 72 },
    ];

    rings.forEach((ring, rIdx) => {
      const cx = sample.point.x + sample.right.x * ring.side * ring.offset;
      const cz = sample.point.z + sample.right.z * ring.side * ring.offset;
      const width = 6.5 + ((i + rIdx * 3) % 5) * 1.8;
      const depth = 6.2 + ((i * 2 + rIdx) % 5) * 1.6;
      const clearance = ROAD_HALF_WIDTH + Math.max(width, depth) * 0.65 + 5.5;

      if (!isPositionClearOfTrack(cx, cz, clearance)) return;

      const span = ring.maxH - ring.minH;
      const height = ring.minH + ((i * 17 + rIdx * 13) % span);
      const baseBottom = -4.2;

      buildings.push({
        id: `bldg-${i}-${rIdx}`,
        x: cx,
        y: baseBottom + height * 0.5,
        z: cz,
        width,
        height,
        depth,
        yaw: headingFromTangent(sample.tangent.x, sample.tangent.z),
        crownHeight: height >= 26 ? 4.0 + (i % 5) : 0,
        hasSpire: height >= 36 && (i + rIdx) % 3 === 0,
        variant: ((i + rIdx) % 3) as 0 | 1 | 2,
      });
    });
  }

  return buildings;
}

function buildTrackLightPoles(): TrackLightPoleSpec[] {
  const poles: TrackLightPoleSpec[] = [];
  const step = 20;

  for (let i = 0; i < TRACK_SAMPLES; i += step) {
    const sample = TRACK_DATA.samples[i];
    const side: 1 | -1 = (i / step) % 2 === 0 ? 1 : -1;
    const offset = ROAD_HALF_WIDTH + 1.65;
    poles.push({
      id: `pole-${i}`,
      x: sample.point.x + sample.right.x * side * offset,
      y: sample.point.y,
      z: sample.point.z + sample.right.z * side * offset,
      yaw: headingFromTangent(sample.tangent.x, sample.tangent.z),
      side,
    });
  }

  return poles;
}

function buildGrandstands(): TrackGrandstandSpec[] {
  const stands: TrackGrandstandSpec[] = [];
  const standPositions = [0.985, 0.012, 0.036, 0.51];

  for (let idx = 0; idx < standPositions.length; idx++) {
    const u = standPositions[idx];
    const s = getTrackSampleAt(u);
    const offset = ROAD_HALF_WIDTH + 5.8;
    const cx = s.point.x - s.right.x * offset;
    const cz = s.point.z - s.right.z * offset;

    if (!isPositionClearOfTrack(cx, cz, ROAD_HALF_WIDTH + 3.2)) continue;
    stands.push({
      id: `stand-${idx}`,
      x: cx,
      y: s.point.y,
      z: cz,
      yaw: headingFromTangent(s.tangent.x, s.tangent.z),
      length: 14,
    });
  }

  return stands;
}

export const TRACK_BUILDINGS: readonly TrackBuildingSpec[] = buildCityBuildings();
export const TRACK_LIGHT_POLES: readonly TrackLightPoleSpec[] = buildTrackLightPoles();
export const TRACK_GRANDSTANDS: readonly TrackGrandstandSpec[] = buildGrandstands();

export function wrapU(u: number): number {
  return ((u % 1) + 1) % 1;
}

export function normalizeAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Matches Three.js mesh facing local -Z with rotation.y = heading -> forward = (-sin(heading), -cos(heading)).
 */
export function headingFromTangent(tx: number, tz: number): number {
  return Math.atan2(-tx, -tz);
}

export function forwardFromHeading(heading: number): { x: number; z: number } {
  return {
    x: -Math.sin(heading),
    z: -Math.cos(heading),
  };
}

export function computeSignedProgressDelta(prevU: number, nextU: number): number {
  let delta = nextU - prevU;
  if (delta < -0.5) delta += 1;
  if (delta > 0.5) delta -= 1;
  return delta;
}

export function getTrackSampleAt(u: number): TrackSample {
  const samples = TRACK_DATA.samples;
  const wrapped = wrapU(u);
  const exact = wrapped * TRACK_SAMPLES;
  const idxA = Math.floor(exact) % TRACK_SAMPLES;
  const idxB = (idxA + 1) % TRACK_SAMPLES;
  const t = exact - Math.floor(exact);
  const a = samples[idxA];
  const b = samples[idxB];

  const tx = a.tangent.x + (b.tangent.x - a.tangent.x) * t;
  const ty = a.tangent.y + (b.tangent.y - a.tangent.y) * t;
  const tz = a.tangent.z + (b.tangent.z - a.tangent.z) * t;
  const tLen = Math.hypot(tx, ty, tz) || 1;

  const tangent = { x: tx / tLen, y: ty / tLen, z: tz / tLen };
  const rLen = Math.hypot(tangent.x, tangent.z) || 1;
  const right = { x: -tangent.z / rLen, y: 0, z: tangent.x / rLen };

  return {
    index: idxA,
    u: wrapped,
    point: {
      x: a.point.x + (b.point.x - a.point.x) * t,
      y: a.point.y + (b.point.y - a.point.y) * t,
      z: a.point.z + (b.point.z - a.point.z) * t,
    },
    tangent,
    right,
    curvature: a.curvature + (b.curvature - a.curvature) * t,
    signedCurvature: a.signedCurvature + (b.signedCurvature - a.signedCurvature) * t,
  };
}

function projectOntoSegment(
  x: number,
  z: number,
  segIdx: number
): TrackProjection {
  const samples = TRACK_DATA.samples;
  const iA = ((segIdx % TRACK_SAMPLES) + TRACK_SAMPLES) % TRACK_SAMPLES;
  const iB = (iA + 1) % TRACK_SAMPLES;
  const a = samples[iA];
  const b = samples[iB];

  const abX = b.point.x - a.point.x;
  const abZ = b.point.z - a.point.z;
  const lenSq = abX * abX + abZ * abZ || 1;
  const t = Math.max(0, Math.min(1, ((x - a.point.x) * abX + (z - a.point.z) * abZ) / lenSq));

  const px = a.point.x + abX * t;
  const py = a.point.y + (b.point.y - a.point.y) * t;
  const pz = a.point.z + abZ * t;

  const tx = a.tangent.x + (b.tangent.x - a.tangent.x) * t;
  const ty = a.tangent.y + (b.tangent.y - a.tangent.y) * t;
  const tz = a.tangent.z + (b.tangent.z - a.tangent.z) * t;
  const tLen = Math.hypot(tx, ty, tz) || 1;
  const tangent = { x: tx / tLen, y: ty / tLen, z: tz / tLen };

  const rLen = Math.hypot(tangent.x, tangent.z) || 1;
  const right = { x: -tangent.z / rLen, y: 0, z: tangent.x / rLen };

  const dx = x - px;
  const dz = z - pz;
  const lateralOffset = dx * right.x + dz * right.z;
  const distanceSq = dx * dx + dz * dz;

  return {
    u: wrapU((iA + t) / TRACK_SAMPLES),
    segmentIndex: iA,
    point: { x: px, y: py, z: pz },
    tangent,
    right,
    lateralOffset,
    distanceSq,
    curvature: a.curvature + (b.curvature - a.curvature) * t,
    signedCurvature: a.signedCurvature + (b.signedCurvature - a.signedCurvature) * t,
  };
}

/**
 * Projects any XZ coordinate smoothly onto the continuous circuit spline using a fast
 * hint window around previous sample index with automatic global fallback.
 */
export function projectPointToTrack(x: number, z: number, hintIndex?: number): TrackProjection {
  const samples = TRACK_DATA.samples;
  let bestIdx = 0;
  let bestDistSq = Number.POSITIVE_INFINITY;

  if (hintIndex !== undefined && hintIndex >= 0 && hintIndex < TRACK_SAMPLES) {
    for (let offset = -28; offset <= 28; offset++) {
      const idx = (hintIndex + offset + TRACK_SAMPLES) % TRACK_SAMPLES;
      const p = samples[idx].point;
      const d = (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z);
      if (d < bestDistSq) {
        bestDistSq = d;
        bestIdx = idx;
      }
    }
  }

  if (bestDistSq > 600) {
    bestDistSq = Number.POSITIVE_INFINITY;
    for (let i = 0; i < TRACK_SAMPLES; i++) {
      const p = samples[i].point;
      const d = (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z);
      if (d < bestDistSq) {
        bestDistSq = d;
        bestIdx = i;
      }
    }
  }

  const prevSeg = projectOntoSegment(x, z, (bestIdx - 1 + TRACK_SAMPLES) % TRACK_SAMPLES);
  const nextSeg = projectOntoSegment(x, z, bestIdx);
  return prevSeg.distanceSq < nextSeg.distanceSq ? prevSeg : nextSeg;
}

/**
 * Returns shortest signed progress offset ahead from uFrom to uTo around the closed [0, 1) loop.
 */
export function forwardDeltaU(uFrom: number, uTo: number): number {
  return wrapU(uTo - uFrom);
}
