// Tiny Post: one village, one courier. `day` (1..7) switches on each daily update.
const W = 1080, H = 1920, ROAD = 540, RIVER = 925;
const HOUSES = [
  { x: 250, y: 1210, c: '#e4572e' }, { x: 830, y: 790, c: '#2e86ab' }, { x: 250, y: 480, c: '#f2b134' },
  { x: 830, y: 480, c: '#8f5fbf' }, { x: 250, y: 790, c: '#3fa34d' }, { x: 830, y: 1210, c: '#d6498f' },
];
// The bot's round: out of the gate, then every door in turn.
const ROUTE = [[540, 1430]];
for (const h of HOUSES) ROUTE.push([ROAD, h.y], [h.x, h.y], [ROAD, h.y]);
const SPEED = 560, TAU = Math.PI * 2;
const LEGS = ROUTE.slice(1)
  .map((p, i) => ({ a: ROUTE[i], b: p, d: Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]) }))
  .filter((l) => l.d > 0);
const TOTAL = LEGS.reduce((s, l) => s + l.d, 0);

function botAt(t) {
  let d = Math.max(0, t * SPEED) % TOTAL;
  for (const l of LEGS) {
    if (d <= l.d) {
      const k = d / l.d;
      return { x: l.a[0] + (l.b[0] - l.a[0]) * k, y: l.a[1] + (l.b[1] - l.a[1]) * k, dir: Math.sign(l.b[0] - l.a[0]) || 1 };
    }
    d -= l.d;
  }
  return { x: 540, y: 1430, dir: 1 };
}
const DELIVERED = HOUSES.map((h) => {
  let s = 0;
  for (const l of LEGS) { s += l.d; if (l.b[0] === h.x && l.b[1] === h.y) break; }
  return s / SPEED;
});

function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
const riverY = (x) => RIVER + Math.sin(x / 170) * 14;
const onPath = (x, y) => HOUSES.some((h) => Math.abs(y - h.y) < 45 && x > Math.min(h.x, ROAD) - 40 && x < Math.max(h.x, ROAD) + 40);
const free = (x, y) => Math.abs(x - ROAD) > 90 && Math.abs(y - RIVER) > 95 && !onPath(x, y)
  && !HOUSES.some((h) => Math.abs(x - h.x) < 150 && y > h.y - 230 && y < h.y + 50);
const r0 = rng(77);
function scatter(n, ok) {
  const o = [];
  for (let i = 0; o.length < n && i < 6000; i++) {
    const x = r0() * W, y = 30 + r0() * (H - 60);
    if (free(x, y) && ok(x, y, o)) o.push({ x, y, k: r0() });
  }
  return o;
}
const TREES = scatter(46, (x, y, o) => o.every((p) => Math.hypot(p.x - x, p.y - y) > 92));
const TUFTS = scatter(260, () => true);
const FLOWERS = scatter(190, () => true);
const FLIES = scatter(60, () => true);
const LAMPS = [[455, 1340], [625, 1080], [455, 700], [625, 600], [455, 390], [625, 1560]];

let g;
const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const disc = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); g.fill(); };
const oval = (x, y, a, b, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, a, b, 0, 0, TAU); g.fill(); };
const poly = (pts, c) => { g.fillStyle = c; g.beginPath(); for (const p of pts) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
const round = (x, y, w, h, r, c) => { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
function stroke(pts, c, w) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); }

function ground(day, t) {
  if (day === 1) {
    rect(0, 0, W, H, '#8b9388');
    rect(0, RIVER - 55, W, 110, '#6d7f8f');
    rect(ROAD - 45, 300, 90, H, '#a9aaa4');
    for (const h of HOUSES) rect(Math.min(h.x, ROAD), h.y - 25, Math.abs(h.x - ROAD), 50, '#a9aaa4');
    return;
  }
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#83b85a'); gr.addColorStop(1, '#5f9b4c');
  rect(0, 0, W, H, gr);
  for (const p of TUFTS) {
    const s = day > 2 ? Math.sin(t * 2 + p.x) * 3 : 0, c = p.k > 0.5 ? '#4d8a3e' : '#9ccb6c';
    for (const d of [-7, 0, 7]) stroke([[p.x + d, p.y], [p.x + d * 1.4 + s, p.y - 16]], c, 4);
  }
  for (const [pad, c] of [[12, '#b98d57'], [0, '#e2c08a']]) {
    round(ROAD - 45 - pad, 300, 90 + pad * 2, H, 40, c);
    for (const h of HOUSES) round(Math.min(h.x, ROAD) - 40, h.y - 27 - pad, Math.abs(h.x - ROAD) + 80, 54 + pad * 2, 30, c);
  }
  for (const [w, c] of [[78, '#c9a871'], [66, '#4fa3c7'], [46, '#63b8d8']]) {
    const pts = [];
    for (let x = -20; x <= W + 20; x += 20) pts.push([x, riverY(x) - w]);
    for (let x = W + 20; x >= -20; x -= 20) pts.push([x, riverY(x) + w]);
    poly(pts, c);
  }
  for (let i = 0; i < 26; i++) {
    const x = ((i * 131 + t * 90) % (W + 120)) - 60, y = riverY(x) - 40 + ((i * 37) % 80);
    stroke([[x, y], [x + 34, y + 2]], 'rgba(255,255,255,.6)', 5);
  }
  rect(ROAD - 66, RIVER - 92, 132, 184, '#7c4f2b');
  for (let y = RIVER - 88; y < RIVER + 86; y += 23) rect(ROAD - 60, y, 120, 18, '#b57b45');
  rect(ROAD - 74, RIVER - 98, 14, 196, '#5b371c'); rect(ROAD + 60, RIVER - 98, 14, 196, '#5b371c');
  if (day < 4) return;
  for (const p of FLOWERS) {
    const c = ['#fff', '#ffd93d', '#ff7aa8', '#c78bff'][Math.floor(p.k * 4)];
    for (let a = 0; a < 5; a++) disc(p.x + Math.cos(a * 1.257) * 6, p.y + Math.sin(a * 1.257) * 6, 5, c);
    disc(p.x, p.y, 4, '#e08a1e');
  }
}

function house(h, i, day, t) {
  const { x, y, c } = h, L = x - 95, done = t % (TOTAL / SPEED) >= DELIVERED[i];
  if (day < 3) {
    rect(L, y - 165, 190, 140, day === 1 ? '#5f655f' : c);
    if (!done) rect(x - 14, y - 60, 28, 20, '#fff');
    return;
  }
  oval(x + 20, y - 22, 125, 30, 'rgba(20,40,20,.28)');
  rect(L + 8, y - 130, 174, 106, '#fbeed5'); rect(L + 8, y - 44, 174, 20, '#d8c4a0');
  rect(x + 46, y - 222, 30, 66, '#8a4b3a'); rect(x + 41, y - 226, 40, 12, '#6b3527');
  poly([[L - 18, y - 120], [x - 62, y - 206], [x + 62, y - 206], [L + 208, y - 120]], c);
  for (let k = 1; k < 4; k++) stroke([[L - 18 + k * 12, y - 120 - k * 21], [L + 208 - k * 12, y - 120 - k * 21]], 'rgba(0,0,0,.16)', 4);
  round(x - 22, y - 92, 44, 68, [22, 22, 0, 0], '#6b3f24'); disc(x + 12, y - 56, 4, '#f7d154');
  const lit = day >= 5 ? (done ? '#fff2a8' : '#ffc95c') : '#8ec9dd';
  for (const wx of [x - 74, x + 38]) {
    rect(wx - 4, y - 102, 44, 44, '#7a5230'); rect(wx, y - 98, 36, 36, lit);
    rect(wx + 16, y - 98, 4, 36, '#7a5230'); rect(wx, y - 82, 36, 4, '#7a5230');
    if (day < 4) continue;
    rect(wx - 6, y - 60, 48, 12, '#8a5a34');
    for (let k = 0; k < 4; k++) disc(wx + k * 12, y - 63, 7, ['#ff6b8a', '#ffd93d', '#fff', '#c78bff'][k]);
  }
  rect(x + 98, y - 50, 8, 34, '#5b371c'); round(x + 82, y - 72, 40, 26, 8, done ? '#57c46a' : '#e23b3b');
  if (done || day < 4) return;
  const b = y - 122 + Math.sin(t * 6 + i) * 6;
  round(x + 85, b, 34, 26, 4, '#fff');
  stroke([[x + 85, b + 2], [x + 102, b + 16], [x + 119, b + 2]], '#d04b4b', 3);
}

function tree(p, day, t) {
  const s = 0.8 + p.k * 0.5, w = Math.sin(t * 1.6 + p.x) * 5;
  oval(p.x + 10, p.y, 44 * s, 15 * s, 'rgba(20,40,20,.28)'); rect(p.x - 7, p.y - 36 * s, 14, 36 * s, '#6b4226');
  const pal = day >= 6 && p.k > 0.6 ? ['#e08aa8', '#f4aec4', '#ffd0de'] : ['#2f6b3a', '#3f8a48', '#5cab58'];
  disc(p.x + w, p.y - 62 * s, 42 * s, pal[0]); disc(p.x - 12 + w, p.y - 72 * s, 30 * s, pal[1]); disc(p.x - 8 + w, p.y - 84 * s, 16 * s, pal[2]);
}

function person(x, y, t, c, hat, bag, dir, sc) {
  const step = Math.sin(t * 11);
  g.save(); g.translate(x, y); g.scale(sc * dir, sc);
  oval(0, 2, 26, 9, 'rgba(20,40,20,.35)');
  rect(-12 + step * 9, -18, 10, 18, '#33384f'); rect(3 - step * 9, -18, 10, 18, '#33384f');
  g.translate(0, -Math.abs(step) * 9);
  round(-19, -58, 38, 44, 13, c); disc(0, -74, 20, '#f6cfa4'); disc(8, -76, 3.4, '#2b2b2b');
  round(-22, -98, 44, 18, 8, hat); rect(6, -84, 24, 7, hat);
  if (bag) { round(-32, -56, 24, 32, 6, '#a0632f'); rect(-28, -62, 14, 10, '#fff'); }
  g.restore();
}

function cat(x, y, dir, c, t) {
  g.save(); g.translate(x, y); g.scale(dir, 1);
  oval(0, 2, 34, 9, 'rgba(20,40,20,.3)'); oval(0, -20, 30, 19, c); disc(26, -34, 15, c);
  poly([[18, -44], [20, -62], [29, -46]], c); poly([[27, -46], [36, -60], [38, -42]], c); disc(31, -36, 3, '#222');
  stroke([[-26, -24], [-44, -30], [-46, -56 + Math.sin(t * 6) * 6]], c, 8);
  g.restore();
}

const CATS = [[160, 1330, 110, '#f4f4f4'], [850, 1050, 110, '#e9954a'], [760, 1340, 110, '#4a4a55'], [150, 620, 80, '#f4f4f4']];
const FOLK = [[360, 1210, '#4a7bd0', '#f3d250'], [700, 790, '#d0574a', '#5a3d2b'], [640, 1500, '#4aa86a', '#fff'], [400, 480, '#b15ad0', '#333']];
function critters(day, t) {
  const out = [];
  if (day >= 4) CATS.forEach(([x, y, r, c], i) => {
    const a = t * 0.9 + i * 2;
    out.push({ y, f: () => cat(x + Math.sin(a) * r, y, Math.cos(a) > 0 ? 1 : -1, c, t) });
  });
  if (day >= 5) FOLK.forEach(([x, y, c, hat], i) => {
    const a = t * 0.8 + i;
    out.push({ y: y + 36, f: () => person(x + Math.sin(a) * 60, y + 36, t * 0.6 + i, c, hat, false, Math.cos(a) > 0 ? 1 : -1, 0.8) });
  });
  return out;
}

function river(day, t) {
  if (day < 4) return;
  for (let i = 0; i < 5; i++) {
    const x = ((t * 60 + i * 95 + 100) % (W + 200)) - 100, y = riverY(x) + (i % 2 ? 22 : -20) + Math.sin(t * 3 + i) * 3, s = i ? 0.65 : 1;
    if (Math.abs(x - ROAD) < 95) continue;
    oval(x, y, 24 * s, 14 * s, i ? '#ffe06b' : '#fff'); disc(x + 18 * s, y - 15 * s, 11 * s, i ? '#ffe06b' : '#2f7d4f');
    poly([[x + 27 * s, y - 17 * s], [x + 40 * s, y - 13 * s], [x + 27 * s, y - 9 * s]], '#f08a24');
  }
  const x = W - ((t * 70) % (W + 300)) + 100, y = riverY(x);
  if (day < 6 || Math.abs(x - ROAD) < 140) return;
  poly([[x - 70, y - 12], [x + 70, y - 12], [x + 48, y + 24], [x - 48, y + 24]], '#8a4b2a');
  poly([[x, y - 110], [x, y - 18], [x + 62, y - 18]], '#fff3d6'); poly([[x - 6, y - 96], [x - 6, y - 18], [x - 44, y - 18]], '#e4572e');
}

function glow(x, y, r, c, a) {
  const q = g.createRadialGradient(x, y, 0, x, y, r);
  q.addColorStop(0, c); q.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = a; rect(x - r, y - r, r * 2, r * 2, q); g.globalAlpha = 1;
}
function light(day, t, hero) {
  if (day < 5) return;
  g.globalCompositeOperation = 'multiply'; rect(0, 0, W, H, day >= 7 ? '#6a6bb4' : '#b58fa8');
  g.globalCompositeOperation = 'lighter';
  const a = day >= 7 ? 0.62 : 0.4;
  for (const h of HOUSES) { glow(h.x - 56, h.y - 80, 130, '#ff9d3c', a); glow(h.x + 56, h.y - 80, 130, '#ff9d3c', a); }
  for (const [x, y] of LAMPS) { glow(x, y - 110, 210, '#ffb44a', a); disc(x, y - 110, 13, '#fff0b0'); }
  glow(hero.x, hero.y - 40, 230, '#ffd9a0', a * 0.8);
  if (day >= 6) for (const p of FLIES) {
    const x = p.x + Math.sin(t * 1.1 + p.k * 40) * 34, y = p.y + Math.cos(t * 1.4 + p.k * 60) * 26, b = 0.5 + 0.5 * Math.sin(t * 4 + p.k * 30);
    glow(x, y, 30, '#d8ff6a', b * 0.9); disc(x, y, 3.5 * b, '#f6ffcc');
  }
  g.globalCompositeOperation = 'source-over';
}
function smoke(day, t) {
  if (day < 6) return;
  HOUSES.forEach((h, i) => {
    for (let k = 0; k < 6; k++) {
      const f = (t * 0.35 + k / 6 + i * 0.13) % 1;
      disc(h.x + 61 + Math.sin(f * 5 + i) * 16 + f * 34, h.y - 232 - f * 130, 9 + f * 22, `rgba(235,230,245,${0.5 * (1 - f)})`);
    }
  });
}
function burst(x, y, f, c, n, R) {
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU, r = R * (1 - (1 - f) ** 3) * (k % 2 ? 1 : 0.6);
    g.globalAlpha = 1 - f;
    disc(x + Math.cos(a) * r, y + Math.sin(a) * r + f * f * 50, 8 * (1 - f) + 2, c);
  }
  g.globalAlpha = 1;
}
function balloon(x, y, c) {
  glow(x, y, 170, '#ffb44a', 0.4);
  oval(x, y, 72, 84, c); oval(x, y, 42, 84, '#fff3d6'); oval(x, y, 18, 84, c);
  stroke([[x - 36, y + 72], [x - 20, y + 112]], '#4b3020', 3); stroke([[x + 36, y + 72], [x + 20, y + 112]], '#4b3020', 3);
  round(x - 24, y + 110, 48, 34, 6, '#9a6233');
}
function festival(day, t) {
  if (day < 7) return;
  for (const y of [585, 1290]) {
    const sag = (x) => y + Math.sin((x / W) * Math.PI * 3) ** 2 * 46, pts = [];
    for (let x = 0; x <= W; x += 20) pts.push([x, sag(x)]);
    stroke(pts, '#f7e9c8', 4);
    for (let i = 0; i < 22; i++) {
      const x = 24 + i * 49, b = sag(x);
      poly([[x - 16, b], [x + 16, b], [x + Math.sin(t * 5 + i) * 5, b + 36]], ['#ff5d73', '#ffd93d', '#4fd1c5', '#b98cff'][i % 4]);
    }
  }
  for (const [x, y, c, p] of [[110, 330, '#ff5d73', 0], [970, 300, '#4fd1c5', 2], [960, 1400, '#ffd93d', 4]]) balloon(x + Math.sin(t * 0.6 + p) * 30, y + Math.sin(t * 1.1 + p) * 20, c);
  for (let k = 0; k < 7; k++) {
    const T = t - k * 0.34 + 2.4, f = (T % 2.4) / 1.3, n = k + Math.floor(T / 2.4) * 7;
    if (f < 1) burst(110 + ((n * 397) % 860), 120 + ((n * 211) % 480), f, ['#ff8fa3', '#ffe27a', '#7df0e2', '#d3b2ff'][n % 4], 22, 170);
  }
}

// One frame of the game, `t` seconds after the same start.
export function draw(ctx, day, t, hero = botAt(t)) {
  g = ctx; g.save(); g.lineCap = 'round';
  ground(day, t); river(day, t);
  const objs = HOUSES.map((h, i) => ({ y: h.y - 24, f: () => house(h, i, day, t) }));
  if (day >= 3) for (const p of TREES) objs.push({ y: p.y, f: () => tree(p, day, t) });
  objs.push(...critters(day, t));
  if (day >= 5) for (const [x, y] of LAMPS) objs.push({ y, f: () => { oval(x, y, 18, 6, 'rgba(0,0,0,.3)'); rect(x - 5, y - 100, 10, 100, '#2f2a3a'); round(x - 17, y - 126, 34, 34, 8, '#2f2a3a'); } });
  if (day >= 6) for (let k = 1; k < 14; k++) { const b = botAt(t - k * 0.04); disc(b.x, b.y - 12 - k * 1.5, 12 - k * 0.75, `rgba(255,240,200,${0.5 - k * 0.034})`); }
  objs.push({ y: hero.y + 1, f: () => (day === 1 ? rect(hero.x - 22, hero.y - 44, 44, 44, '#d94f3d') : person(hero.x, hero.y, t, '#d94f3d', '#b03226', day >= 4, hero.dir, 1.12)) });
  objs.sort((a, b) => a.y - b.y).forEach((o) => o.f());
  smoke(day, t); light(day, t, hero); festival(day, t);
  HOUSES.forEach((h, i) => {
    const f = (t % (TOTAL / SPEED) - DELIVERED[i]) / 1.1;
    if (f <= 0 || f >= 1 || day < 2) return;
    if (day >= 4) burst(h.x, h.y - 110, f, '#ffe27a', 18, day >= 7 ? 200 : 110);
    g.globalAlpha = 1 - f; g.font = '800 54px JB, monospace'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = '#2a1c33'; g.lineWidth = 10;
    g.strokeText('+10', h.x, h.y - 190 - f * 70); g.fillText('+10', h.x, h.y - 190 - f * 70); g.globalAlpha = 1;
  });
  g.restore();
}
// Player movement: the river only crosses at the bridge, and houses are solid.
export function walk(p, dx, dy) {
  const x = Math.max(30, Math.min(W - 30, p.x + dx)), y = Math.max(60, Math.min(H - 20, p.y + dy));
  const wet = Math.abs(y - RIVER) < 70 && Math.abs(x - ROAD) > 58;
  const wall = HOUSES.some((h) => Math.abs(x - h.x) < 100 && y > h.y - 160 && y < h.y - 24);
  return wet || wall ? p : { x, y, dir: Math.sign(dx) || p.dir };
}
export { W, H };
