"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  PerspectiveCamera,
  Sky,
  Stars,
} from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  BOOST_PADS,
  ROAD_HALF_WIDTH,
  SECTOR_ARCHES,
  TOTAL_LAPS,
  TRACK_BUILDINGS,
  TRACK_DATA,
  TRACK_GRANDSTANDS,
  TRACK_LIGHT_POLES,
  TRACK_SAMPLES,
  type TrackSample,
  forwardFromHeading,
  getTrackSampleAt,
  headingFromTangent,
  normalizeAngle,
} from "@/lib/games/raceTrack";
import {
  type CameraLookState,
  type ControlInput,
  type RacerState,
  computeCameraLookFactors,
  createInitialCameraLookState,
  createInitialRacers,
  resolveCarCollisions,
  sortRaceStandings,
  stepAiDecision,
  stepCameraLook,
  stepCarPhysics,
} from "@/lib/games/raceEngine";
import { F1AudioController } from "@/lib/games/racingAudio";
import { F1CarModel, type F1CarMeshRefs } from "./F1CarModel";

export type RacePhase = "idle" | "countdown" | "racing" | "paused" | "finished";
export type CameraPreset = "chase" | "wide" | "tcam" | "cockpit";

export interface CameraSettings {
  preset: CameraPreset;
  heightOffset: number;
  distanceOffset: number;
  fovOffset: number;
}

export interface TelemetryRacerDot {
  id: string;
  name: string;
  color: string;
  x: number;
  z: number;
  rank: number;
  isPlayer: boolean;
  finished: boolean;
  finishTimeMs: number | null;
}

export interface RaceTelemetrySnapshot {
  speedKmh: number;
  gear: number;
  rpm: number;
  rank: number;
  lap: number;
  elapsedMs: number;
  bestLapMs: number | null;
  boostMeter: number;
  isBoosting: boolean;
  isDrifting: boolean;
  driftCharge: number;
  impactIntensity: number;
  countdownLabel: string;
  racers: TelemetryRacerDot[];
}

export interface RaceAudioEvents {
  onCountdownStep: (isGo: boolean) => void;
  onBoost: () => void;
  onLap: (isFinalLap: boolean) => void;
  onBump: (intensity?: number, kind?: "wall" | "car") => void;
  onFinishRace: (
    rank: number,
    totalTimeMs: number,
    bestLapMs: number | null,
    driftBoostsCount: number,
    wallHits: number,
    standings: TelemetryRacerDot[]
  ) => void;
}

export interface RaceArenaCanvasProps {
  runId: number;
  phase: RacePhase;
  cameraSettings: CameraSettings;
  isDark: boolean;
  muted: boolean;
  mobileControlRef: React.MutableRefObject<ControlInput>;
  audioEvents: RaceAudioEvents;
  onPhaseChange: (phase: RacePhase) => void;
  onTelemetry: (snapshot: RaceTelemetrySnapshot) => void;
  onRequestRestart: () => void;
}

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackText: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallbackText: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex h-full w-full items-center justify-center p-6 text-center text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {this.props.fallbackText}
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Generates seamless closed-loop extruded ribbon geometry with continuous UV tiling
 * using count + 1 seam vertices so texture coordinates never wrap backward at i = 0.
 */
function buildClosedRibbonGeometry(
  samples: readonly TrackSample[],
  offsetLeft: number,
  offsetRight: number,
  yLeft: number,
  yRight: number,
  uvRepeatsU: number,
  uvRepeatsV: number,
  colorAtSegment: (index: number, isLeftEdge: boolean) => [number, number, number]
): THREE.BufferGeometry {
  const count = samples.length;
  const ringCount = count + 1;
  const positions = new Float32Array(ringCount * 2 * 3);
  const colors = new Float32Array(ringCount * 2 * 3);
  const uvs = new Float32Array(ringCount * 2 * 2);
  const indices: number[] = [];

  for (let i = 0; i < ringCount; i++) {
    const sampleIdx = i % count;
    const s = samples[sampleIdx];
    const base = i * 6;
    const uvBase = i * 4;
    const vCoord = (i / count) * uvRepeatsV;

    positions[base] = s.point.x + s.right.x * offsetLeft;
    positions[base + 1] = s.point.y + yLeft;
    positions[base + 2] = s.point.z + s.right.z * offsetLeft;

    positions[base + 3] = s.point.x + s.right.x * offsetRight;
    positions[base + 4] = s.point.y + yRight;
    positions[base + 5] = s.point.z + s.right.z * offsetRight;

    const cL = colorAtSegment(sampleIdx, true);
    const cR = colorAtSegment(sampleIdx, false);
    colors[base] = cL[0];
    colors[base + 1] = cL[1];
    colors[base + 2] = cL[2];
    colors[base + 3] = cR[0];
    colors[base + 4] = cR[1];
    colors[base + 5] = cR[2];

    uvs[uvBase] = 0;
    uvs[uvBase + 1] = vCoord;
    uvs[uvBase + 2] = uvRepeatsU;
    uvs[uvBase + 3] = vCoord;

    if (i < count) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;
      indices.push(v0, v1, v2);
      indices.push(v1, v3, v2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an in-memory CanvasTexture representing illuminated glass skyscraper facades.
 */
function createCityFacadeTexture(isDark: boolean): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = isDark ? "#0b0e16" : "#334155";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cols = 14;
  const rows = 36;
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hash = ((r * 41 + c * 19 + (r ^ c) * 7) % 100) / 100;
      const lit = hash > (isDark ? 0.58 : 0.78);
      if (lit) {
        if (hash > 0.93) {
          ctx.fillStyle = "#ed5d31";
        } else if (hash > 0.8) {
          ctx.fillStyle = isDark ? "#bae6fd" : "#e2e8f0";
        } else {
          ctx.fillStyle = isDark ? "#fde68a" : "#f8fafc";
        }
      } else {
        ctx.fillStyle = isDark ? "#131824" : "#475569";
      }
      ctx.fillRect(c * cellW + 3, r * cellH + 3, cellW - 6, cellH - 6);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function StreetCircuitEnvironment({
  isDark,
  countdownStage,
}: {
  isDark: boolean;
  countdownStage: number;
}) {
  // Load Poly Haven 1K PBR asphalt textures from local public/textures/
  const asphaltTextures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const configure = (path: string, srgb: boolean) => {
      const t = loader.load(path);
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    return {
      map: configure("/textures/asphalt_diff.jpg", true),
      normalMap: configure("/textures/asphalt_nor.jpg", false),
      roughnessMap: configure("/textures/asphalt_rough.jpg", false),
    };
  }, []);

  const facadeTexture = useMemo(() => createCityFacadeTexture(isDark), [isDark]);

  useEffect(() => {
    return () => {
      asphaltTextures.map.dispose();
      asphaltTextures.normalMap.dispose();
      asphaltTextures.roughnessMap.dispose();
    };
  }, [asphaltTextures]);

  useEffect(() => {
    return () => {
      facadeTexture?.dispose();
    };
  }, [facadeTexture]);

  const geometries = useMemo(() => {
    const samples = TRACK_DATA.samples;
    const repeatV = Math.max(40, Math.round(TRACK_DATA.totalLength / 6));
    const roadTint: [number, number, number] = isDark ? [0.65, 0.67, 0.72] : [0.9, 0.92, 0.95];
    const orange: [number, number, number] = [0.93, 0.36, 0.19];
    const cream: [number, number, number] = [0.95, 0.95, 0.96];
    const railMetal: [number, number, number] = isDark ? [0.18, 0.2, 0.25] : [0.46, 0.49, 0.54];
    const deckUnder: [number, number, number] = isDark ? [0.06, 0.07, 0.09] : [0.55, 0.57, 0.62];

    const asphalt = buildClosedRibbonGeometry(
      samples,
      -ROAD_HALF_WIDTH,
      ROAD_HALF_WIDTH,
      0,
      0,
      3,
      repeatV,
      () => roadTint
    );

    const underDeck = buildClosedRibbonGeometry(
      samples,
      -ROAD_HALF_WIDTH - 1.0,
      ROAD_HALF_WIDTH + 1.0,
      -0.42,
      -0.42,
      1,
      1,
      () => deckUnder
    );

    const leftCurb = buildClosedRibbonGeometry(
      samples,
      -ROAD_HALF_WIDTH - 0.74,
      -ROAD_HALF_WIDTH + 0.16,
      0.022,
      0.015,
      1,
      1,
      (idx) => (Math.floor(idx / 2) % 2 === 0 ? orange : cream)
    );

    const rightCurb = buildClosedRibbonGeometry(
      samples,
      ROAD_HALF_WIDTH - 0.16,
      ROAD_HALF_WIDTH + 0.74,
      0.015,
      0.022,
      1,
      1,
      (idx) => (Math.floor(idx / 2) % 2 === 0 ? orange : cream)
    );

    const leftWall = buildClosedRibbonGeometry(
      samples,
      -ROAD_HALF_WIDTH - 0.94,
      -ROAD_HALF_WIDTH - 0.74,
      0.76,
      -0.38,
      1,
      1,
      () => railMetal
    );

    const rightWall = buildClosedRibbonGeometry(
      samples,
      ROAD_HALF_WIDTH + 0.74,
      ROAD_HALF_WIDTH + 0.94,
      -0.38,
      0.76,
      1,
      1,
      () => railMetal
    );

    const centerDashedIndices: number[] = [];
    const dashPositions: number[] = [];
    for (let i = 0; i < TRACK_SAMPLES; i += 4) {
      const a = samples[i];
      const b = samples[(i + 2) % TRACK_SAMPLES];
      const vStart = dashPositions.length / 3;
      const w = 0.13;
      dashPositions.push(
        a.point.x - a.right.x * w,
        a.point.y + 0.02,
        a.point.z - a.right.z * w,
        a.point.x + a.right.x * w,
        a.point.y + 0.02,
        a.point.z + a.right.z * w,
        b.point.x - b.right.x * w,
        b.point.y + 0.02,
        b.point.z - b.right.z * w,
        b.point.x + b.right.x * w,
        b.point.y + 0.02,
        b.point.z + b.right.z * w
      );
      centerDashedIndices.push(vStart, vStart + 1, vStart + 2, vStart + 1, vStart + 3, vStart + 2);
    }
    const centerLine = new THREE.BufferGeometry();
    centerLine.setAttribute("position", new THREE.Float32BufferAttribute(dashPositions, 3));
    centerLine.setIndex(centerDashedIndices);
    centerLine.computeVertexNormals();

    return { asphalt, underDeck, leftCurb, rightCurb, leftWall, rightWall, centerLine };
  }, [isDark]);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((g) => g.dispose());
    };
  }, [geometries]);

  const startSample = useMemo(() => getTrackSampleAt(0), []);
  const startYaw = useMemo(
    () => headingFromTangent(startSample.tangent.x, startSample.tangent.z),
    [startSample]
  );

  const gPostX = ROAD_HALF_WIDTH + 1.05;
  const gSpanW = (ROAD_HALF_WIDTH + 1.45) * 2;
  const checkerCount = 15;
  const checkerWidth = (ROAD_HALF_WIDTH * 1.92) / checkerCount;

  return (
    <group>
      {/* Solid ground terrain beneath elevated viaducts & cityscape across 1.31 km circuit */}
      <mesh position={[138, -4.3, -6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial
          color={isDark ? "#080b11" : "#cfd8e3"}
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* PBR Asphalt Circuit Ribbon */}
      <mesh geometry={geometries.asphalt} receiveShadow>
        <meshStandardMaterial
          map={asphaltTextures.map}
          normalMap={asphaltTextures.normalMap}
          roughnessMap={asphaltTextures.roughnessMap}
          vertexColors
          roughness={0.85}
          metalness={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={geometries.underDeck}>
        <meshStandardMaterial vertexColors roughness={0.88} metalness={0.14} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometries.leftCurb} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.5} metalness={0.12} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometries.rightCurb} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.5} metalness={0.12} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometries.leftWall}>
        <meshStandardMaterial vertexColors roughness={0.35} metalness={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometries.rightWall}>
        <meshStandardMaterial vertexColors roughness={0.35} metalness={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometries.centerLine}>
        <meshStandardMaterial
          color={isDark ? "#64748b" : "#e2e8f0"}
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* F1 Start / Finish Gantry with 5-Pod Race Start Lights */}
      <group
        position={[startSample.point.x, startSample.point.y, startSample.point.z]}
        rotation={[0, startYaw, 0]}
      >
        {Array.from({ length: checkerCount }).map((_, idx) => {
          const x = (idx - (checkerCount - 1) / 2) * checkerWidth;
          return (
            <React.Fragment key={idx}>
              <mesh position={[x, 0.03, -0.45]}>
                <boxGeometry args={[checkerWidth, 0.02, 0.9]} />
                <meshStandardMaterial color={idx % 2 === 0 ? "#ffffff" : "#18181b"} roughness={0.5} />
              </mesh>
              <mesh position={[x, 0.03, 0.45]}>
                <boxGeometry args={[checkerWidth, 0.02, 0.9]} />
                <meshStandardMaterial color={idx % 2 === 0 ? "#18181b" : "#ffffff"} roughness={0.5} />
              </mesh>
            </React.Fragment>
          );
        })}
        <mesh position={[-gPostX, 3.4, 0]} castShadow>
          <boxGeometry args={[0.85, 7.0, 0.95]} />
          <meshStandardMaterial color={isDark ? "#27272a" : "#475569"} metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[gPostX, 3.4, 0]} castShadow>
          <boxGeometry args={[0.85, 7.0, 0.95]} />
          <meshStandardMaterial color={isDark ? "#27272a" : "#475569"} metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0, 6.55, 0]} castShadow>
          <boxGeometry args={[gSpanW, 1.0, 1.15]} />
          <meshStandardMaterial color={isDark ? "#18181b" : "#1e293b"} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* 5 Authentic F1 Start Signal Pods */}
        {[-3.2, -1.6, 0, 1.6, 3.2].map((podX, idx) => {
          const isGo = countdownStage >= 3;
          const podActiveRed =
            countdownStage === 0
              ? idx === 0 || idx === 1
              : countdownStage === 1
              ? idx <= 3
              : countdownStage === 2;
          const lightColor = isGo ? "#10b981" : podActiveRed ? "#ff2424" : "#27272a";
          const intensity = isGo || podActiveRed ? 2.6 : 0;
          return (
            <mesh key={podX} position={[podX, 6.52, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.14, 16]} />
              <meshStandardMaterial
                color={lightColor}
                emissive={lightColor}
                emissiveIntensity={intensity}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* Overhead Telemetry Arches across Sectors */}
      {SECTOR_ARCHES.map((arch) => {
        const s = getTrackSampleAt(arch.u);
        const yaw = headingFromTangent(s.tangent.x, s.tangent.z);
        return (
          <group key={arch.id} position={[s.point.x, s.point.y, s.point.z]} rotation={[0, yaw, 0]}>
            <mesh position={[-gPostX, 3.2, 0]} castShadow>
              <boxGeometry args={[0.65, 6.4, 0.7]} />
              <meshStandardMaterial color={isDark ? "#1e293b" : "#475569"} metalness={0.5} roughness={0.35} />
            </mesh>
            <mesh position={[gPostX, 3.2, 0]} castShadow>
              <boxGeometry args={[0.65, 6.4, 0.7]} />
              <meshStandardMaterial color={isDark ? "#1e293b" : "#475569"} metalness={0.5} roughness={0.35} />
            </mesh>
            <mesh position={[0, 6.2, 0]}>
              <boxGeometry args={[gSpanW - 0.3, 0.8, 0.85]} />
              <meshStandardMaterial color={isDark ? "#0f172a" : "#334155"} metalness={0.55} roughness={0.3} />
            </mesh>
            <mesh position={[0, 6.2, 0.45]}>
              <boxGeometry args={[ROAD_HALF_WIDTH * 1.65, 0.18, 0.06]} />
              <meshStandardMaterial
                color="#ed5d31"
                emissive="#ed5d31"
                emissiveIntensity={1.9}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* Boost Pads */}
      {BOOST_PADS.map((pad) => {
        const sample = getTrackSampleAt(pad.u);
        const yaw = headingFromTangent(sample.tangent.x, sample.tangent.z);
        const pitch = Math.asin(Math.max(-0.5, Math.min(0.5, sample.tangent.y)));
        return (
          <group
            key={pad.id}
            position={[
              sample.point.x + sample.right.x * pad.lateral,
              sample.point.y + 0.035,
              sample.point.z + sample.right.z * pad.lateral,
            ]}
            rotation={[0, yaw, 0]}
          >
            <group rotation={[pitch, 0, 0]}>
              <mesh>
                <boxGeometry args={[pad.width, 0.03, 5.2]} />
                <meshStandardMaterial
                  color="#ed5d31"
                  emissive="#ed5d31"
                  emissiveIntensity={1.6}
                  toneMapped={false}
                />
              </mesh>
              <mesh position={[0, 0.025, -1.1]}>
                <boxGeometry args={[pad.width * 0.65, 0.02, 0.45]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#38bdf8"
                  emissiveIntensity={2.2}
                  toneMapped={false}
                />
              </mesh>
              <mesh position={[0, 0.025, 0.6]}>
                <boxGeometry args={[pad.width * 0.65, 0.02, 0.45]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#38bdf8"
                  emissiveIntensity={2.2}
                  toneMapped={false}
                />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* Grandstand Bleachers along Pit Straight */}
      {TRACK_GRANDSTANDS.map((stand) => (
        <group
          key={stand.id}
          position={[stand.x, stand.y, stand.z]}
          rotation={[0, stand.yaw, 0]}
        >
          {[0, 1, 2, 3].map((tier) => (
            <mesh
              key={tier}
              position={[-tier * 1.1, 0.55 + tier * 0.72, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[1.2, 0.68, stand.length]} />
              <meshStandardMaterial
                color={tier % 2 === 0 ? (isDark ? "#27272a" : "#64748b") : "#ed5d31"}
                roughness={0.65}
              />
            </mesh>
          ))}
          <mesh position={[-2.2, 4.4, 0]} rotation={[0, 0, -0.15]} castShadow>
            <boxGeometry args={[5.4, 0.22, stand.length + 0.6]} />
            <meshStandardMaterial
              color={isDark ? "#18181b" : "#334155"}
              metalness={0.45}
              roughness={0.35}
            />
          </mesh>
        </group>
      ))}

      {/* Street Circuit Floodlight Poles */}
      {TRACK_LIGHT_POLES.map((pole) => (
        <group key={pole.id} position={[pole.x, pole.y, pole.z]} rotation={[0, pole.yaw, 0]}>
          <mesh position={[0, 3.6, 0]}>
            <cylinderGeometry args={[0.1, 0.14, 7.2, 8]} />
            <meshStandardMaterial color={isDark ? "#27272a" : "#64748b"} metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[-pole.side * 1.15, 7.1, 0]}>
            <boxGeometry args={[2.5, 0.14, 0.2]} />
            <meshStandardMaterial color={isDark ? "#27272a" : "#64748b"} metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[-pole.side * 1.9, 6.98, 0]}>
            <boxGeometry args={[0.95, 0.12, 0.32]} />
            <meshStandardMaterial
              color="#fff7ed"
              emissive={isDark ? "#ffedd5" : "#e2e8f0"}
              emissiveIntensity={isDark ? 2.1 : 0.7}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* City Skyscrapers & Towers */}
      {TRACK_BUILDINGS.map((b) => (
        <group key={b.id} position={[b.x, b.y, b.z]} rotation={[0, b.yaw, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.width, b.height, b.depth]} />
            <meshStandardMaterial
              map={facadeTexture}
              emissiveMap={facadeTexture}
              emissive={isDark ? "#ffffff" : "#000000"}
              emissiveIntensity={isDark ? 0.65 : 0}
              roughness={isDark ? 0.45 : 0.32}
              metalness={isDark ? 0.35 : 0.55}
            />
          </mesh>
          {b.crownHeight > 0 && (
            <mesh position={[0, b.height * 0.5 + b.crownHeight * 0.5, 0]}>
              <boxGeometry args={[b.width * 0.68, b.crownHeight, b.depth * 0.68]} />
              <meshStandardMaterial
                color={isDark ? "#18181b" : "#475569"}
                roughness={0.45}
                metalness={0.45}
              />
            </mesh>
          )}
          {b.hasSpire && (
            <>
              <mesh position={[0, b.height * 0.5 + b.crownHeight + 2.4, 0]}>
                <cylinderGeometry args={[0.08, 0.16, 4.8, 8]} />
                <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
              </mesh>
              <mesh position={[0, b.height * 0.5 + b.crownHeight + 4.9, 0]}>
                <sphereGeometry args={[0.24, 8, 8]} />
                <meshStandardMaterial
                  color="#ed5d31"
                  emissive="#ed5d31"
                  emissiveIntensity={2.2}
                  toneMapped={false}
                />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

type ParticleKind = "smoke" | "spark" | "debris";

interface DriftParticle {
  active: boolean;
  kind: ParticleKind;
  life: number;
  maxLife: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  floorY: number;
  color: string;
  size: number;
}

interface SkidMarkEntry {
  x: number;
  y: number;
  z: number;
  yaw: number;
  len: number;
}

const PARTICLE_COUNT = 180;
const SKIDMARK_COUNT = 240;

function RaceWorld({
  runId,
  phase,
  cameraSettings,
  isDark,
  muted,
  mobileControlRef,
  audioEvents,
  onPhaseChange,
  onTelemetry,
  onRequestRestart,
}: RaceArenaCanvasProps) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const initialCars = useMemo(() => createInitialRacers(), []);
  const carsRef = useRef<RacerState[]>(initialCars);
  const carMeshRefs = useRef<Record<string, F1CarMeshRefs>>({});

  const audioCtrlRef = useRef<F1AudioController | null>(null);

  const particlesRef = useRef<InstancedMeshRef>(null);
  const skidmarksRef = useRef<InstancedMeshRef>(null);
  const impactLightRef = useRef<THREE.PointLight>(null);

  const particlePool = useRef<DriftParticle[]>(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      active: false,
      kind: "smoke",
      life: 0,
      maxLife: 0.4,
      x: 0,
      y: -50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      floorY: 0,
      color: "#ff9b42",
      size: 0.16,
    }))
  );
  const particleCursorRef = useRef(0);

  const skidPool = useRef<SkidMarkEntry[]>(
    Array.from({ length: SKIDMARK_COUNT }, () => ({
      x: 0,
      y: -120,
      z: 0,
      yaw: 0,
      len: 1.2,
    }))
  );
  const skidCursorRef = useRef(0);
  const skidTickRef = useRef(0);

  const impactFlashRef = useRef(0);
  const camShakeRef = useRef(0);
  const camKnockRef = useRef(new THREE.Vector3());

  const dummyObj = useRef(new THREE.Object3D());
  const tmpColor = useRef(new THREE.Color());
  const camQuatTmp = useRef(new THREE.Quaternion());
  const camEulerTmp = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const camLocalPosTmp = useRef(new THREE.Vector3());
  const camLocalTargetTmp = useRef(new THREE.Vector3());

  const phaseRef = useRef<RacePhase>(phase);
  const cameraSettingsRef = useRef<CameraSettings>(cameraSettings);
  const prevPresetRef = useRef<CameraPreset>(cameraSettings.preset);
  const countdownTimerRef = useRef(0);
  const lastCountdownStageRef = useRef(-1);
  const raceElapsedMsRef = useRef(0);
  const lastHudSyncAtRef = useRef(0);
  const lastBumpSoundAtRef = useRef(0);

  const [countdownStage, setCountdownStage] = useState(0);

  const keyInputRef = useRef({
    throttleUp: false,
    throttleDown: false,
    left: false,
    right: false,
    drift: false,
    boost: false,
    lookLeft: false,
    lookRight: false,
    lookBack: false,
  });

  useEffect(() => {
    phaseRef.current = phase;
    if (phase === "paused" || phase === "idle" || phase === "finished") {
      const k = keyInputRef.current;
      k.throttleUp = false;
      k.throttleDown = false;
      k.left = false;
      k.right = false;
      k.drift = false;
      k.boost = false;
      k.lookLeft = false;
      k.lookRight = false;
      k.lookBack = false;
    }
  }, [phase]);

  useEffect(() => {
    cameraSettingsRef.current = cameraSettings;
  }, [cameraSettings]);

  const camPosRef = useRef(new THREE.Vector3());
  const camTargetRef = useRef(new THREE.Vector3());
  const camHeadingRef = useRef(0);
  const camLookStateRef = useRef<CameraLookState>(createInitialCameraLookState());
  const camChaseDistRef = useRef(6.2);
  const camChaseHeightRef = useRef(2.28);
  const camCornerSwingRef = useRef(0);
  const camTargetLeadRef = useRef(0);
  const camAnchorYRef = useRef(0);

  // Initialize Web Audio F1 Engine controller & unlock on user interaction
  useEffect(() => {
    const ctrl = new F1AudioController();
    audioCtrlRef.current = ctrl;

    const unlock = () => ctrl.unlock();
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      ctrl.dispose();
      audioCtrlRef.current = null;
    };
  }, []);

  // Reset full grid & timers cleanly whenever runId increments
  useEffect(() => {
    const fresh = createInitialRacers();
    carsRef.current = fresh;
    countdownTimerRef.current = 0;
    lastCountdownStageRef.current = -1;
    raceElapsedMsRef.current = 0;
    lastHudSyncAtRef.current = 0;
    for (const p of particlePool.current) {
      p.active = false;
    }
    for (const sm of skidPool.current) {
      sm.y = -120;
    }
    impactFlashRef.current = 0;
    camShakeRef.current = 0;
    camKnockRef.current.set(0, 0, 0);

    const player = fresh.find((r) => r.isPlayer)!;
    const fwd = forwardFromHeading(player.heading);
    camHeadingRef.current = player.heading;
    camLookStateRef.current = createInitialCameraLookState();
    camChaseDistRef.current = 6.2;
    camChaseHeightRef.current = 2.28;
    camCornerSwingRef.current = 0;
    camTargetLeadRef.current = 0;
    camAnchorYRef.current = player.y;
    camPosRef.current.set(player.x - fwd.x * 6.5, player.y + 2.4, player.z - fwd.z * 6.5);
    camTargetRef.current.set(player.x + fwd.x * 6.8, player.y + 0.88, player.z + fwd.z * 6.8);
    queueMicrotask(() => {
      setCountdownStage(0);
    });
  }, [runId]);

  // Keyboard controls (WASD for driving; Arrow Left/Right/Down for smooth camera look)
  useEffect(() => {
    const k = keyInputRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case "KeyW":
          k.throttleUp = true;
          break;
        case "KeyS":
          k.throttleDown = true;
          break;
        case "KeyA":
          k.left = true;
          break;
        case "KeyD":
          k.right = true;
          break;
        case "ArrowLeft":
          e.preventDefault();
          k.lookLeft = true;
          break;
        case "ArrowRight":
          e.preventDefault();
          k.lookRight = true;
          break;
        case "ArrowDown":
          e.preventDefault();
          k.lookBack = true;
          break;
        case "ArrowUp":
          e.preventDefault();
          break;
        case "ShiftLeft":
        case "ShiftRight":
          k.drift = true;
          break;
        case "Space":
          e.preventDefault();
          k.boost = true;
          break;
        case "KeyR":
          if (!e.repeat) onRequestRestart();
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          k.throttleUp = false;
          break;
        case "KeyS":
          k.throttleDown = false;
          break;
        case "KeyA":
          k.left = false;
          break;
        case "KeyD":
          k.right = false;
          break;
        case "ArrowLeft":
          k.lookLeft = false;
          break;
        case "ArrowRight":
          k.lookRight = false;
          break;
        case "ArrowDown":
          k.lookBack = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          k.drift = false;
          break;
        case "Space":
          k.boost = false;
          break;
      }
    };

    const onBlur = () => {
      k.throttleUp = false;
      k.throttleDown = false;
      k.left = false;
      k.right = false;
      k.drift = false;
      k.boost = false;
      k.lookLeft = false;
      k.lookRight = false;
      k.lookBack = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [onRequestRestart]);

  const spawnParticle = (
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    kind: ParticleKind,
    floorY: number,
    color?: string,
    size?: number
  ) => {
    const pool = particlePool.current;
    const p = pool[particleCursorRef.current];
    particleCursorRef.current = (particleCursorRef.current + 1) % PARTICLE_COUNT;
    p.active = true;
    p.kind = kind;
    p.life = 0;
    p.maxLife = kind === "spark" ? 0.24 + Math.random() * 0.22 : kind === "debris" ? 0.52 + Math.random() * 0.25 : 0.48 + Math.random() * 0.2;
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = vx;
    p.vy = vy;
    p.vz = vz;
    p.floorY = floorY;
    p.color =
      color ??
      (kind === "spark"
        ? Math.random() > 0.35
          ? "#ffb347"
          : "#fff3c4"
        : kind === "debris"
          ? "#18181b"
          : isDark
            ? "#cbd5e1"
            : "#94a3b8");
    p.size = size ?? (kind === "spark" ? 0.11 : kind === "debris" ? 0.14 : 0.24);
  };

  const spawnImpactBurst = (
    car: RacerState,
    severity: number,
    isWallImpact: boolean
  ) => {
    const sparkCount = Math.round(10 + severity * 18);
    const debrisCount = Math.round(severity * 7);
    const ix = car.lastImpactX;
    const iz = car.lastImpactZ;
    const nx = car.lastImpactNx;
    const nz = car.lastImpactNz;

    for (let s = 0; s < sparkCount; s++) {
      const spread = (Math.random() - 0.5) * 1.4;
      const eject = 6 + severity * 14 + Math.random() * 7;
      spawnParticle(
        ix + (Math.random() - 0.5) * 0.45,
        car.y + 0.24 + Math.random() * 0.32,
        iz + (Math.random() - 0.5) * 0.45,
        car.vx * 0.42 + nx * eject + nz * spread * 6,
        2.5 + Math.random() * (4.5 + severity * 5),
        car.vz * 0.42 + nz * eject - nx * spread * 6,
        "spark",
        car.y + 0.04,
        Math.random() > 0.25 ? "#ff9f2e" : "#ffffff",
        0.09 + Math.random() * 0.08
      );
    }

    for (let d = 0; d < debrisCount; d++) {
      const throwSpeed = 4 + severity * 9 + Math.random() * 5;
      spawnParticle(
        ix + (Math.random() - 0.5) * 0.6,
        car.y + 0.35 + Math.random() * 0.25,
        iz + (Math.random() - 0.5) * 0.6,
        car.vx * 0.35 + nx * throwSpeed + (Math.random() - 0.5) * 7,
        3.2 + Math.random() * 5.2,
        car.vz * 0.35 + nz * throwSpeed + (Math.random() - 0.5) * 7,
        "debris",
        car.y + 0.05,
        d % 3 === 0 ? car.color : "#27272a",
        0.13 + Math.random() * 0.08
      );
    }

    const smokeCount = isWallImpact ? 3 + Math.round(severity * 4) : 2 + Math.round(severity * 3);
    for (let m = 0; m < smokeCount; m++) {
      spawnParticle(
        ix + (Math.random() - 0.5) * 0.8,
        car.y + 0.25,
        iz + (Math.random() - 0.5) * 0.8,
        nx * (1.8 + Math.random() * 2.5) + (Math.random() - 0.5) * 2.5,
        1.1 + Math.random() * 1.8,
        nz * (1.8 + Math.random() * 2.5) + (Math.random() - 0.5) * 2.5,
        "smoke",
        car.y + 0.05,
        isDark ? "#94a3b8" : "#cbd5e1",
        0.26 + severity * 0.24
      );
    }
  };

  const stampRearSkidmarks = (car: RacerState) => {
    const fwd = forwardFromHeading(car.heading);
    const rightX = -fwd.z;
    const rightZ = fwd.x;
    const rearX = car.x - fwd.x * 1.38;
    const rearZ = car.z - fwd.z * 1.38;
    const velYaw = car.speed > 4 ? Math.atan2(-car.vx, -car.vz) : car.heading;
    const segLen = Math.max(0.85, Math.min(2.1, car.speed * 0.042));

    for (const side of [-0.76, 0.76] as const) {
      const slot = skidPool.current[skidCursorRef.current];
      skidCursorRef.current = (skidCursorRef.current + 1) % SKIDMARK_COUNT;
      slot.x = rearX + rightX * side;
      slot.y = car.y + 0.018;
      slot.z = rearZ + rightZ * side;
      slot.yaw = velYaw;
      slot.len = segLen;
    }
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const cars = carsRef.current;
    const player = cars.find((c) => c.isPlayer)!;
    const curPhase = phaseRef.current;
    let countdownLabel = "";
    let playerThrottle = 0;

    if (curPhase === "countdown") {
      countdownTimerRef.current += dt;
      const t = countdownTimerRef.current;
      const stage = t < 0.85 ? 0 : t < 1.7 ? 1 : t < 2.55 ? 2 : 3;

      const k = keyInputRef.current;
      const mob = mobileControlRef.current;
      playerThrottle = Math.max(0, Math.min(1, (k.throttleUp ? 1 : 0) + mob.throttle));

      if (stage !== lastCountdownStageRef.current) {
        lastCountdownStageRef.current = stage;
        setCountdownStage(stage);
        if (stage < 3) {
          audioEvents.onCountdownStep(false);
        } else {
          audioEvents.onCountdownStep(true);
          phaseRef.current = "racing";
          onPhaseChange("racing");
        }
      }
      countdownLabel = stage === 0 ? "3" : stage === 1 ? "2" : stage === 2 ? "1" : "LIGHTS OUT!";
    } else if (curPhase === "racing") {
      raceElapsedMsRef.current += dt * 1000;

      const k = keyInputRef.current;
      const mob = mobileControlRef.current;
      const playerInput: ControlInput = {
        throttle: Math.max(
          -1,
          Math.min(1, (k.throttleUp ? 1 : 0) - (k.throttleDown ? 1 : 0) + mob.throttle)
        ),
        steer: Math.max(-1, Math.min(1, (k.right ? 1 : 0) - (k.left ? 1 : 0) + mob.steer)),
        drift: k.drift || mob.drift,
        useBoost: k.boost || mob.useBoost,
      };
      playerThrottle = playerInput.throttle;

      const wasPlayerBoosting = player.isBoosting;
      const playerEvents = stepCarPhysics(player, playerInput, dt, raceElapsedMsRef.current);

      if (
        playerEvents.hitBoostPad ||
        playerEvents.triggeredDriftBurst ||
        (!wasPlayerBoosting && player.isBoosting)
      ) {
        audioEvents.onBoost();
      }
      if (playerEvents.lapCompleted && !playerEvents.justFinished) {
        audioEvents.onLap(player.lap === TOTAL_LAPS);
      }

      if (playerEvents.hitWall) {
        const sev = Math.max(0.25, playerEvents.impactSeverity);
        spawnImpactBurst(player, sev, true);
        impactFlashRef.current = Math.max(impactFlashRef.current, sev);
        camShakeRef.current = Math.max(camShakeRef.current, 0.35 + sev * 0.75);
        camKnockRef.current.set(
          -player.lastImpactNx * (0.28 + sev * 0.55),
          0.08 + sev * 0.14,
          -player.lastImpactNz * (0.28 + sev * 0.55)
        );
      }

      // Step AI opponents (emit sparks/smoke too if they scrape or crash!)
      for (const car of cars) {
        if (car.isPlayer) continue;
        const aiInput = stepAiDecision(car, cars, player.progress);
        const aiEvents = stepCarPhysics(car, aiInput, dt, raceElapsedMsRef.current);
        if (aiEvents.hitWall && aiEvents.impactSeverity > 0.25) {
          spawnImpactBurst(car, aiEvents.impactSeverity, true);
        }
      }

      // Multi-zone F1 bodywork contact & collision impulse resolution
      const prevPlayerIntensity = player.impactIntensity;
      const bumped = resolveCarCollisions(cars);
      const nowMs = performance.now();

      if (bumped) {
        for (const car of cars) {
          if (car.impactIntensity > 0.2) {
            spawnImpactBurst(car, car.impactIntensity, false);
          }
        }
      }

      const newPlayerCarHit = bumped && player.impactIntensity > Math.max(0.22, prevPlayerIntensity);
      if (newPlayerCarHit) {
        const sev = player.impactIntensity;
        impactFlashRef.current = Math.max(impactFlashRef.current, sev * 0.9);
        camShakeRef.current = Math.max(camShakeRef.current, 0.3 + sev * 0.65);
        camKnockRef.current.set(
          -player.lastImpactNx * (0.25 + sev * 0.5),
          0.06 + sev * 0.1,
          -player.lastImpactNz * (0.25 + sev * 0.5)
        );
      }

      if ((playerEvents.hitWall || newPlayerCarHit) && nowMs - lastBumpSoundAtRef.current > 160) {
        lastBumpSoundAtRef.current = nowMs;
        if (playerEvents.hitWall) {
          audioEvents.onBump(Math.max(0.25, playerEvents.impactSeverity), "wall");
        } else {
          audioEvents.onBump(player.impactIntensity, "car");
        }
      }

      // Finish check
      if (playerEvents.justFinished) {
        phaseRef.current = "finished";
        onPhaseChange("finished");
        const finalStandings = sortRaceStandings(cars);
        const rank = finalStandings.findIndex((c) => c.isPlayer) + 1;
        const racerDots: TelemetryRacerDot[] = finalStandings.map((c, idx) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          x: c.x,
          z: c.z,
          rank: idx + 1,
          isPlayer: c.isPlayer,
          finished: c.finished,
          finishTimeMs: c.finishTimeMs,
        }));
        audioEvents.onFinishRace(
          rank,
          player.finishTimeMs ?? raceElapsedMsRef.current,
          player.bestLapMs,
          player.driftBoostsCount,
          player.wallHits,
          racerDots
        );
      }
    } else if (curPhase === "finished") {
      for (const car of cars) {
        const cruiseInput = stepAiDecision(car, cars, player.progress);
        stepCarPhysics(car, { ...cruiseInput, throttle: 0.4, useBoost: false }, dt, raceElapsedMsRef.current);
      }
    }

    // Continuous wall-grind metallic spark stream, tire drift smoke & asphalt skidmarks
    if (curPhase === "racing" || curPhase === "finished") {
      skidTickRef.current = (skidTickRef.current + 1) % 2;
      for (const car of cars) {
        // Continuous barrier scrape sparks along rail contact flank
        if (car.isScrapingWall && car.speed > 5) {
          const sparkQty = car.speed > 20 ? 3 : 1;
          for (let k = 0; k < sparkQty; k++) {
            spawnParticle(
              car.lastImpactX + (Math.random() - 0.5) * 0.3,
              car.y + 0.18 + Math.random() * 0.25,
              car.lastImpactZ + (Math.random() - 0.5) * 0.3,
              car.vx * 0.22 + car.lastImpactNx * (2 + Math.random() * 4.5) + (Math.random() - 0.5) * 3,
              1.6 + Math.random() * 3.8,
              car.vz * 0.22 + car.lastImpactNz * (2 + Math.random() * 4.5) + (Math.random() - 0.5) * 3,
              "spark",
              car.y + 0.04,
              Math.random() > 0.3 ? "#ffa73b" : "#fff7d6",
              0.08 + Math.random() * 0.05
            );
          }
          if (car.isPlayer && car.speed > 14 && skidTickRef.current === 0) {
            impactFlashRef.current = Math.max(impactFlashRef.current, 0.22);
          }
        }

        const highSlip = Math.abs(car.lateralSlipSpeed) > 4.0 && car.speed > 16;
        const hardBrakeLock = car.isBraking && car.speed > 20;
        if (car.isDrifting || highSlip || hardBrakeLock) {
          if (skidTickRef.current === 0) {
            stampRearSkidmarks(car);
          }
          if (Math.random() < (car.isDrifting ? 0.72 : 0.42)) {
            const fwd = forwardFromHeading(car.heading);
            const rx = -fwd.z;
            const rz = fwd.x;
            for (const side of [-0.74, 0.74] as const) {
              spawnParticle(
                car.x - fwd.x * 1.48 + rx * side + (Math.random() - 0.5) * 0.25,
                car.y + 0.15,
                car.z - fwd.z * 1.48 + rz * side + (Math.random() - 0.5) * 0.25,
                (Math.random() - 0.5) * 1.8,
                0.75 + Math.random() * 1.1,
                (Math.random() - 0.5) * 1.8,
                "smoke",
                car.y + 0.05,
                isDark ? "#cbd5e1" : "#94a3b8",
                car.isDrifting ? 0.24 : 0.17
              );
            }
          }
        }
      }
    }

    // Decay transient visual impact flash & camera shake cleanly
    if (curPhase !== "paused") {
      impactFlashRef.current = Math.max(0, impactFlashRef.current - dt * 4.2);
      camShakeRef.current = Math.max(0, camShakeRef.current - dt * 3.1);
      camKnockRef.current.multiplyScalar(Math.exp(-dt * 9.5));
    }

    // Dynamic spark illumination flash point light on impact
    if (impactLightRef.current) {
      const flash = impactFlashRef.current;
      impactLightRef.current.intensity = flash > 0.02 ? flash * 14 : 0;
      impactLightRef.current.position.set(
        player.lastImpactX,
        player.y + 0.75,
        player.lastImpactZ
      );
    }

    // Render asphalt tire skidmarks pool
    const skidMesh = skidmarksRef.current;
    if (skidMesh) {
      const dummy = dummyObj.current;
      const skids = skidPool.current;
      for (let i = 0; i < SKIDMARK_COUNT; i++) {
        const sm = skids[i];
        if (sm.y < -50) {
          dummy.position.set(0, -120, 0);
          dummy.scale.setScalar(0.001);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          skidMesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
        dummy.position.set(sm.x, sm.y, sm.z);
        dummy.rotation.set(0, sm.yaw, 0);
        dummy.scale.set(1, 1, sm.len);
        dummy.updateMatrix();
        skidMesh.setMatrixAt(i, dummy.matrix);
      }
      skidMesh.instanceMatrix.needsUpdate = true;
    }

    // Update instanced particle pool (sparks bounce off asphalt, debris tumbles, smoke swells)
    const instMesh = particlesRef.current;
    if (instMesh && curPhase !== "paused") {
      const dummy = dummyObj.current;
      const pool = particlePool.current;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = pool[i];
        if (!p.active) {
          dummy.position.set(0, -100, 0);
          dummy.scale.setScalar(0.001);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          instMesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          dummy.position.set(0, -100, 0);
          dummy.scale.setScalar(0.001);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          instMesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
        if (p.kind === "spark" || p.kind === "debris") {
          p.vy -= (p.kind === "spark" ? 21 : 24) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          if (p.y < p.floorY && p.vy < 0) {
            p.y = p.floorY;
            p.vy = -p.vy * (p.kind === "spark" ? 0.45 : 0.25);
            p.vx *= 0.78;
            p.vz *= 0.78;
          }
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
        }

        const progress = p.life / p.maxLife;
        dummy.position.set(p.x, p.y, p.z);
        if (p.kind === "spark") {
          const fade = Math.max(0.15, 1 - progress);
          dummy.scale.set(p.size * fade, p.size * fade, p.size * (2.6 + fade * 2.0));
          dummy.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz);
        } else if (p.kind === "debris") {
          const fade = Math.max(0.15, 1 - progress * 0.7);
          dummy.scale.set(p.size * 1.4 * fade, p.size * 0.45 * fade, p.size * 1.1 * fade);
          dummy.rotation.set(p.life * 16, p.life * 11, p.life * 8);
        } else {
          const sc = p.size * (0.8 + progress * 2.1);
          dummy.scale.setScalar(sc);
          dummy.rotation.set(p.life * 2, p.life * 1.4, 0);
        }
        dummy.updateMatrix();
        instMesh.setMatrixAt(i, dummy.matrix);
        tmpColor.current.set(p.color);
        instMesh.setColorAt(i, tmpColor.current);
      }
      instMesh.instanceMatrix.needsUpdate = true;
      if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = true;
    }

    // Apply all 4 F1 car transforms
    for (const car of cars) {
      const meshRefs = carMeshRefs.current[car.id];
      if (!meshRefs?.root) continue;

      meshRefs.root.position.set(car.x, car.y, car.z);
      meshRefs.root.rotation.set(0, car.heading, 0);

      if (meshRefs.chassisTilt) {
        const driftYawOffset = car.isDrifting
          ? -car.driftDirection * Math.min(0.24, car.driftCharge * 0.2)
          : Math.max(-0.14, Math.min(0.14, car.lateralSlipSpeed * 0.015));
        meshRefs.chassisTilt.rotation.set(car.visualPitch, driftYawOffset, car.visualRoll);
      }
      if (meshRefs.frontLeftSteer) meshRefs.frontLeftSteer.rotation.y = -car.steerAngle;
      if (meshRefs.frontRightSteer) meshRefs.frontRightSteer.rotation.y = -car.steerAngle;
      for (const wg of meshRefs.wheelSpinGroups) {
        if (wg) wg.rotation.x = -car.wheelSpin;
      }

      const flameScale = car.isBoosting ? 1.1 + Math.sin(performance.now() * 0.04) * 0.25 : 0.001;
      if (meshRefs.exhaustLeft) {
        meshRefs.exhaustLeft.visible = car.isBoosting;
        meshRefs.exhaustLeft.scale.set(1, flameScale, 1);
      }
      if (meshRefs.exhaustRight) {
        meshRefs.exhaustRight.visible = car.isBoosting;
        meshRefs.exhaustRight.scale.set(1, flameScale, 1);
      }
      for (const mat of meshRefs.tailLightMaterials) {
        mat.emissiveIntensity = car.isBraking ? 3.2 : 1.25;
      }
    }

    // Update Web Audio F1 Engine, Tires, Curbs & Wall Scrape (supports Grid Revving during countdown!)
    audioCtrlRef.current?.update({
      speed: player.speed,
      gear: player.gear,
      rpm: player.rpm,
      throttle: playerThrottle,
      isBoosting: player.isBoosting,
      isDrifting: player.isDrifting,
      driftCharge: player.driftCharge,
      lateralSlip: player.lateralSlipSpeed,
      onCurb: player.onCurb,
      isScrapingWall: player.isScrapingWall,
      wallScrapeIntensity: player.impactIntensity,
      gridRevving: curPhase === "countdown",
      active: curPhase === "racing",
      muted,
    });

    // Multi-angle configurable camera system with impact shake, G-force lean & smooth Arrow-key look
    const camCfg = cameraSettingsRef.current;
    const presetChanged = prevPresetRef.current !== camCfg.preset;
    prevPresetRef.current = camCfg.preset;

    if (curPhase === "idle" || curPhase === "paused") {
      camLookStateRef.current = createInitialCameraLookState();
    } else {
      const k = keyInputRef.current;
      stepCameraLook(
        camLookStateRef.current,
        { left: k.lookLeft, right: k.lookRight, back: k.lookBack },
        dt
      );
    }

    const lookYaw = camLookStateRef.current.yaw;
    const { forwardWeight, sideFactor, rearFactor, sideSign } = computeCameraLookFactors(lookYaw);

    const speedRatio = Math.min(1, player.speed / 45);
    const cam = camRef.current;
    const shakeMag = Math.max(camShakeRef.current, player.impactShake);
    const tNow = performance.now() * 0.055;
    const impactJitterX = shakeMag > 0.01 ? Math.sin(tNow * 2.1) * shakeMag * 0.24 : 0;
    const impactJitterY = shakeMag > 0.01 ? Math.cos(tNow * 2.9) * shakeMag * 0.18 : 0;

    if (camCfg.preset === "cockpit" || camCfg.preset === "tcam") {
      const isCockpit = camCfg.preset === "cockpit";
      const gPullZ = Math.max(-0.04, Math.min(0.06, -player.visualPitch * 0.85)) * forwardWeight;
      // Lift & shift cleanly above the airbox / roll hoop as head sweeps toward rear 180 deg
      const localX = impactJitterX * 0.22 + sideSign * sideFactor * (isCockpit ? 0.085 : 0.05);
      const localY =
        (isCockpit ? 0.90 + camCfg.heightOffset * 0.45 : 1.24 + camCfg.heightOffset * 0.55) +
        rearFactor * (isCockpit ? 0.62 : 0.34) +
        impactJitterY * 0.35;
      const localZ =
        (isCockpit ? -0.28 - camCfg.distanceOffset * 0.16 : 0.22 - camCfg.distanceOffset * 0.22) +
        rearFactor * (isCockpit ? 0.85 : 0.30) +
        gPullZ;
      const apexGlanceX =
        player.steerAngle * (isCockpit ? 3.8 : 2.2) * forwardWeight + impactJitterX * 1.4;

      camEulerTmp.current.set(player.visualPitch * 0.46, player.heading, 0, "YXZ");
      camQuatTmp.current.setFromEuler(camEulerTmp.current);

      const shakeY = player.onCurb && player.speed > 12 ? (Math.random() - 0.5) * 0.022 : 0;
      const highSpeedBuzz =
        player.speed > 35 ? (Math.random() - 0.5) * Math.min(0.014, (player.speed - 35) * 0.0008) : 0;

      const lookDist = 20;
      const localLookX = -Math.sin(lookYaw) * lookDist + apexGlanceX + highSpeedBuzz;
      const localLookZ = -Math.cos(lookYaw) * lookDist;
      const localLookY =
        (isCockpit ? 0.56 + camCfg.heightOffset * 0.2 : 0.52 + camCfg.heightOffset * 0.2) +
        sideFactor * 0.32 +
        rearFactor * 0.62;

      camLocalPosTmp.current.set(localX, localY + shakeY, localZ).applyQuaternion(camQuatTmp.current);
      camLocalTargetTmp.current.set(localLookX, localLookY, localLookZ).applyQuaternion(camQuatTmp.current);

      camPosRef.current.set(
        player.x + camLocalPosTmp.current.x + camKnockRef.current.x * 0.32,
        player.y + camLocalPosTmp.current.y + camKnockRef.current.y * 0.3,
        player.z + camLocalPosTmp.current.z + camKnockRef.current.z * 0.32
      );
      camTargetRef.current.set(
        player.x + camLocalTargetTmp.current.x,
        player.y + camLocalTargetTmp.current.y,
        player.z + camLocalTargetTmp.current.z
      );
      camHeadingRef.current = player.heading;

      if (cam) {
        const fwd = forwardFromHeading(player.heading);
        const rollTilt = Math.max(
          -0.095,
          Math.min(0.095, player.visualRoll * 0.48 + impactJitterX * 0.14)
        );
        cam.up
          .set(-fwd.z * Math.sin(rollTilt), Math.cos(rollTilt), fwd.x * Math.sin(rollTilt))
          .normalize();
        cam.position.copy(camPosRef.current);
        cam.lookAt(camTargetRef.current);

        const targetFov =
          (isCockpit ? 68 : 62) + camCfg.fovOffset + speedRatio * 4.5 + (player.isBoosting ? 6.0 : 0);
        if (Math.abs(cam.fov - targetFov) > 0.05) {
          cam.fov += (targetFov - cam.fov) * Math.min(1, dt * 8.0);
          cam.updateProjectionMatrix();
        }
      }
    } else {
      const isWide = camCfg.preset === "wide";
      const camHeadingDiff = normalizeAngle(player.heading - camHeadingRef.current);
      camHeadingRef.current = normalizeAngle(
        camHeadingRef.current + camHeadingDiff * Math.min(1, dt * (isWide ? 5.2 : 6.4))
      );

      const baseDist = isWide ? 9.4 : 6.2;
      const baseHeight = isWide ? 3.45 : 2.28;
      const targetChaseDist =
        (baseDist +
          camCfg.distanceOffset * (isWide ? 1.15 : 1.0) +
          speedRatio * (isWide ? 1.85 : 1.55) +
          (player.isBoosting ? 0.95 : 0) +
          Math.max(0, playerThrottle) * 0.28 -
          (player.isBraking ? 0.34 : 0)) *
        (1 - rearFactor * 0.08);
      const targetChaseHeight =
        baseHeight +
        camCfg.heightOffset +
        speedRatio * 0.14 +
        (player.isBoosting ? 0.12 : 0) +
        rearFactor * 0.34;
      const targetCornerSwing =
        -player.steerAngle * speedRatio * (isWide ? 1.0 : 1.35) * forwardWeight;
      const targetLead = player.steerAngle * speedRatio * 1.1 * forwardWeight;

      if (presetChanged || curPhase === "idle" || curPhase === "paused") {
        camChaseDistRef.current = targetChaseDist;
        camChaseHeightRef.current = targetChaseHeight;
        camCornerSwingRef.current = targetCornerSwing;
        camTargetLeadRef.current = targetLead;
        camAnchorYRef.current = player.y;
      } else {
        const paramAlpha = 1 - Math.exp(-9.0 * dt);
        const yAlpha = 1 - Math.exp(-14.0 * dt);
        camChaseDistRef.current += (targetChaseDist - camChaseDistRef.current) * paramAlpha;
        camChaseHeightRef.current += (targetChaseHeight - camChaseHeightRef.current) * paramAlpha;
        camCornerSwingRef.current += (targetCornerSwing - camCornerSwingRef.current) * paramAlpha;
        camTargetLeadRef.current += (targetLead - camTargetLeadRef.current) * paramAlpha;
        camAnchorYRef.current += (player.y - camAnchorYRef.current) * yAlpha;
      }

      const viewHeading = camHeadingRef.current + lookYaw;
      const camFwd = forwardFromHeading(viewHeading);
      const camRightX = -camFwd.z;
      const camRightZ = camFwd.x;
      const curbShake = player.onCurb && player.speed > 12 ? (Math.random() - 0.5) * 0.048 : 0;

      camPosRef.current.set(
        player.x -
          camFwd.x * camChaseDistRef.current +
          camRightX * camCornerSwingRef.current +
          curbShake +
          impactJitterX +
          camKnockRef.current.x,
        camAnchorYRef.current + camChaseHeightRef.current + curbShake + impactJitterY + camKnockRef.current.y,
        player.z -
          camFwd.z * camChaseDistRef.current +
          camRightZ * camCornerSwingRef.current +
          camKnockRef.current.z
      );
      camTargetRef.current.set(
        player.x + camFwd.x * (isWide ? 9.5 : 6.8) + camRightX * camTargetLeadRef.current + impactJitterX * 0.55,
        camAnchorYRef.current + 0.88 + rearFactor * 0.22 + impactJitterY * 0.45,
        player.z + camFwd.z * (isWide ? 9.5 : 6.8) + camRightZ * camTargetLeadRef.current
      );

      if (cam) {
        cam.up.set(0, 1, 0);
        cam.position.copy(camPosRef.current);
        cam.lookAt(camTargetRef.current);

        const targetFov =
          (isWide ? 55 : 52) + camCfg.fovOffset + speedRatio * 8.0 + (player.isBoosting ? 6.5 : 0);
        if (Math.abs(cam.fov - targetFov) > 0.05) {
          cam.fov += (targetFov - cam.fov) * Math.min(1, dt * 6.5);
          cam.updateProjectionMatrix();
        }
      }
    }

    // Sync HUD telemetry cleanly ~16Hz
    const now = performance.now();
    if (now - lastHudSyncAtRef.current >= 60) {
      lastHudSyncAtRef.current = now;
      const standings = sortRaceStandings(cars);
      const rank = standings.findIndex((c) => c.isPlayer) + 1;

      onTelemetry({
        speedKmh: Math.round(player.speed * 6.2),
        gear: player.gear,
        rpm: player.rpm,
        rank,
        lap: player.lap,
        elapsedMs: raceElapsedMsRef.current,
        bestLapMs: player.bestLapMs,
        boostMeter: player.boostMeter,
        isBoosting: player.isBoosting,
        isDrifting: player.isDrifting,
        driftCharge: player.driftCharge,
        impactIntensity: Math.max(impactFlashRef.current, player.impactIntensity),
        countdownLabel,
        racers: standings.map((c, idx) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          x: c.x,
          z: c.z,
          rank: idx + 1,
          isPlayer: c.isPlayer,
          finished: c.finished,
          finishTimeMs: c.finishTimeMs,
        })),
      });
    }
  });

  const handleRegisterCar = useCallback((id: string, refs: F1CarMeshRefs) => {
    carMeshRefs.current[id] = refs;
  }, []);

  const bgColor = isDark ? "#05070c" : "#cfe0f5";

  return (
    <>
      <PerspectiveCamera
        makeDefault
        ref={camRef}
        fov={52}
        near={0.08}
        far={620}
        position={[3.6, 2.5, 195]}
      />
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 110, 420]} />

      {isDark ? (
        <Stars radius={340} depth={90} count={1800} factor={4.0} saturation={0.25} fade />
      ) : (
        <Sky sunPosition={[160, 75, 45]} turbidity={3.5} rayleigh={0.85} mieCoefficient={0.004} />
      )}

      {/* Offline Studio + City Reflections */}
      <Environment resolution={256} frames={1}>
        <group rotation={[-Math.PI / 3, 0, 0.35]}>
          <Lightformer
            form="rect"
            intensity={isDark ? 3.5 : 2.5}
            color="#ffffff"
            scale={[20, 5, 1]}
            position={[0, 14, -5]}
          />
          <Lightformer
            form="rect"
            intensity={2.6}
            color="#ff7a4d"
            scale={[14, 3, 1]}
            position={[-12, 5, 4]}
          />
          <Lightformer
            form="rect"
            intensity={1.8}
            color={isDark ? "#38bdf8" : "#e0f2fe"}
            scale={[14, 3, 1]}
            position={[12, 5, 4]}
          />
        </group>
      </Environment>

      <ambientLight intensity={isDark ? 0.65 : 0.85} />
      <directionalLight
        position={[180, 180, 40]}
        intensity={isDark ? 2.15 : 1.95}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={10}
        shadow-camera-far={540}
        shadow-camera-left={-290}
        shadow-camera-right={290}
        shadow-camera-top={290}
        shadow-camera-bottom={-290}
      />

      <StreetCircuitEnvironment isDark={isDark} countdownStage={countdownStage} />

      {/* Dynamic Spark Impact Illumination Light */}
      <pointLight
        ref={impactLightRef}
        color="#ff8a34"
        intensity={0}
        distance={14}
        decay={2}
      />

      {/* Asphalt Rubber Skidmarks Pool */}
      <instancedMesh ref={skidmarksRef} args={[undefined, undefined, SKIDMARK_COUNT]} frustumCulled={false}>
        <boxGeometry args={[0.3, 0.014, 1.0]} />
        <meshBasicMaterial color="#09090b" transparent opacity={0.48} depthWrite={false} />
      </instancedMesh>

      {/* Drift Smoke, Collision Sparks & Carbon Debris Pool */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, PARTICLE_COUNT]} frustumCulled={false}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.85} />
      </instancedMesh>

      {initialCars.map((car) => (
        <F1CarModel
          key={car.id}
          carId={car.id}
          color={car.color}
          isPlayer={car.isPlayer}
          isDark={isDark}
          registerRefs={handleRegisterCar}
        />
      ))}

      <EffectComposer multisampling={0}>
        <Bloom
          mipmapBlur
          luminanceThreshold={1.0}
          luminanceSmoothing={0.22}
          intensity={isDark ? 0.72 : 0.38}
        />
      </EffectComposer>
    </>
  );
}

type InstancedMeshRef = THREE.InstancedMesh;

export default function RaceArenaCanvas(props: RaceArenaCanvasProps) {
  const [contextLost, setContextLost] = useState(false);

  if (contextLost) {
    return (
      <div
        className="flex h-full w-full items-center justify-center p-6 text-center text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        WebGL 3D context is unavailable on this device or browser.
      </div>
    );
  }

  return (
    <WebGLErrorBoundary fallbackText="WebGL 3D context is unavailable on this device or browser.">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 52, near: 0.2, far: 280, position: [2.3, 2.8, 88] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (ev) => {
            ev.preventDefault();
            setContextLost(true);
          });
        }}
      >
        <RaceWorld {...props} />
      </Canvas>
    </WebGLErrorBoundary>
  );
}
