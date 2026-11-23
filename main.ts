// Hands in the Tiny Post video: puts VIDEO.json where the grader reads it.
import fs from 'node:fs';
import path from 'node:path';

const from = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const to = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
fs.mkdirSync(to, { recursive: true });
fs.writeFileSync(path.join(to, 'VIDEO.json'), fs.readFileSync(path.join(from, 'VIDEO.json')));
