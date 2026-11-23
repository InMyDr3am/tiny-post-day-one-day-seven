// node music.mjs <out.wav>: one tune at 120 bpm; a thin beep on day 1, one more layer per build.
import fs from 'node:fs';
import { CUTS, LEN } from './film.js';

const SR = 48000, N = Math.round(SR * LEN), mix = new Float32Array(N), TAU = Math.PI * 2;
const dayAt = (s) => CUTS.filter((k) => k[0] <= s + 1e-6).pop()[1];
const hz = (n) => 440 * 2 ** ((n - 69) / 12);
let noise = 1;
const rnd = () => { noise = (noise * 16807) % 2147483647; return noise / 1073741823.5 - 1; };
function add(at, len, vol, f, decay) {
  const s = Math.round(at * SR);
  for (let i = 0; i < len * SR && s + i < N; i++) { const t = i / SR; mix[s + i] += f(t) * vol * Math.exp(-t * decay) * Math.min(1, t * 400); }
}
const ROOTS = [60, 57, 65, 67];
const TUNE = [72, 76, 79, 76, 81, 79, 76, 74];
for (let k = 0; k < LEN * 4; k++) {
  const at = k / 4, day = dayAt(at), root = ROOTS[Math.floor(k / 8) % 4], f = hz(TUNE[k % 8] + (root === 57 || root === 65 ? -3 : 0));
  if (day === 1) { add(at, 0.12, 0.09, (t) => Math.sign(Math.sin(TAU * f * t)), 6); continue; }
  add(at, 0.6, 0.16, (t) => Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2 * t), 7);
  if (day >= 3 && k % 2 === 0) add(at, 0.3, 0.6, (t) => Math.sin(TAU * (48 * t - 4 * Math.exp(-t * 30))), 11);
  if (day >= 4) add(at + 0.125, 0.08, 0.07, rnd, 50);
  if (day >= 4 && k % 4 === 2) add(at, 0.2, 0.2, rnd, 22);
  if (day >= 5) add(at, 0.24, 0.17, (t) => Math.sin(TAU * hz(root - 24) * t) + 0.3 * Math.sin(TAU * hz(root - 12) * t), 5);
  if (day >= 6 && k % 4 === 0) for (const n of [0, 4, 7]) add(at, 0.9, 0.06, (t) => Math.sin(TAU * hz(root + n) * t) + 0.3 * Math.sin(TAU * hz(root + n) * 1.004 * t), 2);
  if (day >= 7) add(at + 0.125, 0.4, 0.07, (t) => Math.sin(TAU * f * 2 * t), 10);
}
for (const [at] of CUTS) if (at) add(at, 0.35, 0.22, rnd, 14);
const pcm = Buffer.alloc(N * 2);
for (let i = 0; i < N; i++) pcm.writeInt16LE(Math.round(Math.tanh(mix[i] * 1.2) * Math.min(1, (N - i) / SR / 0.6) * 30000), i * 2);
const head = Buffer.alloc(44);
head.write('RIFF'); head.writeUInt32LE(36 + N * 2, 4); head.write('WAVEfmt ', 8); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22);
head.writeUInt32LE(SR, 24); head.writeUInt32LE(SR * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34); head.write('data', 36); head.writeUInt32LE(N * 2, 40);
fs.writeFileSync(process.argv[2], Buffer.concat([head, pcm]));
