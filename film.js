// The edit: from video second `at`, show build `day` from game second `from`.
import { draw, W } from './game.js';
export const FPS = 60, LEN = 16.5;
export const CUTS = [
  [0, 1, 0.1], [0.5, 7, 0.1], [1, 1, 0.75], [1.5, 7, 0.75],
  [2, 1, 0.1], [4, 7, 0.1],
  ...[1, 2, 3, 4, 5, 6, 7].map((d, i) => [6.5 + i * 0.5, d, 0.8]),
  [10, 7, 1.3],
];
function line(g, s, y, size, bg, fg) {
  g.font = `800 ${size}px JB`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = g.measureText(s).width;
  g.fillStyle = bg; g.beginPath(); g.roundRect(W / 2 - w / 2 - 30, y - size * 0.8, w + 60, size * 1.6, 22); g.fill();
  g.fillStyle = fg; g.fillText(s, W / 2, y + 2); g.textBaseline = 'alphabetic';
}
export function film(g, v) {
  const [at, day, from] = CUTS.filter((k) => k[0] <= v).pop();
  draw(g, day, from + v - at);
  line(g, `DAY ${day}`, 190, 80 + Math.max(0, 1 - (v - at) * 6) * 18, day === 1 ? '#22252b' : '#e6007a', '#fff');
  const say = v < 2 ? 'SAME MAP. SAME START.' : v < 4 ? 'remember this move...' : v < 6.5 ? 'same move, 6 updates later' : v < 10 ? 'one update per build' : 'START YOURS AT make.fun';
  line(g, say, 306, 50, '#fff', '#191419');
  if (v < 14) line(g, 'a week of updates, squeezed into 1 AI session', 1480, 31, 'rgba(25,20,25,.85)', '#fff');
}
