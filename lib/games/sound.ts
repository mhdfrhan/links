/**
 * Lightweight zero-asset Web Audio API synthesizer for 3D racing feedback.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) {
      audioCtx = new Ctor();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType,
  gainPeak: number,
  endFreq?: number,
  delaySeconds = 0
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const start = ctx.currentTime + delaySeconds;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), start + duration);
  }

  gain.gain.setValueAtTime(0.001, start);
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playCountdownBeep(isGo: boolean, muted: boolean) {
  if (muted) return;
  if (isGo) {
    playTone(880, 0.28, "triangle", 0.14);
    playTone(1318.5, 0.24, "sine", 0.09, undefined, 0.04);
  } else {
    playTone(440, 0.14, "sine", 0.1);
  }
}

export function playBoostSound(muted: boolean) {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const start = ctx.currentTime;
  // Deep turbo pressure swell + filtered intake air rush (no sci-fi sawtooth laser)
  playTone(108, 0.22, "triangle", 0.09, 54);

  const sampleRate = ctx.sampleRate;
  const len = Math.floor(sampleRate * 0.28);
  const buf = ctx.createBuffer(1, len, sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.08 * (Math.random() * 2 - 1)) / 1.08;
    data[i] = last * 3.2;
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(340, start);
  filter.frequency.exponentialRampToValueAtTime(1150, start + 0.24);
  filter.Q.value = 1.8;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.linearRampToValueAtTime(0.14, start + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, start + 0.27);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(start);
  src.stop(start + 0.28);
}

export function playLapSound(isFinalLap: boolean, muted: boolean) {
  if (muted) return;
  if (isFinalLap) {
    playTone(587.33, 0.12, "triangle", 0.09);
    playTone(880, 0.22, "triangle", 0.1, undefined, 0.09);
  } else {
    playTone(523.25, 0.14, "triangle", 0.08, 659.25);
  }
}

export function playBumpSound(muted: boolean) {
  if (muted) return;
  playTone(96, 0.11, "triangle", 0.11, 38);
  playTone(145, 0.06, "sine", 0.06, 52);
}

export function playVictorySound(muted: boolean) {
  if (muted) return;
  const chord = [523.25, 659.25, 783.99, 1046.5];
  chord.forEach((hz, idx) => {
    playTone(hz, 0.28, "triangle", 0.1, undefined, idx * 0.075);
  });
}
