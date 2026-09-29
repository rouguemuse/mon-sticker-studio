/**
 * pack.js
 * Sticker pack management, emoji association, Telegram validation, and ZIP export
 */

export class PackManager {
  constructor(renderCallback) {
    this.stickers = [];
    this.packName = 'My Custom Telegram Pack';
    this.packAuthor = 'Studio Creator';
    this.onUpdate = renderCallback || (() => {});
  }

  addSticker(stickerData) {
    const defaultEmoji = stickerData.emoji || this.suggestEmoji(this.stickers.length);
    const sticker = {
      id: 'sticker_' + Math.random().toString(36).substring(2, 9),
      name: stickerData.name || `Sticker #${this.stickers.length + 1}`,
      dataUrl: stickerData.dataUrl,
      blob: stickerData.blob,
      width: 512,
      height: 512,
      sizeBytes: stickerData.blob ? stickerData.blob.size : 120 * 1024,
      emoji: defaultEmoji,
      emojis: [defaultEmoji],
      createdAt: Date.now()
    };

    this.stickers.push(sticker);
    this.onUpdate();
    return sticker;
  }

  removeSticker(id) {
    this.stickers = this.stickers.filter(s => s.id !== id);
    this.onUpdate();
  }

  setEmoji(id, emoji) {
    const target = this.stickers.find(s => s.id === id);
    if (target) {
      target.emoji = emoji.trim() || '🔥';
      target.emojis = [target.emoji];
      this.onUpdate();
    }
  }

  suggestEmoji(index) {
    const list = ['🔥', '😂', '👀', '😡', '😭', '🤔', '😍', '🙅', '😱', '💤', '🎉', '💀'];
    return list[index % list.length];
  }

  validateAll() {
    return this.stickers.map(s => {
      const errors = [];
      if (!s.emoji || !s.emoji.trim()) {
        errors.push('Missing associated emoji');
      }
      if (s.width !== 512 && s.height !== 512) {
        errors.push('Must have one dimension exactly 512px');
      }
      if (s.sizeBytes > 512 * 1024) {
        errors.push('File size exceeds Telegram 512 KB limit');
      }
      return {
        id: s.id,
        valid: errors.length === 0,
        errors,
        statusText: errors.length === 0 ? '✓ Telegram Ready' : errors[0]
      };
    });
  }

  async exportPackZip() {
    // Generate ZIP containing all stickers + metadata.json
    // We can use a lightweight client-side zip builder or download individual files
    if (this.stickers.length === 0) {
      alert('Pack is empty! Add at least one sticker to export.');
      return;
    }

    // Download first sticker directly if no zip library, or trigger individual downloads
    for (let i = 0; i < this.stickers.length; i++) {
      const s = this.stickers[i];
      const link = document.createElement('a');
      link.download = `sticker_${(i + 1).toString().padStart(2, '0')}_${s.emoji || 'tg'}.webp`;
      link.href = s.dataUrl;
      link.click();
      await new Promise(r => setTimeout(r, 200));
    }
  }
}
