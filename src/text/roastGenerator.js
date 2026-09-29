import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const roastDataPath = path.resolve(__dirname, '../../data/roast_templates.json');
const roastDefs = JSON.parse(fs.readFileSync(roastDataPath, 'utf8'));

export function generateRoast(options = {}) {
  const name = options.name?.trim() || 'This human';
  const className = options.className?.trim() || 'Chaos Operator';
  const intensity = Math.max(1, Math.min(5, parseInt(options.intensity || 2, 10)));
  const userContext = options.context?.trim() || '';

  const templates = roastDefs.templates_by_intensity[intensity.toString()] || roastDefs.templates_by_intensity['2'];
  let chosen = templates[Math.floor(Math.random() * templates.length)];

  chosen = chosen.replaceAll('{name}', name).replaceAll('{class_name}', className);

  if (userContext) {
    // Incorporate user context nicely
    if (intensity === 1) {
      chosen += ` Specifically: despite "${userContext}", they mean well.`;
    } else if (intensity === 2) {
      chosen += ` Exhibit A: "${userContext}". Case closed.`;
    } else if (intensity === 3) {
      chosen += ` And let's not overlook: "${userContext}". Absolutely tragic.`;
    } else if (intensity === 4) {
      chosen += ` Furthermore: "${userContext}" is a cry for clinical intervention.`;
    } else {
      chosen += ` And whoever enabled "${userContext}" should face trial alongside them.`;
    }
  }

  return {
    intensity,
    intensityLabel: roastDefs.intensities[intensity.toString()],
    text: chosen
  };
}

export function modifyRoast(currentText, action, options = {}) {
  const name = options.name?.trim() || 'This individual';
  let text = currentText;

  switch (action) {
    case 'make_meaner':
      return {
        text: text.replace(/\.$/, '') + `, which surprises absolutely nobody who has spent more than 4 seconds in their presence.`
      };
    case 'make_drier':
      return {
        text: `Official Assessment: ${name} presents a consistent, documented deficit in life optimization.`
      };
    case 'make_more_absurd':
      return {
        text: text.replace(/\.$/, '') + `, heavily corroborated by three raccoons currently monitoring their kitchen.`
      };
    case 'shorten': {
      const firstSentence = text.split(/[.?!]/)[0];
      return {
        text: firstSentence ? firstSentence + '.' : text
      };
    }
    default:
      return { text };
  }
}
