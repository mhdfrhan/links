"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  BoltIcon,
  PauseIcon,
  PlayIcon,
  TrophyIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "@/app/games/_components/GameShell";
import type {
  CameraPreset,
  CameraSettings,
  RaceAudioEvents,
  RacePhase,
  RaceTelemetrySnapshot,
  TelemetryRacerDot,
} from "@/app/games/race/RaceArenaCanvas";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import {
  type ControlInput,
  type RaceScoreBreakdown,
  buildTrackSvgPath,
  calculateRaceScore,
  formatRaceTime,
  mapPointToSvg,
} from "@/lib/games/raceEngine";
import { TOTAL_LAPS, TRACK_DATA } from "@/lib/games/raceTrack";
import {
  playBoostSound,
  playBumpSound,
  playCountdownBeep,
  playLapSound,
  playVictorySound,
} from "@/lib/games/sound";
import { useBestScore, useBestTimeMs } from "@/lib/games/useBestScore";

const RaceArenaCanvas = dynamic(() => import("./RaceArenaCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full w-full items-center justify-center text-xs tracking-widest uppercase"
      style={{ color: "var(--text-secondary)" }}
    >
      Loading 3D Circuit Engine...
    </div>
  ),
});

const MINIMAP_SIZE = 124;
const MINIMAP_PATH = buildTrackSvgPath(MINIMAP_SIZE, MINIMAP_SIZE, 12);
const TRACK_LENGTH_KM = (TRACK_DATA.totalLength / 1000).toFixed(2);

const RANK_ORDINAL = ["1ST", "2ND", "3RD", "4TH"] as const;

const CAMERA_PRESET_ORDER: readonly CameraPreset[] = ["chase", "wide", "tcam", "cockpit"];

const CAMERA_META: Record<
  CameraPreset,
  { idLabel: string; enLabel: string; idDesc: string; enDesc: string }
> = {
  chase: {
    idLabel: "Belakang",
    enLabel: "Chase",
    idDesc: "Kamera belakang dinamis ala Horizon",
    enDesc: "Dynamic third-person Horizon chase",
  },
  wide: {
    idLabel: "Jauh",
    enLabel: "Wide",
    idDesc: "Jarak jauh untuk membaca tikungan & lawan",
    enDesc: "Wide tactical view for traffic & apexes",
  },
  tcam: {
    idLabel: "Atap F1",
    enLabel: "T-Cam",
    idDesc: "Kamera pod udara di atas kokpit F1",
    enDesc: "Overhead F1 airbox broadcast cam",
  },
  cockpit: {
    idLabel: "Kokpit 1P",
    enLabel: "Cockpit",
    idDesc: "First-person langsung dari kursi pengemudi",
    enDesc: "First-person driver visor perspective",
  },
};

const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  preset: "chase",
  heightOffset: 0,
  distanceOffset: 0,
  fovOffset: 0,
};

interface FinishSummary {
  rank: number;
  totalTimeMs: number;
  bestLapMs: number | null;
  breakdown: RaceScoreBreakdown;
  standings: TelemetryRacerDot[];
  isNewBestScore: boolean;
  isNewBestTime: boolean;
}

const INITIAL_TELEMETRY: RaceTelemetrySnapshot = {
  speedKmh: 0,
  gear: 1,
  rpm: 0.22,
  rank: 4,
  lap: 1,
  elapsedMs: 0,
  bestLapMs: null,
  boostMeter: 45,
  isBoosting: false,
  isDrifting: false,
  driftCharge: 0,
  impactIntensity: 0,
  countdownLabel: "3",
  racers: [],
};

export default function RaceArenaPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const { bestScore, commitScore } = useBestScore("hf_game_race_best_score");
  const { bestTimeMs, commitTimeMs } = useBestTimeMs("hf_game_race_best_time_ms");

  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<RacePhase>("idle");
  const prePausePhaseRef = useRef<"countdown" | "racing">("racing");
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>(DEFAULT_CAMERA_SETTINGS);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const [telemetry, setTelemetry] = useState<RaceTelemetrySnapshot>(INITIAL_TELEMETRY);
  const [finishSummary, setFinishSummary] = useState<FinishSummary | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const showCameraNotice = useCallback((preset: CameraPreset) => {
    const meta = CAMERA_META[preset];
    setCameraNotice(`${meta.enLabel.toUpperCase()} — ${meta.idLabel.toUpperCase()}`);
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setCameraNotice(null);
    }, 1500);
  }, []);

  const handleCycleCamera = useCallback(() => {
    setCameraSettings((prev) => {
      const idx = CAMERA_PRESET_ORDER.indexOf(prev.preset);
      const next = CAMERA_PRESET_ORDER[(idx + 1) % CAMERA_PRESET_ORDER.length];
      showCameraNotice(next);
      return { ...prev, preset: next };
    });
  }, [showCameraNotice]);

  // Mobile simultaneous multi-touch inputs written into refs cleanly
  const mobileButtonsRef = useRef({
    left: false,
    right: false,
    gas: false,
    brake: false,
    drift: false,
    boost: false,
  });

  const mobileControlRef = useRef<ControlInput>({
    throttle: 0,
    steer: 0,
    drift: false,
    useBoost: false,
  });

  const syncMobileControlVector = useCallback(() => {
    const b = mobileButtonsRef.current;
    mobileControlRef.current.steer = (b.right ? 1 : 0) - (b.left ? 1 : 0);
    mobileControlRef.current.throttle = (b.gas ? 1 : 0) - (b.brake ? 1 : 0);
    mobileControlRef.current.drift = b.drift;
    mobileControlRef.current.useBoost = b.boost;
  }, []);

  const setMobileFlag = useCallback(
    (key: keyof typeof mobileButtonsRef.current, active: boolean) => {
      mobileButtonsRef.current[key] = active;
      syncMobileControlVector();
    },
    [syncMobileControlVector]
  );

  const handleStartRace = useCallback(() => {
    setFinishSummary(null);
    setTelemetry(INITIAL_TELEMETRY);
    setPhase("countdown");
    setRunId((id) => id + 1);
  }, []);

  const handleTogglePause = useCallback(() => {
    setPhase((curr) => {
      if (curr === "countdown" || curr === "racing") {
        prePausePhaseRef.current = curr;
        return "paused";
      }
      if (curr === "paused") {
        return prePausePhaseRef.current;
      }
      return curr;
    });
  }, []);

  const handleRestart = useCallback(() => {
    mobileButtonsRef.current = {
      left: false,
      right: false,
      gas: false,
      brake: false,
      drift: false,
      boost: false,
    };
    syncMobileControlVector();
    setFinishSummary(null);
    setTelemetry(INITIAL_TELEMETRY);
    setPhase("countdown");
    setRunId((id) => id + 1);
  }, [syncMobileControlVector]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "KeyC" && !e.repeat) {
        handleCycleCamera();
      } else if (e.code === "Escape" && !e.repeat) {
        handleTogglePause();
      } else if (e.code === "Enter" && !e.repeat && phase === "idle") {
        handleStartRace();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleCycleCamera, handleStartRace, handleTogglePause, phase]);

  const audioEvents = useMemo<RaceAudioEvents>(
    () => ({
      onCountdownStep: (isGo) => playCountdownBeep(isGo, mutedRef.current),
      onBoost: () => playBoostSound(mutedRef.current),
      onLap: (isFinalLap) => playLapSound(isFinalLap, mutedRef.current),
      onBump: (intensity, kind) => playBumpSound(mutedRef.current, intensity, kind),
      onFinishRace: (
        rank,
        totalTimeMs,
        bestLapMs,
        driftBoostsCount,
        wallHits,
        standings
      ) => {
        const breakdown = calculateRaceScore({
          rank,
          totalTimeSeconds: totalTimeMs / 1000,
          driftBoostsCount,
          wallHits,
        });
        const isNewBestScore = breakdown.total > bestScore;
        const isNewBestTime = bestTimeMs === 0 || totalTimeMs < bestTimeMs;
        commitScore(breakdown.total);
        commitTimeMs(Math.round(totalTimeMs));
        setFinishSummary({
          rank,
          totalTimeMs,
          bestLapMs,
          breakdown,
          standings,
          isNewBestScore,
          isNewBestTime,
        });
        playVictorySound(mutedRef.current);
      },
    }),
    [bestScore, bestTimeMs, commitScore, commitTimeMs]
  );

  const surfaceStyle = {
    borderColor: "var(--border)",
    background: "color-mix(in srgb, var(--bg-primary) 78%, transparent)",
    color: "var(--text-primary)",
  };

  return (
    <GameShell
      code="01"
      titleId="APEX // Balap 3D AI"
      titleEn="APEX // 3D AI Circuit"
      muted={muted}
      onToggleMute={() => setMuted((m) => !m)}
    >
      <div className="relative h-full w-full overflow-hidden select-none">
        {/* WebGL 3D Circuit Viewport */}
        <div className="h-full w-full">
          <RaceArenaCanvas
            runId={runId}
            phase={phase}
            cameraSettings={cameraSettings}
            isDark={isDark}
            muted={muted}
            mobileControlRef={mobileControlRef}
            audioEvents={audioEvents}
            onPhaseChange={setPhase}
            onTelemetry={setTelemetry}
            onRequestRestart={handleRestart}
          />
        </div>

        {/* Dynamic Collision Vignette Flash & High-Speed / Nitro Edge Tunneling */}
        {phase === "racing" && (
          <>
            {telemetry.impactIntensity > 0.14 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-75"
                style={{
                  opacity: Math.min(0.75, telemetry.impactIntensity * 0.85),
                  boxShadow:
                    "inset 0 0 85px rgba(239, 68, 68, 0.72), inset 0 0 28px rgba(251, 146, 60, 0.55)",
                }}
              />
            )}
            {(telemetry.isBoosting || telemetry.speedKmh >= 245) && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
                style={{
                  opacity: telemetry.isBoosting
                    ? 0.45
                    : Math.min(0.26, (telemetry.speedKmh - 245) / 140),
                  background:
                    "radial-gradient(ellipse at center, transparent 58%, rgba(56, 189, 248, 0.22) 100%)",
                }}
              />
            )}
          </>
        )}

        {/* Top Telemetry Bar */}
        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex items-start justify-between gap-2 px-3 sm:px-6">
          {/* Left: Rank, Lap, Time, Live Pack */}
          <div className="flex flex-col gap-2">
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <div
                className="flex items-baseline gap-1.5 border px-3 py-1.5 backdrop-blur-md"
                style={surfaceStyle}
              >
                <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "var(--text-secondary)" }}>
                  POS
                </span>
                <span
                  className="text-lg font-extrabold tabular-nums"
                  style={{ color: telemetry.rank === 1 ? "var(--accent)" : "var(--text-primary)" }}
                >
                  {RANK_ORDINAL[telemetry.rank - 1] ?? `${telemetry.rank}`}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  / 4
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 border px-3 py-1.5 backdrop-blur-md" style={surfaceStyle}>
                <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "var(--text-secondary)" }}>
                  LAP
                </span>
                <span className="text-base font-bold tabular-nums">
                  {telemetry.lap}
                  <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                    /{TOTAL_LAPS}
                  </span>
                </span>
              </div>

              <div className="hidden items-baseline gap-2 border px-3 py-1.5 backdrop-blur-md sm:flex" style={surfaceStyle}>
                <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "var(--text-secondary)" }}>
                  TIME
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatRaceTime(telemetry.elapsedMs)}
                </span>
              </div>
            </div>

            {/* Compact Live Standings Pill */}
            {telemetry.racers.length > 0 && phase !== "finished" && (
              <div
                className="hidden w-44 flex-col gap-1 border p-2 text-[11px] backdrop-blur-md lg:flex"
                style={surfaceStyle}
              >
                {telemetry.racers.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {r.rank}
                      </span>
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <span
                        className={r.isPlayer ? "font-bold" : "font-medium"}
                        style={{ color: r.isPlayer ? "var(--accent)" : "var(--text-primary)" }}
                      >
                        {r.name}
                      </span>
                    </div>
                    {r.finished && (
                      <span className="text-[10px]" style={{ color: "var(--green)" }}>
                        FIN
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Camera Switch, Pause, Best Score, Restart & Minimap */}
          <div className="pointer-events-auto flex items-start gap-2">
            <div className="hidden flex-col items-end gap-1.5 sm:flex">
              <div className="flex items-center gap-2">
                {bestTimeMs > 0 && (
                  <div className="border px-2.5 py-1 text-[11px] font-medium tabular-nums backdrop-blur-md" style={surfaceStyle}>
                    <span className="mr-1.5" style={{ color: "var(--text-secondary)" }}>
                      BEST
                    </span>
                    <span style={{ color: "var(--accent)" }}>{formatRaceTime(bestTimeMs)}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleCycleCamera}
                  title={language === "id" ? "Ganti Kamera (C)" : "Cycle Camera (C)"}
                  className="flex h-8 cursor-pointer items-center gap-1.5 border px-2.5 text-[11px] font-bold tracking-wider uppercase transition-colors hover:border-[var(--accent)] backdrop-blur-md"
                  style={surfaceStyle}
                >
                  <VideoCameraIcon className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                  <span>{CAMERA_META[cameraSettings.preset].enLabel}</span>
                  <span style={{ color: "var(--text-muted)" }}>[C]</span>
                </button>
                {(phase === "racing" || phase === "countdown" || phase === "paused") && (
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    title={language === "id" ? "Pause / Pengaturan (Esc)" : "Pause / Settings (Esc)"}
                    aria-label={language === "id" ? "Pause game" : "Pause game"}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center border transition-colors hover:border-[var(--accent)] backdrop-blur-md"
                    style={surfaceStyle}
                  >
                    <PauseIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRestart}
                  title={language === "id" ? "Ulangi Balapan (R)" : "Restart Race (R)"}
                  aria-label={language === "id" ? "Ulangi balapan" : "Restart race"}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center border transition-colors hover:border-[var(--accent)] backdrop-blur-md"
                  style={surfaceStyle}
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
              </div>

              {/* SVG Live Minimap */}
              <div className="border p-1.5 backdrop-blur-md" style={surfaceStyle}>
                <svg width={MINIMAP_SIZE} height={MINIMAP_SIZE} viewBox={`0 0 ${MINIMAP_SIZE} ${MINIMAP_SIZE}`}>
                  <path
                    d={MINIMAP_PATH}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth={6}
                    strokeLinejoin="round"
                  />
                  <path
                    d={MINIMAP_PATH}
                    fill="none"
                    stroke="var(--text-muted)"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                  />
                  {telemetry.racers.map((r) => {
                    const pt = mapPointToSvg(r.x, r.z, MINIMAP_SIZE, MINIMAP_SIZE, 12);
                    return (
                      <g key={r.id}>
                        {r.isPlayer && (
                          <circle
                            cx={pt.cx}
                            cy={pt.cy}
                            r={6}
                            fill="none"
                            stroke="#ed5d31"
                            strokeWidth={1.5}
                            opacity={0.7}
                          />
                        )}
                        <circle
                          cx={pt.cx}
                          cy={pt.cy}
                          r={r.isPlayer ? 4 : 3}
                          fill={r.color}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:hidden">
              <button
                type="button"
                onClick={handleCycleCamera}
                aria-label={language === "id" ? "Ganti kamera" : "Switch camera"}
                className="flex h-8 cursor-pointer items-center gap-1 border px-2 text-[10px] font-bold uppercase backdrop-blur-md"
                style={surfaceStyle}
              >
                <VideoCameraIcon className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                <span>{CAMERA_META[cameraSettings.preset].enLabel}</span>
              </button>
              {(phase === "racing" || phase === "countdown" || phase === "paused") && (
                <button
                  type="button"
                  onClick={handleTogglePause}
                  aria-label={language === "id" ? "Jeda balapan" : "Pause race"}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center border backdrop-blur-md"
                  style={surfaceStyle}
                >
                  <PauseIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleRestart}
                aria-label={language === "id" ? "Ulangi balapan" : "Restart race"}
                className="flex h-8 w-8 cursor-pointer items-center justify-center border backdrop-blur-md"
                style={surfaceStyle}
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Transient Camera Mode Notification Pill */}
        {cameraNotice && phase !== "idle" && phase !== "paused" && (
          <div className="pointer-events-none absolute inset-x-0 top-14 z-20 flex justify-center">
            <div
              className="border px-3 py-1 text-[11px] font-bold tracking-widest uppercase backdrop-blur-md"
              style={{
                ...surfaceStyle,
                borderColor: "var(--accent)",
              }}
            >
              {cameraNotice}
            </div>
          </div>
        )}

        {/* Center Countdown Indicator */}
        {phase === "countdown" && telemetry.countdownLabel && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <span
                className="text-6xl font-black tracking-tighter drop-shadow-lg sm:text-8xl"
                style={{
                  color: telemetry.countdownLabel === "LIGHTS OUT!" ? "var(--green)" : "var(--accent)",
                }}
              >
                {telemetry.countdownLabel}
              </span>
              <span
                className="mt-2 border px-3 py-1 text-[11px] font-semibold tracking-widest uppercase backdrop-blur-md"
                style={surfaceStyle}
              >
                {language === "id"
                  ? `Siapkan gas — ${TOTAL_LAPS} Putaran (${TRACK_LENGTH_KM} km) vs 3 AI`
                  : `Get Ready — ${TOTAL_LAPS}-Lap GP (${TRACK_LENGTH_KM} km) vs 3 AI`}
              </span>
            </div>
          </div>
        )}

        {/* Speedometer + F1 Gear/RPM + Nitro Gauge */}
        {(phase === "countdown" || phase === "racing") && (
          <div className="pointer-events-none absolute right-3 bottom-32 z-20 flex flex-col items-end gap-1.5 sm:right-6 md:bottom-5">
            <div className="flex w-40 flex-col gap-1.5 border px-3.5 py-2 backdrop-blur-md sm:w-44" style={surfaceStyle}>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-bold" style={{ color: "var(--accent)" }}>
                    G
                  </span>
                  <span className="text-xl font-black tabular-nums">{telemetry.gear}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tracking-tight tabular-nums sm:text-3xl">
                    {telemetry.speedKmh}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                    KM/H
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                <div
                  className="h-full transition-[width] duration-75"
                  style={{
                    width: `${Math.round(telemetry.rpm * 100)}%`,
                    background:
                      telemetry.rpm > 0.88
                        ? "#ef4444"
                        : telemetry.rpm > 0.65
                        ? "var(--accent)"
                        : "var(--green)",
                  }}
                />
              </div>
            </div>

            <div className="flex w-40 flex-col gap-1 border p-2 backdrop-blur-md sm:w-44" style={surfaceStyle}>
              <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
                <span className="flex items-center gap-1">
                  <BoltIcon className="h-3 w-3" style={{ color: "var(--accent)" }} />
                  NITRO
                </span>
                <span className="tabular-nums" style={{ color: telemetry.isBoosting ? "var(--accent)" : "var(--text-secondary)" }}>
                  {Math.round(telemetry.boostMeter)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                <div
                  className="h-full transition-[width] duration-75"
                  style={{
                    width: `${Math.max(0, Math.min(100, telemetry.boostMeter))}%`,
                    background: telemetry.isBoosting ? "#38bdf8" : "var(--accent)",
                  }}
                />
              </div>
              {telemetry.isDrifting && (
                <div className="flex justify-between text-[10px] font-bold" style={{ color: "#38bdf8" }}>
                  <span>DRIFT CHARGE</span>
                  <span>{Math.min(100, Math.round((telemetry.driftCharge / 0.45) * 100))}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desktop Controls Legend & Open Asset Credit */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 hidden flex-col items-center gap-1 md:flex">
          <div
            className="flex items-center gap-3 border px-4 py-1.5 text-[11px] tracking-wider uppercase backdrop-blur-md"
            style={{
              ...surfaceStyle,
              color: "var(--text-secondary)",
            }}
          >
            <span>
              <strong style={{ color: "var(--text-primary)" }}>WASD / ARROWS</strong>{" "}
              {language === "id" ? "GAS & BELOK" : "DRIVE"}
            </span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>SHIFT</strong> DRIFT
            </span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>SPACE</strong> NITRO
            </span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>C</strong>{" "}
              {language === "id" ? "KAMERA" : "CAMERA"}
            </span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>ESC</strong> PAUSE
            </span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>R</strong> RESET
            </span>
          </div>
          <span className="text-[9px] tracking-wide opacity-65" style={{ color: "var(--text-secondary)" }}>
            F1 RB22 3D: Tyler_Dave (CC BY 4.0) · Asphalt PBR: Poly Haven (CC0)
          </span>
        </div>

        {/* Start Overlay (Idle Pre-Race Lobby + Camera Placement Setup) */}
        {(phase === "idle" || phase === "paused") && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ background: "color-mix(in srgb, var(--bg-primary) 58%, transparent)" }}
          >
            <div
              className="w-full max-w-lg border p-5 shadow-2xl sm:p-6"
              style={{
                borderColor: "var(--border)",
                background: "color-mix(in srgb, var(--bg-secondary) 94%, transparent)",
                color: "var(--text-primary)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[11px] font-bold tracking-widest uppercase"
                  style={{ color: "var(--accent)" }}
                >
                  {phase === "idle"
                    ? language === "id"
                      ? `SIRKUIT JALANAN ${TRACK_LENGTH_KM} KM · ${TOTAL_LAPS} PUTARAN`
                      : `${TRACK_LENGTH_KM} KM STREET CIRCUIT · ${TOTAL_LAPS} LAPS`
                    : language === "id"
                    ? "BALAPAN DIJEDA // PAUSED"
                    : "RACE PAUSED"}
                </span>
                {bestTimeMs > 0 && (
                  <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--text-secondary)" }}>
                    BEST <strong style={{ color: "var(--accent)" }}>{formatRaceTime(bestTimeMs)}</strong>
                  </span>
                )}
              </div>

              <h2 className="mt-1.5 text-xl font-black tracking-tight sm:text-2xl">
                {phase === "idle"
                  ? language === "id"
                    ? "Siap di Grid Start"
                    : "Ready on the Starting Grid"
                  : language === "id"
                  ? "Pengaturan Kamera & Jeda"
                  : "Race & Camera Settings"}
              </h2>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {phase === "idle"
                  ? language === "id"
                    ? "Atur posisi kamera di bawah atau tekan C kapan saja untuk berganti ke First-Person Kokpit, T-Cam F1, maupun Chase."
                    : "Configure camera placement below or press C anytime to switch between First-Person Cockpit, F1 T-Cam, and Chase angles."
                  : language === "id"
                  ? "Ubah letak kamera secara langsung lalu lanjutkan balapan tanpa kehilangan posisi."
                  : "Adjust your camera position live and resume cleanly right where you left off."}
              </p>

              {/* Camera Angle Selector + Placement Sliders */}
              <div className="mt-4 border p-3" style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
                    <VideoCameraIcon className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                    {language === "id" ? "Letak Kamera (Tombol C)" : "Camera Placement (Key C)"}
                  </span>
                  {(cameraSettings.heightOffset !== 0 ||
                    cameraSettings.distanceOffset !== 0 ||
                    cameraSettings.fovOffset !== 0) && (
                    <button
                      type="button"
                      onClick={() =>
                        setCameraSettings((prev) => ({
                          ...prev,
                          heightOffset: 0,
                          distanceOffset: 0,
                          fovOffset: 0,
                        }))
                      }
                      className="cursor-pointer text-[10px] font-semibold uppercase hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      Reset Default
                    </button>
                  )}
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {CAMERA_PRESET_ORDER.map((preset) => {
                    const selected = cameraSettings.preset === preset;
                    const meta = CAMERA_META[preset];
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCameraSettings((prev) => ({ ...prev, preset }))}
                        className="cursor-pointer border px-2 py-2 text-left transition-colors"
                        style={{
                          borderColor: selected ? "var(--accent)" : "var(--border)",
                          background: selected
                            ? "color-mix(in srgb, var(--accent) 16%, var(--bg-secondary))"
                            : "var(--bg-secondary)",
                        }}
                      >
                        <div className="text-[11px] font-extrabold uppercase" style={{ color: selected ? "var(--accent)" : "var(--text-primary)" }}>
                          {language === "id" ? meta.idLabel : meta.enLabel}
                        </div>
                        <div className="mt-0.5 text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>
                          {language === "id" ? meta.idDesc : meta.enDesc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex justify-between">
                      <span>{language === "id" ? "Tinggi" : "Height"}</span>
                      <span className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {cameraSettings.heightOffset >= 0 ? "+" : ""}
                        {cameraSettings.heightOffset.toFixed(2)}m
                      </span>
                    </span>
                    <input
                      type="range"
                      min={-0.35}
                      max={0.65}
                      step={0.05}
                      value={cameraSettings.heightOffset}
                      onChange={(e) =>
                        setCameraSettings((prev) => ({
                          ...prev,
                          heightOffset: Number(e.target.value),
                        }))
                      }
                      className="accent-[var(--accent)]"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex justify-between">
                      <span>{language === "id" ? "Jarak" : "Distance"}</span>
                      <span className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {cameraSettings.distanceOffset >= 0 ? "+" : ""}
                        {cameraSettings.distanceOffset.toFixed(1)}m
                      </span>
                    </span>
                    <input
                      type="range"
                      min={-1.2}
                      max={2.0}
                      step={0.1}
                      value={cameraSettings.distanceOffset}
                      onChange={(e) =>
                        setCameraSettings((prev) => ({
                          ...prev,
                          distanceOffset: Number(e.target.value),
                        }))
                      }
                      className="accent-[var(--accent)]"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex justify-between">
                      <span>FOV</span>
                      <span className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {cameraSettings.fovOffset >= 0 ? "+" : ""}
                        {cameraSettings.fovOffset}°
                      </span>
                    </span>
                    <input
                      type="range"
                      min={-6}
                      max={10}
                      step={1}
                      value={cameraSettings.fovOffset}
                      onChange={(e) =>
                        setCameraSettings((prev) => ({
                          ...prev,
                          fovOffset: Number(e.target.value),
                        }))
                      }
                      className="accent-[var(--accent)]"
                    />
                  </label>
                </div>
              </div>

              {phase === "idle" ? (
                <button
                  type="button"
                  onClick={handleStartRace}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3 text-xs font-extrabold tracking-widest text-white uppercase transition-opacity hover:opacity-90"
                  style={{ background: "var(--accent)" }}
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>{language === "id" ? "Mulai Balapan (Enter)" : "Start Race (Enter)"}</span>
                </button>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="flex cursor-pointer items-center justify-center gap-2 px-4 py-3 text-xs font-extrabold tracking-widest text-white uppercase transition-opacity hover:opacity-90"
                    style={{ background: "var(--accent)" }}
                  >
                    <PlayIcon className="h-4 w-4" />
                    <span>{language === "id" ? "Lanjut (Esc)" : "Resume (Esc)"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="flex cursor-pointer items-center justify-center gap-2 border px-4 py-3 text-xs font-bold tracking-widest uppercase transition-colors hover:border-[var(--accent)]"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--bg-primary)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>{language === "id" ? "Ulangi (R)" : "Restart (R)"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Multi-Touch Steering + Pedals */}
        {(phase === "countdown" || phase === "racing") && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-end justify-between px-3 md:hidden"
          style={{ touchAction: "none" }}
        >
          {/* Left hand: Steer Left / Right */}
          <div className="pointer-events-auto flex items-center gap-2.5" style={{ touchAction: "none" }}>
            <button
              type="button"
              aria-label="Steer Left"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setMobileFlag("left", true);
              }}
              onPointerUp={() => setMobileFlag("left", false)}
              onPointerCancel={() => setMobileFlag("left", false)}
              className="flex h-16 w-16 items-center justify-center border backdrop-blur-md active:scale-95"
              style={surfaceStyle}
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Steer Right"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setMobileFlag("right", true);
              }}
              onPointerUp={() => setMobileFlag("right", false)}
              onPointerCancel={() => setMobileFlag("right", false)}
              className="flex h-16 w-16 items-center justify-center border backdrop-blur-md active:scale-95"
              style={surfaceStyle}
            >
              <ArrowRightIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Right hand: Nitro + Drift + Gas */}
          <div className="pointer-events-auto flex items-end gap-2" style={{ touchAction: "none" }}>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setMobileFlag("boost", true);
                }}
                onPointerUp={() => setMobileFlag("boost", false)}
                onPointerCancel={() => setMobileFlag("boost", false)}
                className="flex h-11 w-16 items-center justify-center border text-[11px] font-bold tracking-wider uppercase backdrop-blur-md active:scale-95"
                style={{
                  borderColor: "var(--accent)",
                  background: "color-mix(in srgb, var(--accent) 18%, var(--bg-primary))",
                  color: "var(--text-primary)",
                }}
              >
                NITRO
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setMobileFlag("drift", true);
                }}
                onPointerUp={() => setMobileFlag("drift", false)}
                onPointerCancel={() => setMobileFlag("drift", false)}
                className="flex h-11 w-16 items-center justify-center border text-[11px] font-bold tracking-wider uppercase backdrop-blur-md active:scale-95"
                style={surfaceStyle}
              >
                DRIFT
              </button>
            </div>

            <button
              type="button"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setMobileFlag("gas", true);
              }}
              onPointerUp={() => setMobileFlag("gas", false)}
              onPointerCancel={() => setMobileFlag("gas", false)}
              className="flex h-24 w-16 items-center justify-center border text-xs font-extrabold tracking-widest uppercase active:scale-95"
              style={{
                borderColor: "var(--accent)",
                background: "var(--accent)",
                color: "#ffffff",
              }}
            >
              GAS
            </button>
          </div>
        </div>
        )}

        {/* Finish Podium & Results Overlay */}
        {phase === "finished" && finishSummary && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center p-4 backdrop-blur-md"
            style={{ background: "color-mix(in srgb, var(--bg-primary) 72%, transparent)" }}
          >
            <div
              className="w-full max-w-md border p-6 shadow-2xl"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
                  <TrophyIcon className="h-4 w-4" />
                  <span>
                    {finishSummary.rank === 1
                      ? language === "id"
                        ? "JUARA 1 // VICTORY"
                        : "1ST PLACE VICTORY"
                      : `${RANK_ORDINAL[finishSummary.rank - 1]} ${language === "id" ? "SELESAI" : "FINISH"}`}
                  </span>
                </div>
                {(finishSummary.isNewBestScore || finishSummary.isNewBestTime) && (
                  <span
                    className="border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                    style={{
                      color: "var(--accent)",
                      borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)",
                      background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                    }}
                  >
                    NEW BEST
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 border-b pb-4" style={{ borderColor: "var(--border)" }}>
                <div>
                  <p className="text-[10px] uppercase" style={{ color: "var(--text-secondary)" }}>
                    {language === "id" ? "Waktu" : "Race Time"}
                  </p>
                  <p className="text-lg font-extrabold tabular-nums">
                    {formatRaceTime(finishSummary.totalTimeMs)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase" style={{ color: "var(--text-secondary)" }}>
                    Best Lap
                  </p>
                  <p className="text-lg font-bold tabular-nums">
                    {finishSummary.bestLapMs ? formatRaceTime(finishSummary.bestLapMs) : "--:--.--"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase" style={{ color: "var(--text-secondary)" }}>
                    Score
                  </p>
                  <p className="text-lg font-extrabold tabular-nums" style={{ color: "var(--accent)" }}>
                    {finishSummary.breakdown.total}
                  </p>
                </div>
              </div>

              {/* Final Grid Standings */}
              <div className="mt-3 space-y-1.5 border-b pb-3 text-xs" style={{ borderColor: "var(--border)" }}>
                {finishSummary.standings.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {RANK_ORDINAL[r.rank - 1]}
                      </span>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className={r.isPlayer ? "font-bold" : ""} style={{ color: r.isPlayer ? "var(--accent)" : "var(--text-primary)" }}>
                        {r.name}
                      </span>
                    </div>
                    <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {r.finishTimeMs ? formatRaceTime(r.finishTimeMs) : language === "id" ? "Di Lintasan" : "Racing"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Score Breakdown */}
              <div className="mt-3 space-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                <div className="flex justify-between">
                  <span>{language === "id" ? "Bonus Posisi" : "Position Bonus"}</span>
                  <span style={{ color: "var(--text-primary)" }}>+{finishSummary.breakdown.rankBonus}</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === "id" ? "Bonus Kecepatan" : "Pace Bonus"}</span>
                  <span style={{ color: "var(--text-primary)" }}>+{finishSummary.breakdown.speedBonus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Drift Turbo</span>
                  <span style={{ color: "var(--text-primary)" }}>+{finishSummary.breakdown.driftBonus}</span>
                </div>
                {finishSummary.breakdown.cleanDrivingBonus > 0 && (
                  <div className="flex justify-between" style={{ color: "var(--green)" }}>
                    <span>{language === "id" ? "Berkendara Bersih" : "Clean Racing"}</span>
                    <span>+{finishSummary.breakdown.cleanDrivingBonus}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleRestart}
                className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3 text-xs font-bold tracking-widest text-white uppercase transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>{language === "id" ? "Balap Lagi (R)" : "Race Again (R)"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
