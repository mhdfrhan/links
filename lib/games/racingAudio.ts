/**
 * Procedural multi-layer motorsport Web Audio engine:
 * - Harmonic V6/V8 combustion synthesizer (sub + detuned dual fundamental + intake 1.5x)
 * - Soft analog tube saturation & throttle-load dynamic intake filter (zero loop seams)
 * - Speed-reactive tarmac roll & aerodynamic wind rush pink-noise bed
 * - Sequential gearbox ignition-cut upshift thump & downshift rev-match blip
 * - Asphalt tire slip-angle screech & serrated rumble-strip curb LFO thump
 */

import { computeGearAndRpm } from "./raceEngine";

export interface EngineAudioFrameInput {
  speed: number;
  throttle?: number;
  isBoosting: boolean;
  isDrifting: boolean;
  driftCharge: number;
  lateralSlip?: number;
  onCurb: boolean;
  isScrapingWall?: boolean;
  wallScrapeIntensity?: number;
  gridRevving?: boolean;
  active: boolean;
  muted: boolean;
}

function createSaturationCurve(drive = 2.6): Float32Array<ArrayBuffer> {
  const samples = 1024;
  const curve = new Float32Array(new ArrayBuffer(samples * 4));
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    // Slight asymmetry introduces realistic even-order combustion warmth
    curve[i] = Math.tanh(x * drive + 0.14 * x * x);
  }
  return curve;
}

function createPinkNoiseBuffer(ctx: AudioContext, seconds = 3): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
    data[i] = Math.max(-1, Math.min(1, pink));
  }

  return buffer;
}

export class F1AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private subOsc: OscillatorNode | null = null;
  private mainOsc: OscillatorNode | null = null;
  private twinOsc: OscillatorNode | null = null;
  private intakeOsc: OscillatorNode | null = null;
  private intakeGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  private roadSource: AudioBufferSourceNode | null = null;
  private roadFilter: BiquadFilterNode | null = null;
  private roadGain: GainNode | null = null;

  private driftSource: AudioBufferSourceNode | null = null;
  private driftFilter: BiquadFilterNode | null = null;
  private driftGain: GainNode | null = null;

  private curbSource: AudioBufferSourceNode | null = null;
  private curbLfo: OscillatorNode | null = null;
  private curbModGain: GainNode | null = null;
  private curbOutGain: GainNode | null = null;

  private scrapeSource: AudioBufferSourceNode | null = null;
  private scrapeFilter: BiquadFilterNode | null = null;
  private scrapeGain: GainNode | null = null;

  private turboOsc: OscillatorNode | null = null;
  private turboHarmonicOsc: OscillatorNode | null = null;
  private turboFilter: BiquadFilterNode | null = null;
  private turboGain: GainNode | null = null;

  private noiseBuffer: AudioBuffer | null = null;
  private lastGear = 1;
  private gridRevLevel = 0.2;
  private boostSpool = 0;
  private wasBoosting = false;
  private lastLimiterCutPhase = 0;
  private shiftDipUntil = 0;
  private revBlipUntil = 0;
  private disposed = false;

  private ensureContext(): AudioContext | null {
    if (this.disposed || typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      this.ctx = ctx;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 12;
      compressor.ratio.value = 3.5;
      compressor.attack.value = 0.008;
      compressor.release.value = 0.16;

      const master = ctx.createGain();
      master.gain.value = 0.78;
      compressor.connect(master);
      master.connect(ctx.destination);

      this.masterGain = master;
      this.setupSynthGraph(ctx, compressor);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private setupSynthGraph(ctx: AudioContext, bus: AudioNode) {
    const pinkNoise = createPinkNoiseBuffer(ctx, 3);
    this.noiseBuffer = pinkNoise;

    // 1. Motorsport Multi-Harmonic Engine Stack
    const engineMix = ctx.createGain();
    engineMix.gain.value = 1;

    const subOsc = ctx.createOscillator();
    subOsc.type = "triangle";
    subOsc.frequency.value = 42;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.56;
    subOsc.connect(subGain);
    subGain.connect(engineMix);

    const mainOsc = ctx.createOscillator();
    mainOsc.type = "sawtooth";
    mainOsc.frequency.value = 84;
    const mainGain = ctx.createGain();
    mainGain.gain.value = 0.34;
    mainOsc.connect(mainGain);
    mainGain.connect(engineMix);

    // Slight harmonic detune gives authentic multi-cylinder exhaust burble
    const twinOsc = ctx.createOscillator();
    twinOsc.type = "sawtooth";
    twinOsc.frequency.value = 84 * 1.008;
    const twinGain = ctx.createGain();
    twinGain.gain.value = 0.28;
    twinOsc.connect(twinGain);
    twinGain.connect(engineMix);

    const intakeOsc = ctx.createOscillator();
    intakeOsc.type = "sawtooth";
    intakeOsc.frequency.value = 126;
    const intakeGain = ctx.createGain();
    intakeGain.gain.value = 0.12;
    intakeOsc.connect(intakeGain);
    intakeGain.connect(engineMix);

    const shaper = ctx.createWaveShaper();
    shaper.curve = createSaturationCurve(2.6);
    shaper.oversample = "2x";

    const chestBody = ctx.createBiquadFilter();
    chestBody.type = "peaking";
    chestBody.frequency.value = 185;
    chestBody.Q.value = 1.1;
    chestBody.gain.value = 4.5;

    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 340;
    engineFilter.Q.value = 1.65;

    const engineGain = ctx.createGain();
    engineGain.gain.value = 0;

    engineMix.connect(shaper);
    shaper.connect(chestBody);
    chestBody.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(bus);

    subOsc.start();
    mainOsc.start();
    twinOsc.start();
    intakeOsc.start();

    this.subOsc = subOsc;
    this.mainOsc = mainOsc;
    this.twinOsc = twinOsc;
    this.intakeOsc = intakeOsc;
    this.intakeGain = intakeGain;
    this.engineFilter = engineFilter;
    this.engineGain = engineGain;

    // 2. Road Tire Contact & Aero Wind Noise Layer
    const roadSrc = ctx.createBufferSource();
    roadSrc.buffer = pinkNoise;
    roadSrc.loop = true;

    const roadFilter = ctx.createBiquadFilter();
    roadFilter.type = "lowpass";
    roadFilter.frequency.value = 210;
    roadFilter.Q.value = 0.7;

    const roadGain = ctx.createGain();
    roadGain.gain.value = 0;

    roadSrc.connect(roadFilter);
    roadFilter.connect(roadGain);
    roadGain.connect(bus);
    roadSrc.start();

    this.roadSource = roadSrc;
    this.roadFilter = roadFilter;
    this.roadGain = roadGain;

    // 3. Hot-Asphalt Tire Slip Screech (pink-filtered rubber howl)
    const driftSrc = ctx.createBufferSource();
    driftSrc.buffer = pinkNoise;
    driftSrc.loop = true;

    const driftFilter = ctx.createBiquadFilter();
    driftFilter.type = "bandpass";
    driftFilter.frequency.value = 1080;
    driftFilter.Q.value = 3.2;

    const driftGain = ctx.createGain();
    driftGain.gain.value = 0;

    driftSrc.connect(driftFilter);
    driftFilter.connect(driftGain);
    driftGain.connect(bus);
    driftSrc.start();

    this.driftSource = driftSrc;
    this.driftFilter = driftFilter;
    this.driftGain = driftGain;

    // 4. Serrated Curb Rumble Strip (LFO-pulsed lowpass tarmac thump)
    const curbSrc = ctx.createBufferSource();
    curbSrc.buffer = pinkNoise;
    curbSrc.loop = true;

    const curbFilter = ctx.createBiquadFilter();
    curbFilter.type = "lowpass";
    curbFilter.frequency.value = 145;
    curbFilter.Q.value = 1.4;

    const curbModGain = ctx.createGain();
    curbModGain.gain.value = 0.5;

    const curbLfo = ctx.createOscillator();
    curbLfo.type = "sine";
    curbLfo.frequency.value = 28;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.45;
    curbLfo.connect(lfoDepth);
    lfoDepth.connect(curbModGain.gain);

    const curbOutGain = ctx.createGain();
    curbOutGain.gain.value = 0;

    curbSrc.connect(curbFilter);
    curbFilter.connect(curbModGain);
    curbModGain.connect(curbOutGain);
    curbOutGain.connect(bus);

    curbSrc.start();
    curbLfo.start();

    this.curbSource = curbSrc;
    this.curbLfo = curbLfo;
    this.curbModGain = curbModGain;
    this.curbOutGain = curbOutGain;

    // 5. Metallic Guardrail Scrape Grind (high-Q metallic hiss + harsh midrange texture)
    const scrapeSrc = ctx.createBufferSource();
    scrapeSrc.buffer = pinkNoise;
    scrapeSrc.loop = true;

    const scrapeFilter = ctx.createBiquadFilter();
    scrapeFilter.type = "bandpass";
    scrapeFilter.frequency.value = 1850;
    scrapeFilter.Q.value = 2.6;

    const scrapeShaper = ctx.createWaveShaper();
    scrapeShaper.curve = createSaturationCurve(3.4);

    const scrapeGain = ctx.createGain();
    scrapeGain.gain.value = 0;

    scrapeSrc.connect(scrapeFilter);
    scrapeFilter.connect(scrapeShaper);
    scrapeShaper.connect(scrapeGain);
    scrapeGain.connect(bus);
    scrapeSrc.start();

    this.scrapeSource = scrapeSrc;
    this.scrapeFilter = scrapeFilter;
    this.scrapeGain = scrapeGain;

    // 6. Turbo / ERS MGU-H Turbine Whine Stack (eliminates flat Nitro drone at overdrive speeds)
    const turboMix = ctx.createGain();
    turboMix.gain.value = 1;

    const turboOsc = ctx.createOscillator();
    turboOsc.type = "triangle";
    turboOsc.frequency.value = 1450;
    const tPrimaryGain = ctx.createGain();
    tPrimaryGain.gain.value = 0.65;
    turboOsc.connect(tPrimaryGain);
    tPrimaryGain.connect(turboMix);

    const turboHarmonicOsc = ctx.createOscillator();
    turboHarmonicOsc.type = "sine";
    turboHarmonicOsc.frequency.value = 2900;
    const tHarmGain = ctx.createGain();
    tHarmGain.gain.value = 0.35;
    turboHarmonicOsc.connect(tHarmGain);
    tHarmGain.connect(turboMix);

    const turboFilter = ctx.createBiquadFilter();
    turboFilter.type = "bandpass";
    turboFilter.frequency.value = 2100;
    turboFilter.Q.value = 2.1;

    const turboGain = ctx.createGain();
    turboGain.gain.value = 0;

    turboMix.connect(turboFilter);
    turboFilter.connect(turboGain);
    turboGain.connect(bus);

    turboOsc.start();
    turboHarmonicOsc.start();

    this.turboOsc = turboOsc;
    this.turboHarmonicOsc = turboHarmonicOsc;
    this.turboFilter = turboFilter;
    this.turboGain = turboGain;
  }

  public unlock() {
    this.ensureContext();
  }

  public update(frame: EngineAudioFrameInput) {
    const ctx = this.ctx;
    if (!ctx || !this.masterGain || this.disposed) return;

    const now = ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(frame.muted ? 0 : 0.78, now, 0.04);

    const isEngineAudible = frame.active || Boolean(frame.gridRevving);

    if (frame.muted || !isEngineAudible) {
      this.engineGain?.gain.setTargetAtTime(0, now, 0.08);
      this.subOsc?.frequency.setTargetAtTime(42, now, 0.09);
      this.mainOsc?.frequency.setTargetAtTime(84, now, 0.09);
      this.twinOsc?.frequency.setTargetAtTime(84 * 1.008, now, 0.09);
      this.intakeOsc?.frequency.setTargetAtTime(126, now, 0.09);
      this.engineFilter?.frequency.setTargetAtTime(320, now, 0.09);
      this.roadGain?.gain.setTargetAtTime(0, now, 0.06);
      this.driftGain?.gain.setTargetAtTime(0, now, 0.05);
      this.curbOutGain?.gain.setTargetAtTime(0, now, 0.04);
      this.scrapeGain?.gain.setTargetAtTime(0, now, 0.04);
      this.turboGain?.gain.setTargetAtTime(0, now, 0.06);
      this.lastGear = 1;
      this.gridRevLevel = 0.2;
      this.boostSpool = 0;
      this.wasBoosting = false;
      return;
    }

    const throttle = frame.throttle ?? 0;
    const throttleLoad = Math.max(0, Math.min(1, throttle));
    const speedRatio = Math.min(1, Math.max(0, frame.speed / 57));

    const { gear, rpm } = computeGearAndRpm(frame.speed, frame.isBoosting);
    const nowPerf = performance.now();

    if (frame.gridRevving && !frame.active) {
      const targetGridRev = throttleLoad > 0.1 ? 0.28 + throttleLoad * 0.69 : 0.2;
      this.gridRevLevel += (targetGridRev - this.gridRevLevel) * 0.18;
    } else {
      if (gear > this.lastGear && frame.speed > 7) {
        this.shiftDipUntil = nowPerf + 62;
        this.playShiftThump(ctx, this.masterGain);
      } else if (gear < this.lastGear && frame.speed > 12) {
        this.revBlipUntil = nowPerf + 120;
        this.playShiftThump(ctx, this.masterGain);
      }
      this.lastGear = gear;
    }

    // Turbo / ERS boost spool ramps smoothly + wastegate flutter when releasing boost
    const targetSpool = frame.isBoosting && throttleLoad > 0.05 ? 1 : 0;
    this.boostSpool += (targetSpool - this.boostSpool) * (targetSpool > this.boostSpool ? 0.14 : 0.09);
    if (this.wasBoosting && !frame.isBoosting && frame.active && frame.speed > 18) {
      this.playWastegateFlutter(ctx, this.masterGain);
    }
    this.wasBoosting = frame.isBoosting;

    const isIgnitionCut = frame.active && nowPerf < this.shiftDipUntil;
    const revMatchFlare = frame.active && nowPerf < this.revBlipUntil ? 0.15 : 0;

    const rawRpm = frame.gridRevving && !frame.active ? this.gridRevLevel : rpm;

    // Rev-limiter ignition-cut bounce near redline (15.5 Hz F1 limiter pulse eliminates flat organ drone!)
    const onLimiter =
      (rawRpm > 0.945 && throttleLoad > 0.35) ||
      (frame.gridRevving && !frame.active && this.gridRevLevel > 0.9);
    let limiterBounceRpm = 0;
    let limiterVolDip = 1.0;
    let limiterBarkHz = 0;

    if (onLimiter) {
      const limCycle = (nowPerf * 0.0155) % 1;
      const inCut = limCycle > 0.56;
      limiterBounceRpm = (limCycle - 0.5) * -0.14 - (inCut ? 0.04 : 0);
      limiterVolDip = inCut ? 0.62 : 1.08;
      limiterBarkHz = inCut ? -220 : 260;

      // Occasional subtle exhaust crackle tick on rev-limiter edge transitions
      if (this.lastLimiterCutPhase <= 0.56 && limCycle > 0.56 && frame.isBoosting && Math.random() < 0.45) {
        this.playLimiterPop(ctx, this.masterGain);
      }
      this.lastLimiterCutPhase = limCycle;
    } else {
      this.lastLimiterCutPhase = 0;
    }

    // Organic cylinder firing roughness & speed wind ripple so steady high-speed cruising stays textured
    const microFlutter =
      Math.sin(nowPerf * 0.047) * 0.014 + Math.cos(nowPerf * 0.083) * 0.009;

    const effectiveRpm = Math.min(
      1.09,
      Math.max(
        0.18,
        rawRpm + revMatchFlare + this.boostSpool * 0.075 + limiterBounceRpm + microFlutter
      )
    );
    const baseHz = 40 + effectiveRpm * 70 + speedRatio * 18;

    if (
      this.subOsc &&
      this.mainOsc &&
      this.twinOsc &&
      this.intakeOsc &&
      this.intakeGain &&
      this.engineFilter &&
      this.engineGain
    ) {
      this.subOsc.frequency.setTargetAtTime(baseHz, now, 0.022);
      this.mainOsc.frequency.setTargetAtTime(baseHz * 2, now, 0.022);
      // Dynamic harmonic detune breathes with throttle load + turbo spool for fierce exhaust growl
      const detuneRatio = 1.007 + throttleLoad * 0.004 + this.boostSpool * 0.006;
      this.twinOsc.frequency.setTargetAtTime(baseHz * 2 * detuneRatio, now, 0.025);
      this.intakeOsc.frequency.setTargetAtTime(baseHz * 3, now, 0.022);

      // Intake harmonic bites harder under open throttle or DRS/Nitro
      const intakeLevel = 0.08 + throttleLoad * 0.16 + this.boostSpool * 0.11;
      this.intakeGain.gain.setTargetAtTime(intakeLevel, now, 0.035);

      const cutoff =
        290 +
        effectiveRpm * 520 +
        throttleLoad * 580 +
        this.boostSpool * 480 +
        limiterBarkHz;
      this.engineFilter.frequency.setTargetAtTime(Math.max(220, cutoff), now, 0.03);

      const loadVol =
        (0.13 + throttleLoad * 0.095 + speedRatio * 0.07 + this.boostSpool * 0.055) *
        limiterVolDip;
      this.engineGain.gain.setTargetAtTime(isIgnitionCut ? loadVol * 0.35 : loadVol, now, 0.02);
    }

    // MGU-H / Turbo spool whine climbing with boost + overdrive speed
    if (this.turboOsc && this.turboHarmonicOsc && this.turboFilter && this.turboGain) {
      const turbineBaseHz =
        1250 + speedRatio * 1750 + this.boostSpool * 950 + (onLimiter ? limiterBounceRpm * 1400 : 0);
      this.turboOsc.frequency.setTargetAtTime(turbineBaseHz, now, 0.04);
      this.turboHarmonicOsc.frequency.setTargetAtTime(turbineBaseHz * 1.5, now, 0.04);
      this.turboFilter.frequency.setTargetAtTime(turbineBaseHz * 1.15, now, 0.05);
      const whineVol =
        this.boostSpool > 0.03 || speedRatio > 0.72
          ? Math.min(0.085, this.boostSpool * 0.062 + Math.max(0, speedRatio - 0.72) * 0.075)
          : 0;
      this.turboGain.gain.setTargetAtTime(whineVol, now, 0.04);
    }

    if (!frame.active) {
      this.roadGain?.gain.setTargetAtTime(0, now, 0.05);
      this.driftGain?.gain.setTargetAtTime(0, now, 0.05);
      this.curbOutGain?.gain.setTargetAtTime(0, now, 0.04);
      this.scrapeGain?.gain.setTargetAtTime(0, now, 0.04);
      return;
    }

    if (this.roadGain && this.roadFilter) {
      const windBuffet =
        speedRatio > 0.65 ? Math.sin(nowPerf * 0.053) * (speedRatio - 0.65) * 180 : 0;
      this.roadGain.gain.setTargetAtTime(
        frame.speed > 3 ? Math.min(0.24, speedRatio * 0.18 + this.boostSpool * 0.045) : 0,
        now,
        0.07
      );
      this.roadFilter.frequency.setTargetAtTime(
        Math.max(150, 175 + speedRatio * 820 + windBuffet),
        now,
        0.06
      );
    }

    if (this.driftGain && this.driftFilter) {
      const slipMag = Math.abs(frame.lateralSlip ?? 0);
      const naturalTireScrub = slipMag > 2.4 ? Math.min(0.085, (slipMag - 2.4) * 0.015) : 0;
      const driftTarget = frame.isDrifting
        ? 0.09 + Math.min(0.12, frame.driftCharge * 0.07 + speedRatio * 0.045)
        : naturalTireScrub;
      this.driftGain.gain.setTargetAtTime(driftTarget, now, 0.045);
      this.driftFilter.frequency.setTargetAtTime(980 + speedRatio * 520, now, 0.06);
    }

    if (this.curbOutGain && this.curbLfo) {
      const onFastCurb = frame.onCurb && frame.speed > 10;
      this.curbOutGain.gain.setTargetAtTime(onFastCurb ? 0.17 + speedRatio * 0.12 : 0, now, 0.025);
      this.curbLfo.frequency.setTargetAtTime(20 + speedRatio * 34, now, 0.04);
    }

    if (this.scrapeGain && this.scrapeFilter) {
      const scraping = Boolean(frame.isScrapingWall) && frame.speed > 4;
      const scrapeLevel = scraping
        ? Math.min(0.2, 0.06 + (frame.wallScrapeIntensity ?? 0.25) * 0.2 + speedRatio * 0.08)
        : 0;
      this.scrapeGain.gain.setTargetAtTime(scrapeLevel, now, 0.03);
      this.scrapeFilter.frequency.setTargetAtTime(1400 + speedRatio * 1400, now, 0.04);
    }
  }

  private playLimiterPop(ctx: AudioContext, dest: AudioNode) {
    if (!this.noiseBuffer) return;
    const start = ctx.currentTime;
    const burst = ctx.createBufferSource();
    burst.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 240 + Math.random() * 140;
    bp.Q.value = 1.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.09, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.048);
    burst.connect(bp);
    bp.connect(g);
    g.connect(dest);
    burst.start(start);
    burst.stop(start + 0.055);
  }

  private playWastegateFlutter(ctx: AudioContext, dest: AudioNode) {
    const start = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2600, start);
    osc.frequency.exponentialRampToValueAtTime(1150, start + 0.18);
    g.gain.setValueAtTime(0.045, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.19);
    osc.connect(g);
    g.connect(dest);
    osc.start(start);
    osc.stop(start + 0.2);
  }

  private playShiftThump(ctx: AudioContext, dest: AudioNode) {
    const start = ctx.currentTime;

    // Low combustion pop
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(102, start);
    osc.frequency.exponentialRampToValueAtTime(42, start + 0.055);
    oscGain.gain.setValueAtTime(0.11, start);
    oscGain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);
    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(start);
    osc.stop(start + 0.07);

    // Filtered exhaust snap if noise buffer ready
    if (this.noiseBuffer) {
      const burst = ctx.createBufferSource();
      burst.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 180;
      bp.Q.value = 1.2;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.12, start);
      ng.gain.exponentialRampToValueAtTime(0.001, start + 0.055);
      burst.connect(bp);
      bp.connect(ng);
      ng.connect(dest);
      burst.start(start);
      burst.stop(start + 0.065);
    }
  }

  public dispose() {
    this.disposed = true;
    try {
      this.subOsc?.stop();
      this.mainOsc?.stop();
      this.twinOsc?.stop();
      this.intakeOsc?.stop();
      this.roadSource?.stop();
      this.driftSource?.stop();
      this.curbSource?.stop();
      this.curbLfo?.stop();
      this.scrapeSource?.stop();
      this.turboOsc?.stop();
      this.turboHarmonicOsc?.stop();
      if (this.ctx && this.ctx.state !== "closed") {
        this.ctx.close().catch(() => {});
      }
    } catch {}
    this.ctx = null;
  }
}
