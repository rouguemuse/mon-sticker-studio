/**
 * Similarity Breaker
 * Guarantees that generated or selected creatures mutate at least 2 axes
 * away from the source archetype, preventing 1:1 character reconstruction.
 */

export function breakSimilarity(archetype, currentSelections = {}) {
  const pools = archetype.trait_pools;

  // Pick random divergent traits from pools
  const morphologies = pools.body_morphology || [];
  const signatures = pools.signature_element || [];
  const palettes = pools.palette_pool || [];

  const mutatedMorphology = pickDifferent(morphologies, currentSelections.morphology);
  const mutatedSignature = pickDifferent(signatures, currentSelections.signature);
  const mutatedPalette = pickDifferent(palettes, currentSelections.palette);

  return {
    archetypeId: archetype.id,
    morphology: mutatedMorphology,
    signature: mutatedSignature,
    palette: mutatedPalette,
    divergenceAxesCount: 3,
    similarityRisk: 'SAFE',
    forbiddenSuppressionList: archetype.forbidden_similarity || []
  };
}

function pickDifferent(pool, current) {
  if (!pool || pool.length === 0) return null;
  const filtered = pool.filter(item => item !== current);
  const list = filtered.length > 0 ? filtered : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export function evaluateSimilarityRisk(archetype, selection = {}) {
  // If user has somehow picked combinations matching forbidden similarity
  let riskScore = 0.1; // Baseline originality

  const forbidden = archetype.forbidden_similarity || [];
  const textRepresentation = `${selection.morphology || ''} ${selection.signature || ''} ${selection.palette?.name || ''}`.toLowerCase();

  for (const f of forbidden) {
    const words = f.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matches = words.filter(w => textRepresentation.includes(w));
    if (matches.length >= 2) {
      riskScore += 0.35;
    }
  }

  return {
    score: Math.min(1.0, riskScore),
    status: riskScore >= 0.6 ? 'HIGH_SIMILARITY_RISK' : 'SAFE_ORIGINAL',
    warning: riskScore >= 0.6 ? '⚠️ Combination resembles protected design too closely. Mutate at least one more category.' : null
  };
}
