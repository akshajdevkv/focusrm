"use client";

type ActiveSound = {
  audio: HTMLAudioElement;
  fadeFrame?: number;
  volume: number;
};

let context: AudioContext | undefined;
const activeSounds = new Map<string, ActiveSound>();
const FADE_IN_MS = 900;
const FADE_OUT_MS = 700;
const VOLUME_RAMP_MS = 250;

function clampVolume(volume: number) {
  return Math.min(1, Math.max(0, volume / 100));
}

function getContext() {
  if (!context) context = new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function fadeVolume(entry: ActiveSound, to: number, duration: number, onComplete?: () => void) {
  if (entry.fadeFrame) cancelAnimationFrame(entry.fadeFrame);

  const from = entry.audio.volume;
  const startedAt = performance.now();

  const step = (now: number) => {
    const progress = duration <= 0 ? 1 : Math.min(1, (now - startedAt) / duration);
    entry.audio.volume = from + (to - from) * progress;

    if (progress < 1) {
      entry.fadeFrame = requestAnimationFrame(step);
      return;
    }

    entry.fadeFrame = undefined;
    entry.audio.volume = to;
    onComplete?.();
  };

  entry.fadeFrame = requestAnimationFrame(step);
}

export function startAmbientSound(name: string, audioSrc: string, volume: number) {
  stopAmbientSound(name);
  const audio = new Audio(audioSrc);
  audio.loop = true;
  audio.volume = 0;
  audio.preload = "auto";
  const entry = { audio, volume: clampVolume(volume) };
  activeSounds.set(name, entry);

  audio
    .play()
    .then(() => fadeVolume(entry, entry.volume, FADE_IN_MS))
    .catch(() => {
      if (activeSounds.get(name) === entry) activeSounds.delete(name);
    });
}

export function updateAmbientVolume(name: string, volume: number) {
  const entry = activeSounds.get(name);
  if (!entry) return;
  entry.volume = clampVolume(volume);
  fadeVolume(entry, entry.volume, VOLUME_RAMP_MS);
}

export function stopAmbientSound(name: string) {
  const entry = activeSounds.get(name);
  if (!entry) return;
  fadeVolume(entry, 0, FADE_OUT_MS, () => {
    entry.audio.pause();
    entry.audio.currentTime = 0;
    if (activeSounds.get(name) === entry) activeSounds.delete(name);
  });
}

export function stopAllAmbientSounds() {
  Array.from(activeSounds.keys()).forEach(stopAmbientSound);
}

export function playCompletionChime() {
  const ctx = getContext();
  const now = ctx.currentTime;

  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.001, now + index * 0.13);
    gain.gain.linearRampToValueAtTime(0.08, now + index * 0.13 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.13 + 0.45);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now + index * 0.13);
    oscillator.stop(now + index * 0.13 + 0.5);
  });
}
