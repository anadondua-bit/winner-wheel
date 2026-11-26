/**
 * Synthesized show audio — a three-note tick cycle for the spin (lifted
 * from a reference spinning-wheel recording's pitches, see playWheelTick)
 * and a clean rising chime for the reveal. No audio files: everything is a
 * couple of oscillators shaped with gain/frequency envelopes, so it stays a
 * few hundred bytes. The ticks are the only sound during the spin — no
 * underlying hum or drone.
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

/**
 * The reference spinning-wheel recording ticks through the same three
 * pitches throughout — G#4, C#5, G#4, D#5, repeating — rather than sweeping
 * pitch with speed; it's the *tempo* of this fixed three-note cycle that
 * tells you how fast the wheel is going, not its pitch. Walked forward one
 * step per tick by `playWheelTick` below.
 */
const TICK_NOTES = [415.3, 551.2, 415.3, 622.3]; // G#4, C#5, G#4, D#5
let tickStep = 0;

/**
 * One short arcade-style tick as a wheel segment passes the pointer,
 * cycling through TICK_NOTES in order. A square wave — the classic 8-bit
 * blip tone, not the softer triangle — with a near-instant on and a hard
 * linear cutoff rather than a soft exponential tail, like old arcade
 * hardware just gating the tone on and off. Loudness and length still
 * scale with `intensity` (0–1, the wheel's instantaneous speed) so it
 * settles as the spin lands, but — matching the reference — speed is read
 * in how fast these ticks arrive, not in their pitch.
 */
export const playWheelTick = (intensity: number): void => {
  const audio = getContext();
  if (!audio || audio.state !== "running") return;

  const clamped = Math.min(1, Math.max(0, intensity));
  const now = audio.currentTime;
  const freq = TICK_NOTES[tickStep % TICK_NOTES.length];
  tickStep += 1;
  const duration = 0.03 + (1 - clamped) * 0.02;
  const peak = 0.08 + clamped * 0.05;

  const osc = audio.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, now);

  const gain = audio.createGain();
  gain.gain.setValueAtTime(peak, now);
  gain.gain.setValueAtTime(peak, now + duration * 0.55);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc.connect(gain);
  gain.connect(audio.destination);

  osc.start(now);
  osc.stop(now + duration + 0.005);
};

/**
 * The winner reveal: a low sub-thump for weight, a rising four-note
 * arpeggio that lands on a held high note, and a bright filtered-noise
 * shimmer on top — a fuller, more triumphant "power-up" moment than a
 * plain two-note blip, still entirely synthesized. The arpeggio — the
 * actual tune — uses the same square-wave arcade voice as the spin ticks
 * (hard on/off envelope, not a soft exponential fade), so the two halves
 * of the show share one consistent synth character.
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
    [523.25, 0, 0.1, 0.5],
    [659.25, 0.075, 0.11, 0.5],
    [783.99, 0.15, 0.12, 0.55],
    [1046.5, 0.24, 0.16, 0.85],
  ];

  notes.forEach(([frequency, offset, gainPeak, duration]) => {
    const start = now + offset;
    const osc = audio.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(frequency, start);

    const gain = audio.createGain();
    gain.gain.setValueAtTime(gainPeak, start);
    gain.gain.setValueAtTime(gainPeak, start + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, start + duration);

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
