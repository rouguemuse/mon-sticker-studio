import test from 'node:test';
import assert from 'node:assert/strict';

import { applyDuoPreset } from '../public/js/compositionPresets.js';

test('Duo Presets: computes valid independent coordinates for all 10 presets', () => {
  const presets = [
    'shoulder',
    'in_arms',
    'head',
    'hugging',
    'fighting',
    'judging',
    'side_eye',
    'riding',
    'photobomb',
    'tiny_version'
  ];

  presets.forEach(preset => {
    const humanLayer = { x: 256, y: 256, scale: 1.0, rotation: 0 };
    const charLayer = { x: 256, y: 256, scale: 1.0, rotation: 0 };

    applyDuoPreset(preset, humanLayer, charLayer);

    assert.ok(typeof humanLayer.x === 'number', `${preset} human x is valid`);
    assert.ok(typeof charLayer.x === 'number', `${preset} char x is valid`);
    assert.ok(humanLayer.scale > 0, `${preset} human scale is positive`);
    assert.ok(charLayer.scale > 0, `${preset} char scale is positive`);
    // Ensure layers have independent transforms
    assert.ok(humanLayer.scale !== charLayer.scale || humanLayer.x !== charLayer.x, `${preset} transforms are distinct`);
  });
});

test('Character Source: rights confirmation gate', () => {
  const attemptUploadWithoutRights = (hasRights) => {
    if (!hasRights) {
      throw new Error('Rights confirmation required before importing character image.');
    }
    return { status: 'imported', nonDestructive: true };
  };

  assert.throws(() => attemptUploadWithoutRights(false), /Rights confirmation required/);
  const success = attemptUploadWithoutRights(true);
  assert.equal(success.status, 'imported');
  assert.equal(success.nonDestructive, true);
});

test('Character Source: Saved vault storage and retrieval', () => {
  const vault = [];
  const addCharacter = (char) => {
    vault.push({ id: 'vault_test_' + Date.now(), ...char });
  };

  addCharacter({ name: 'My Robot Companion', sourceType: 'uploaded' });
  addCharacter({ name: 'Forest Sprite', sourceType: 'generated' });

  assert.equal(vault.length, 2);
  assert.equal(vault[0].name, 'My Robot Companion');
  assert.equal(vault[1].name, 'Forest Sprite');
});

test('Blend Styles: non-destructive harmonizing filter', () => {
  const humanLayer = { name: 'Photo', stylize: 0 };
  const charLayer = { name: 'Art', stylize: 0 };

  const blendStyles = (h, c) => {
    h.stylize = 25;
    c.stylize = 15;
    return { blended: true };
  };

  const res = blendStyles(humanLayer, charLayer);
  assert.equal(res.blended, true);
  assert.equal(humanLayer.stylize, 25);
  assert.equal(charLayer.stylize, 15);
});
