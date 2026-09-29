import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getAllArchetypes, getArchetypeById } from './creature-engine/archetypes.js';
import { synthesizeCreature } from './creature-engine/synthesizer.js';
import { generateStatBlock } from './text/statsGenerator.js';
import { generateRoast, modifyRoast } from './text/roastGenerator.js';
import { validateSticker, validatePack } from './sticker/telegramValidator.js';
import { providerRegistry } from './providers/providerRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const PROJECTS_DIR = path.resolve(__dirname, '../projects');

if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // 20MB limit for base64 image transfers
      if (body.length > 20 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = url.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    try {
      if (pathname === '/api/status' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'ok',
          providers: providerRegistry.listProviders(),
          activeProvider: providerRegistry.getActiveProvider().name
        }));
        return;
      }

      if (pathname === '/api/archetypes' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(getAllArchetypes()));
        return;
      }

      if (pathname === '/api/creature/generate' && req.method === 'POST') {
        const body = await parseBody(req);
        const archetype = getArchetypeById(body.archetypeId || 1);
        const result = await synthesizeCreature(archetype, body);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/stats/generate' && req.method === 'POST') {
        const body = await parseBody(req);
        const result = generateStatBlock(body);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/roast/generate' && req.method === 'POST') {
        const body = await parseBody(req);
        const result = generateRoast(body);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/roast/modify' && req.method === 'POST') {
        const body = await parseBody(req);
        const result = modifyRoast(body.text, body.action, body);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/sticker/validate' && req.method === 'POST') {
        const body = await parseBody(req);
        const result = validateSticker(body);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/pack/validate' && req.method === 'POST') {
        const body = await parseBody(req);
        const result = validatePack(body);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/project/save' && req.method === 'POST') {
        const body = await parseBody(req);
        const id = body.id || 'default_project';
        const filePath = path.join(PROJECTS_DIR, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf8');
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, id }));
        return;
      }

      if (pathname === '/api/project/load' && req.method === 'GET') {
        const id = url.searchParams.get('id') || 'default_project';
        const filePath = path.join(PROJECTS_DIR, `${id}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          res.writeHead(200);
          res.end(content);
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Project not found' }));
        }
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    } catch (err) {
      console.error('API Error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Static File Serving
  let relativePath = pathname === '/' ? 'studio.html' : pathname.replace(/^\//, '');
  let filePath = path.join(PUBLIC_DIR, relativePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to studio.html for single page app
      filePath = path.join(PUBLIC_DIR, 'studio.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Telegram Sticker Pack Creation Studio listening on http://localhost:${PORT}`);
});

export { server };
