import { getAllArchetypes, getArchetypeById } from '../src/creature-engine/archetypes.js';
import { synthesizeCreature } from '../src/creature-engine/synthesizer.js';
import { generateStatBlock } from '../src/text/statsGenerator.js';
import { generateRoast, modifyRoast } from '../src/text/roastGenerator.js';
import { validateSticker, validatePack } from '../src/sticker/telegramValidator.js';
import { providerRegistry } from '../src/providers/providerRegistry.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Parse path (handles /api/foo or foo)
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = url.pathname;
  if (!pathname.startsWith('/api/')) {
    pathname = '/api/' + pathname.replace(/^\//, '');
  }

  // In Vercel, req.body is often parsed automatically if JSON, or a string/buffer
  let body = req.body;
  if (typeof body === 'string' && body.length > 0) {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  } else if (!body) {
    body = {};
  }

  try {
    if (pathname === '/api/status' && req.method === 'GET') {
      return res.status(200).json({
        status: 'ok',
        providers: providerRegistry.listProviders(),
        activeProvider: providerRegistry.getActiveProvider().name
      });
    }

    if (pathname === '/api/archetypes' && req.method === 'GET') {
      return res.status(200).json(getAllArchetypes());
    }

    if (pathname === '/api/creature/generate' && req.method === 'POST') {
      const archetype = getArchetypeById(body.archetypeId || 1);
      const result = await synthesizeCreature(archetype, body);
      return res.status(200).json(result);
    }

    if (pathname === '/api/stats/generate' && req.method === 'POST') {
      const result = generateStatBlock(body);
      return res.status(200).json(result);
    }

    if (pathname === '/api/roast/generate' && req.method === 'POST') {
      const result = generateRoast(body);
      return res.status(200).json(result);
    }

    if (pathname === '/api/roast/modify' && req.method === 'POST') {
      const result = modifyRoast(body.text, body.action, body);
      return res.status(200).json(result);
    }

    if (pathname === '/api/sticker/validate' && req.method === 'POST') {
      const result = validateSticker(body);
      return res.status(200).json(result);
    }

    if (pathname === '/api/pack/validate' && req.method === 'POST') {
      const result = validatePack(body);
      return res.status(200).json(result);
    }

    return res.status(404).json({ error: `Endpoint "${pathname}" not found` });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
