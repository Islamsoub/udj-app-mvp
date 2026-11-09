// Static server for the Agent Room. No dependencies.
//   node .claude/room/serve.mjs            → http://localhost:4321
//   node .claude/room/serve.mjs 5000       → another port (or PORT=5000)
// Serves only files inside this folder, on localhost only. The page needs
// HTTP because it cannot fetch events.ndjson over file://.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT || 4321);
const HOST = '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.ndjson': 'application/x-ndjson; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};
// The hook's own code and bookkeeping are not part of the page.
const HIDDEN = new Set(['hook.mjs', 'serve.mjs', 'state.json']);

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
  if (rel === '/') rel = '/index.html';
  const file = path.resolve(ROOT, '.' + rel);
  if (path.dirname(file) !== ROOT || HIDDEN.has(path.basename(file))) { res.writeHead(404).end(); return; }

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found'); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${PORT} is in use. Try: node .claude/room/serve.mjs ${PORT + 1}` : e.message);
  process.exit(1);
});
server.listen(PORT, HOST, () => console.log(`Agent Room: http://localhost:${PORT}`));
