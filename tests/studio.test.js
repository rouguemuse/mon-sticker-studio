import test from 'node:test';
import assert from 'node:assert/strict';

import { generateStatBlock } from '../src/text/statsGenerator.js';
import { generateRoast, modifyRoast } from '../src/text/roastGenerator.js';
import { validateSticker, validatePack } from '../src/sticker/telegramValidator.js';
import { breakSimilarity, evaluateSimilarityRisk } from '../src/creature-engine/similarityBreaker.js';
import { getAllArchetypes } from '../src/creature-engine/archetypes.js';

test('statsGenerator produces valid stats and class', () => {
  const stats = generateStatBlock({ count: 4 });
  assert.ok(stats.className, 'Has class name');
  assert.equal(stats.stats.length, 4, 'Has 4 stats');
  assert.ok(stats.specialAbility, 'Has special ability');
  assert.ok(stats.passiveEffect, 'Has passive effect');
});

test('roastGenerator generates with intensity and context', () => {
  const roast = generateRoast({
    name: 'Rachel',
    className: 'Parking Lot Necromancer',
    intensity: 3,
    context: 'Orders food and then eats everyone elses'
  });
  assert.ok(roast.text.includes('Rachel'), 'Contains target name');
  assert.ok(roast.text.toLowerCase().includes('orders food'), 'Incorporates context');
  assert.equal(roast.intensity, 3);

  const modified = modifyRoast(roast.text, 'shorten');
  assert.ok(modified.text.length <= roast.text.length, 'Shortened successfully');
});

test('telegramValidator validates 512x512 requirements and emoji constraint', () => {
  // Test valid sticker
  const validSticker = {
    width: 512,
    height: 512,
    sizeBytes: 150 * 1024,
    format: 'webp',
    emoji: '🔥'
  };
  const validRes = validateSticker(validSticker);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.statusText, '✓ Telegram Ready');

  // Test missing emoji
  const noEmojiSticker = {
    width: 512,
    height: 512,
    sizeBytes: 150 * 1024,
    format: 'webp',
    emoji: ''
  };
  const noEmojiRes = validateSticker(noEmojiSticker);
  assert.equal(noEmojiRes.valid, false);
  assert.ok(noEmojiRes.errors[0].includes('associated emoji'));

  // Test invalid dimensions
  const wrongDimSticker = {
    width: 400,
    height: 300,
    sizeBytes: 100 * 1024,
    format: 'webp',
    emoji: '😂'
  };
  const wrongDimRes = validateSticker(wrongDimSticker);
  assert.equal(wrongDimRes.valid, false);
  assert.ok(wrongDimRes.errors[0].includes('dimensions'));
});

test('similarityBreaker mutates at least 2 axes from archetype', () => {
  const archetypes = getAllArchetypes();
  assert.ok(archetypes.length >= 4, 'Has representative archetypes');

  const slot1 = archetypes[0];
  const broken = breakSimilarity(slot1, {});
  assert.ok(broken.morphology, 'Has mutated morphology');
  assert.ok(broken.signature, 'Has mutated signature element');
  assert.ok(broken.palette, 'Has mutated palette');
  assert.ok(broken.divergenceAxesCount >= 2, 'Mutated at least 2 axes');
});
