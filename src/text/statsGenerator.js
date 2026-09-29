import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const statsDataPath = path.resolve(__dirname, '../../data/stat_definitions.json');
const statDefs = JSON.parse(fs.readFileSync(statsDataPath, 'utf8'));

export function generateRandomStatValue() {
  const roll = Math.random();
  if (roll < 0.45) {
    // 0-100 percentage
    return `${Math.floor(Math.random() * 95) + 5}/100`;
  } else if (roll < 0.65) {
    // scale 1-10
    return `${Math.floor(Math.random() * 10) + 1}/10`;
  } else if (roll < 0.75) {
    // stars
    const count = Math.floor(Math.random() * 5) + 1;
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  } else if (roll < 0.90) {
    // status word
    const words = statDefs.status_words;
    return words[Math.floor(Math.random() * words.length)];
  } else {
    // special
    const specials = statDefs.special_values;
    return specials[Math.floor(Math.random() * specials.length)];
  }
}

export function generateStatBlock(options = {}) {
  const count = options.count || 4;
  const pool = [...statDefs.stat_pool];
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selectedStats = pool.slice(0, count).map(name => ({
    id: 'stat_' + Math.random().toString(36).substring(2, 9),
    name,
    value: generateRandomStatValue(),
    locked: false
  }));

  const className = options.className || statDefs.classes[Math.floor(Math.random() * statDefs.classes.length)];
  const ability = statDefs.special_abilities[Math.floor(Math.random() * statDefs.special_abilities.length)];
  const passive = statDefs.passive_effects[Math.floor(Math.random() * statDefs.passive_effects.length)];

  return {
    className,
    stats: selectedStats,
    specialAbility: ability,
    passiveEffect: passive
  };
}
