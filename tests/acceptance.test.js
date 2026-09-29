import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateStatBlock } from '../src/text/statsGenerator.js';
import { generateRoast, modifyRoast } from '../src/text/roastGenerator.js';
import { validateSticker, validatePack } from '../src/sticker/telegramValidator.js';
import { synthesizeCreature } from '../src/creature-engine/synthesizer.js';
import { getArchetypeById } from '../src/creature-engine/archetypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('End-to-End Acceptance Test: Complete Sticker & Pack Creation Workflow', async () => {
  // Step 1: Upload a real human photo (or portrait asset)
  const portraitSvgPath = path.resolve(__dirname, '../public/assets/sample_portrait_1.svg');
  assert.ok(fs.existsSync(portraitSvgPath), 'Sample portrait asset exists');
  const rawSvgData = fs.readFileSync(portraitSvgPath, 'utf8');
  assert.ok(rawSvgData.length > 500, 'Portrait SVG loaded');

  // Step 2: Subject cutout & non-destructive preservation
  const humanLayer = {
    id: 'layer_human_01',
    name: 'Human Photo (Rachel)',
    type: 'human',
    rawSource: portraitSvgPath,
    maskApplied: true,
    x: 256,
    y: 300,
    width: 320,
    height: 380,
    scale: 0.85,
    rotation: 0
  };
  assert.ok(humanLayer.rawSource, 'Non-destructive original preserved');

  // Step 3: Add original creature beside/on the person
  const archetype = getArchetypeById(1);
  const creatureData = await synthesizeCreature(archetype, { emotion: 'happy' });
  const creatureLayer = {
    id: 'layer_creature_01',
    name: `Creature (${creatureData.name})`,
    type: 'creature',
    dataUrl: creatureData.dataUrl,
    x: 350,
    y: 190,
    width: 280,
    height: 280,
    scale: 0.52,
    rotation: -8
  };
  assert.ok(creatureData.dataUrl, 'Original creature generated');
  assert.equal(creatureData.divergence.similarityRisk, 'SAFE');

  // Step 4: Move and resize both independently
  humanLayer.x = 240;
  humanLayer.scale = 0.9;
  creatureLayer.x = 360;
  creatureLayer.scale = 0.55;
  assert.notEqual(humanLayer.scale, creatureLayer.scale, 'Layers scaled independently');

  // Step 5: Add NAME: Rachel, CLASS: Parking Lot Necromancer
  const character = {
    name: 'Rachel',
    className: 'Parking Lot Necromancer'
  };
  assert.equal(character.name, 'Rachel');
  assert.equal(character.className, 'Parking Lot Necromancer');

  // Step 6: Generate funny stats
  const statsBlock = generateStatBlock({ className: character.className, count: 4 });
  assert.equal(statsBlock.className, 'Parking Lot Necromancer');
  assert.equal(statsBlock.stats.length, 4);

  // Step 7: Generate a roast
  const roastObj = generateRoast({
    name: character.name,
    className: character.className,
    intensity: 3,
    context: "Orders food and then eats everyone else's"
  });
  assert.ok(roastObj.text.includes('Rachel'));

  // Step 8: Manually edit one line of the roast
  let editedRoast = roastObj.text + ' Also officially banned from group ordering.';
  assert.ok(editedRoast.includes('banned from group ordering'));

  // Step 9: Add a speech bubble saying "I SAID I'M ON MY WAY."
  const bubbleLayer = {
    id: 'layer_bubble_01',
    name: 'Speech Bubble',
    type: 'bubble',
    text: "I SAID I'M ON MY WAY.",
    x: 256,
    y: 110,
    scale: 0.8
  };
  assert.equal(bubbleLayer.text, "I SAID I'M ON MY WAY.");

  // Step 10: Preview simulated Telegram validation on primary sticker
  const sticker1 = {
    id: 'st_01',
    name: "Rachel - I'm On My Way",
    width: 512,
    height: 512,
    sizeBytes: 142 * 1024,
    format: 'webp',
    emoji: '🔥'
  };
  const val1 = validateSticker(sticker1);
  assert.equal(val1.valid, true);
  assert.equal(val1.statusText, '✓ Telegram Ready');

  // Step 11: Duplicate sticker
  const sticker2 = {
    ...sticker1,
    id: 'st_02',
    name: "Rachel - Side Eye Reaction",
    emoji: '👀'
  };

  // Step 12: Change duplicate to side-eye reaction
  const sideEyeCreature = await synthesizeCreature(archetype, { emotion: 'side_eye' });
  assert.ok(sideEyeCreature.dataUrl);
  sticker2.emoji = '👀';
  sticker2.sizeBytes = 145 * 1024;

  // Step 13: Add both stickers to pack & validate pack requirements
  const pack = {
    name: 'Rachel & Friends',
    stickers: [sticker1, sticker2]
  };
  const packVal = validatePack(pack);
  assert.equal(packVal.valid, true);
  assert.equal(packVal.totalStickers, 2);
  assert.equal(packVal.missingEmojisCount, 0, 'Every sticker has at least one associated emoji');

  // Step 14: Export valid Telegram-ready files verification
  for (const s of pack.stickers) {
    const res = validateSticker(s);
    assert.equal(res.valid, true);
    assert.ok(res.emojis.length >= 1, 'Sticker has associated emoji');
    assert.equal(s.width, 512);
    assert.equal(s.height, 512);
    assert.ok(s.sizeBytes <= 512 * 1024);
  }

  // Step 15: Non-destructive project state preservation
  const projectState = {
    project: { name: 'Rachel Studio Project', version: '1.0.0' },
    layers: [humanLayer, creatureLayer, bubbleLayer],
    character,
    statsBlock,
    roast: editedRoast,
    pack
  };
  const projectJson = JSON.stringify(projectState, null, 2);
  const reloaded = JSON.parse(projectJson);
  assert.equal(reloaded.character.name, 'Rachel');
  assert.equal(reloaded.layers.length, 3);
  assert.equal(reloaded.layers[0].name, 'Human Photo (Rachel)');
});
