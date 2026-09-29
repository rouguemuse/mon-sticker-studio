import { breakSimilarity } from './similarityBreaker.js';
import { providerRegistry } from '../providers/providerRegistry.js';

export async function synthesizeCreature(archetype, options = {}) {
  // 1. Break similarity
  const broken = breakSimilarity(archetype, options);

  // 2. Request creature asset from active provider
  const provider = providerRegistry.getActiveProvider();
  const asset = await provider.generateCreature({
    archetype: archetype.archetype_family?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'creature',
    name: archetype.name,
    emotion: options.emotion || 'happy',
    palette: broken.palette,
    traits: {
      body: broken.morphology,
      element: broken.signature,
      palette: broken.palette?.name || 'Vibrant'
    }
  });

  return {
    ...asset,
    divergence: broken,
    renderStyle: options.style || 'balanced'
  };
}
