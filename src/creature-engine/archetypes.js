import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const archetypesPath = path.resolve(__dirname, '../../data/archetypes_representative.json');

let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(archetypesPath, 'utf8'));
} catch (e) {
  console.error('Error loading archetypes:', e);
}

export function getAllArchetypes() {
  return catalog;
}

export function getArchetypeById(id) {
  const numId = parseInt(id, 10);
  return catalog.find(a => a.id === numId || a.slot === id.toString().padStart(3, '0')) || catalog[0];
}
