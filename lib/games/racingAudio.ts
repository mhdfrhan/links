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
  onCurb: boolean;
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

  private noiseBuffer: AudioBuffer | null = null;
  private lastGear = 1;
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
  }

  public unlock() {
    this.ensureContext();
  }

  public update(frame: EngineAudioFrameInput) {
    const ctx = this.ctx;
    if (!ctx || !this.masterGain || this.disposed) return;

    const now = ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(frame.muted ? 0 : 0.78, now, 0.04);

    if (frame.muted || !frame.active) {
      this.engineGain?.gain.setTargetAtTime(0, now, 0.08);
      this.subOsc?.frequency.setTargetAtTime(42, now, 0.09);
      this.mainOsc?.frequency.setTargetAtTime(84, now, 0.09);
      this.twinOsc?.frequency.setTargetAtTime(84 * 1.008, now, 0.09);
      this.intakeOsc?.frequency.setTargetAtTime(126, now, 0.09);
      this.engineFilter?.frequency.setTargetAtTime(320, now, 0.09);
      this.roadGain?.gain.setTargetAtTime(0, now, 0.06);
      this.driftGain?.gain.setTargetAtTime(0, now, 0.05);
      this.curbOutGain?.gain.setTargetAtTime(0, now, 0.04);
      this.lastGear = 1;
      return;
    }

    const throttle = frame.throttle ?? 0;
    const throttleLoad = Math.max(0, Math.min(1, throttle));
    const speedRatio = Math.min(1, Math.max(0, frame.speed / 52));

    const { gear, rpm } = computeGearAndRpm(frame.speed, frame.isBoosting);
    const nowPerf = performance.now();

    if (gear > this.lastGear && frame.speed > 10) {
      this.shiftDipUntil = nowPerf + 62;
      this.playShiftThump(ctx, this.masterGain);
    } else if (gear < this.lastGear && frame.speed > 14) {
      this.revBlipUntil = nowPerf + 110;
    }
    this.lastGear = gear;

    const isIgnitionCut = nowPerf < this.shiftDipUntil;
    const revMatchFlare = nowPerf < this.revBlipUntil ? 0.14 : 0;

    // Fundamental combustion firing frequency locked smoothly between 38 Hz idle and 112 Hz redline
    const effectiveRpm = Math.min(
      1.08,
      Math.max(0.18, rpm + revMatchFlare + (frame.isBoosting ? 0.08 : 0))
    );
    const baseHz = 40 + effectiveRpm * 66 + speedRatio * 14;

    if (
      this.subOsc &&
      this.mainOsc &&
      this.twinOsc &&
      this.intakeOsc &&
      this.intakeGain &&
      this.engineFilter &&
      this.engineGain
    ) {
      this.subOsc.frequency.setTargetAtTime(baseHz, now, 0.032);
      this.mainOsc.frequency.setTargetAtTime(baseHz * 2, now, 0.032);
      this.twinOsc.frequency.setTargetAtTime(baseHz * 2 * 1.008, now, 0.032);
      this.intakeOsc.frequency.setTargetAtTime(baseHz * 3, now, 0.032);

      // Intake harmonic bites harder under open throttle or DRS/Nitro
      const intakeLevel = 0.08 + throttleLoad * 0.16 + (frame.isBoosting ? 0.07 : 0);
      this.intakeGain.gain.setTargetAtTime(intakeLevel, now, 0.045);

      // Filter opens proportionally with throttle load & RPM; settles warm when coasting
      const cutoff =
        290 +
        effectiveRpm * 460 +
        throttleLoad * 540 +
        (frame.isBoosting ? 380 : 0);
      this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.05);

      const loadVol =
        0.13 +
        throttleLoad * 0.09 +
        speedRatio * 0.07 +
        (frame.isBoosting ? 0.05 : 0);
      this.engineGain.gain.setTargetAtTime(isIgnitionCut ? loadVol * 0.35 : loadVol, now, 0.025);
    }

    if (this.roadGain && this.roadFilter) {
      this.roadGain.gain.setTargetAtTime(
        frame.speed > 3 ? Math.min(0.18, speedRatio * 0.16) : 0,
        now,
        0.08
      );
      this.roadFilter.frequency.setTargetAtTime(175 + speedRatio * 720, now, 0.08);
    }

    if (this.driftGain && this.driftFilter) {
      const driftTarget = frame.isDrifting
        ? 0.08 + Math.min(0.11, frame.driftCharge * 0.07 + speedRatio * 0.04)
        : 0;
      this.driftGain.gain.setTargetAtTime(driftTarget, now, 0.045);
      this.driftFilter.frequency.setTargetAtTime(980 + speedRatio * 480, now, 0.06);
    }

    if (this.curbOutGain && this.curbLfo) {
      const onFastCurb = frame.onCurb && frame.speed > 10;
      this.curbOutGain.gain.setTargetAtTime(onFastCurb ? 0.16 + speedRatio * 0.12 : 0, now, 0.025);
      this.curbLfo.frequency.setTargetAtTime(20 + speedRatio * 34, now, 0.04);
    }
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
      if (this.ctx && this.ctx.state !== "closed") {
        this.ctx.close().catch(() => {});
      }
    } catch {}
    this.ctx = null;
  }
}
