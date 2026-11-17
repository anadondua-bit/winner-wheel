/**
 * Synthesized show audio — a sci-fi interface blip for each segment tick and
 * a clean rising chime for the reveal. No audio files: everything is a
 * couple of oscillators shaped with gain/frequency envelopes, so it stays a
 * few hundred bytes and sounds digital rather than like a mechanical
 * wheel's wooden ratchet.
 */

type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;

  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return null;

  ctx = new Ctor();
  return ctx;
};

/** Call from a real user gesture — audio stays silent until the browser allows it. */
export const resumeWheelAudio = (): Promise<void> => {
  const audio = getContext();
  if (audio && audio.state === "suspended") return audio.resume();
  return Promise.resolve();
};

export const isWheelAudioReady = (): boolean => getContext()?.state === "running";

/**
 * One short digital tick as a wheel segment passes the pointer. Pitch and
 * brightness scale with `intensity` (0–1, the wheel's instantaneous speed),
 * so the sound naturally brightens mid-spin and settles as it lands.
 */
export const playWheelTick = (intensity: number): void => {
  const audio = getContext();
  if (!audio || audio.state !== "running") return;

  const clamped = Math.min(1, Math.max(0, intensity));
  const now = audio.currentTime;
  const freq = 1500 + clamped * 1500;
  const duration = 0.026 + (1 - clamped) * 0.018;

  const osc = audio.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(220, freq * 0.5), now + duration);

  const filter = audio.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 500;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.14 + clamped * 0.1, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);

  osc.start(now);
  osc.stop(now + duration + 0.01);
};

export type SpinHumHandle = {
  /** Call every frame with the wheel's current speed, 0–1. */
  update: (intensity: number) => void;
  stop: () => void;
};

/**
 * A continuous electric-motor hum under the ticks: two detuned sawtooths
 * through a resonant low-pass, both swept by speed so it spools up, holds
 * a synthy whine mid-spin, and winds down as the wheel decelerates —
 * reads as an electric drive, not a wooden ratchet.
 */
export const startSpinHum = (): SpinHumHandle | null => {
  const audio = getContext();
  if (!audio || audio.state !== "running") return null;

  const now = audio.currentTime;

  const oscA = audio.createOscillator();
  oscA.type = "sawtooth";
  oscA.frequency.setValueAtTime(70, now);

  const oscB = audio.createOscillator();
  oscB.type = "sawtooth";
  oscB.frequency.setValueAtTime(73, now);

  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(280, now);
  filter.Q.value = 5;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.1, now + 0.12);

  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);

  oscA.start(now);
  oscB.start(now);

  let stopped = false;

  const update = (intensity: number) => {
    if (stopped) return;
    const clamped = Math.min(1, Math.max(0, intensity));
    const t = audio.currentTime;
    const baseFreq = 64 + clamped * 190;
    oscA.frequency.setTargetAtTime(baseFreq, t, 0.05);
    oscB.frequency.setTargetAtTime(baseFreq * 1.045, t, 0.05);
    filter.frequency.setTargetAtTime(260 + clamped * 2600, t, 0.06);
    gain.gain.setTargetAtTime(0.05 + clamped * 0.09, t, 0.08);
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    const t = audio.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setTargetAtTime(0.0001, t, 0.09);
    oscA.stop(t + 0.4);
    oscB.stop(t + 0.4);
  };

  return { update, stop };
};

/**
 * The winner reveal: a low sub-thump for weight, a rising four-note
 * arpeggio that lands on a held high note, and a bright filtered-noise
 * shimmer on top — a fuller, more triumphant "power-up" moment than a
 * plain two-note blip, still entirely synthesized.
 */
export const playWheelChime = (): void => {
  const audio = getContext();
  if (!audio || audio.state !== "running") return;

  const now = audio.currentTime;

  const thump = audio.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(150, now);
  thump.frequency.exponentialRampToValueAtTime(46, now + 0.22);
  const thumpGain = audio.createGain();
  thumpGain.gain.setValueAtTime(0.0001, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.5, now + 0.012);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
  thump.connect(thumpGain);
  thumpGain.connect(audio.destination);
  thump.start(now);
  thump.stop(now + 0.3);

  const notes: Array<[frequency: number, offset: number, gainPeak: number, duration: number]> = [
    [523.25, 0, 0.16, 0.5],
    [659.25, 0.075, 0.18, 0.5],
    [783.99, 0.15, 0.2, 0.55],
    [1046.5, 0.24, 0.27, 0.85],
  ];

  notes.forEach(([frequency, offset, gainPeak, duration]) => {
    const start = now + offset;
    const osc = audio.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, start);

    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  });

  const shimmerStart = now + 0.24;
  const bufferSize = Math.floor(audio.sampleRate * 0.35);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noise = audio.createBufferSource();
  noise.buffer = buffer;

  const shimmerFilter = audio.createBiquadFilter();
  shimmerFilter.type = "bandpass";
  shimmerFilter.frequency.value = 5200;
  shimmerFilter.Q.value = 0.7;

  const shimmerGain = audio.createGain();
  shimmerGain.gain.setValueAtTime(0.0001, shimmerStart);
  shimmerGain.gain.exponentialRampToValueAtTime(0.1, shimmerStart + 0.01);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, shimmerStart + 0.34);

  noise.connect(shimmerFilter);
  shimmerFilter.connect(shimmerGain);
  shimmerGain.connect(audio.destination);
  noise.start(shimmerStart);
  noise.stop(shimmerStart + 0.35);
};
