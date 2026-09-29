export function validateSticker(sticker, options = {}) {
  const errors = [];
  const warnings = [];

  const width = sticker.width || 0;
  const height = sticker.height || 0;
  const sizeBytes = sticker.sizeBytes || 0;
  const format = (sticker.format || 'webp').toLowerCase();
  const emojis = sticker.emojis || (sticker.emoji ? [sticker.emoji] : []);

  // 1. Emoji association check (Required for Telegram sticker pack)
  if (!emojis || emojis.length === 0 || !emojis[0]?.trim()) {
    errors.push('Every sticker in a Telegram pack must have at least one associated emoji (e.g. 🔥, 😂, 👀).');
  }

  // 2. Dimension check: Exactly one side must be 512px, the other must be <= 512px
  const isOneSide512 = (width === 512 && height <= 512) || (height === 512 && width <= 512);
  if (!isOneSide512) {
    errors.push(`Invalid dimensions: ${width}x${height}px. Telegram requires one side to be exactly 512px and the other <= 512px.`);
  }

  // 3. Format & Size limits
  if (format === 'webm') {
    // Video sticker
    const maxVideoBytes = 256 * 1024; // 256 KB
    if (sizeBytes > maxVideoBytes) {
      const kb = Math.round(sizeBytes / 1024);
      errors.push(`Video sticker size ${kb} KB exceeds the Telegram 256 KB limit.`);
    }
  } else {
    // Static sticker (PNG or WEBP)
    const maxStaticBytes = 512 * 1024; // 512 KB
    if (sizeBytes > maxStaticBytes) {
      const kb = Math.round(sizeBytes / 1024);
      errors.push(`Static sticker size ${kb} KB exceeds the Telegram 512 KB limit.`);
    }
    if (format !== 'png' && format !== 'webp') {
      errors.push(`Invalid format "${format}". Telegram static stickers must be PNG or WEBP.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    statusText: errors.length === 0 ? '✓ Telegram Ready' : errors[0],
    dimensions: `${width}×${height}`,
    sizeKB: Math.round(sizeBytes / 1024),
    emojis
  };
}

export function validatePack(pack) {
  const stickers = pack.stickers || [];
  const errors = [];

  if (stickers.length === 0) {
    errors.push('Pack contains no stickers. Add at least one sticker.');
  }

  let missingEmojisCount = 0;
  let dimensionIssueCount = 0;

  stickers.forEach((s, idx) => {
    const res = validateSticker(s);
    if (!res.emojis || res.emojis.length === 0) {
      missingEmojisCount++;
    }
    if (!res.valid) {
      dimensionIssueCount++;
    }
  });

  if (missingEmojisCount > 0) {
    errors.push(`${missingEmojisCount} sticker(s) in the pack are missing associated emojis.`);
  }

  return {
    valid: errors.length === 0 && stickers.length > 0,
    errors,
    totalStickers: stickers.length,
    missingEmojisCount
  };
}
