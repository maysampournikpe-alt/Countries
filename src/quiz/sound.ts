import { useStore } from '../store/store';

let ctx: AudioContext | null = null;

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.08) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.05);
}

/** Optional, synthesized sound effects (no audio files to download). Off by default. */
export function play(kind: 'correct' | 'wrong' | 'win') {
  if (!useStore.getState().settings.sound) return;
  try {
    ctx ??= new AudioContext();
    if (kind === 'correct') {
      tone(660, 0, 0.12);
      tone(990, 0.08, 0.18);
    } else if (kind === 'wrong') {
      tone(220, 0, 0.22, 'triangle', 0.06);
    } else {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22));
    }
  } catch {
    /* audio unavailable */
  }
}
