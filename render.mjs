// node render.mjs <font.ttf> <out.mp4>            renders the film
// node render.mjs <font.ttf> <prefix> 0.3,5,12    saves stills
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { FPS, LEN } from './film.js';

const [font, out, stills] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => {
  const p = q.url === '/font.ttf' ? font : path.join(import.meta.dirname, path.basename(q.url));
  if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'font/ttf' });
  r.end(fs.readFileSync(p));
}).listen(0, '127.0.0.1');
await new Promise((r) => srv.once('listening', r));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypost-'));
const chrome = spawn(process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--no-first-run', `http://127.0.0.1:${srv.address().port}/film.html`], { stdio: 'ignore' });
const portFile = path.join(prof, 'DevToolsActivePort');
while (!fs.existsSync(portFile)) await wait(100);
await wait(800);
const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
const tab = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.url.includes('film.html'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });
let id = 0;
const pending = new Map();
ws.onmessage = (m) => { const j = JSON.parse(m.data); pending.get(j.id)?.(j.result); pending.delete(j.id); };
async function ev(expression) {
  const res = await new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } })); });
  if (res.exceptionDetails) { console.error(JSON.stringify(res.exceptionDetails)); process.exit(1); }
  return res.result.value;
}
while (!(await ev('window.ready'))) await wait(100);
const shot = async (v, q) => Buffer.from(await ev(`shot(${v},${q})`), 'base64');
if (stills) {
  for (const s of stills.split(',')) fs.writeFileSync(`${out}-${s}.jpg`, await shot(s, 0.85));
} else {
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', `${FPS}`, '-i', '-', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < FPS * LEN; i++) if (!ff.stdin.write(await shot(i / FPS, 0.95))) await new Promise((r) => ff.stdin.once('drain', r));
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
}
chrome.kill();
process.exit(0);
