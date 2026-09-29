/**
 * Abstract Image Provider interface
 */
export class ImageProvider {
  /**
   * Remove background from human photo, returning isolated subject with alpha mask
   * @param {string|Buffer} imageInput - Base64 data URL or Buffer
   * @param {object} options - Refinement options
   * @returns {Promise<{ dataUrl: string, maskDataUrl?: string }>}
   */
  async removeBackground(imageInput, options = {}) {
    throw new Error('removeBackground() not implemented in provider');
  }

  /**
   * Generate an original creature asset
   * @param {object} params - Archetype and trait params
   * @returns {Promise<{ dataUrl: string, name: string, traits: object }>}
   */
  async generateCreature(params = {}) {
    throw new Error('generateCreature() not implemented in provider');
  }

  /**
   * Stylize a human photo (Photo -> Illustrated)
   * @param {string} imageInput
   * @param {number} strength - 0.0 to 1.0
   * @returns {Promise<{ dataUrl: string }>}
   */
  async stylizeHuman(imageInput, strength = 0.5) {
    throw new Error('stylizeHuman() not implemented in provider');
  }

  /**
   * Generate an emotional variation of a sticker subject
   * @param {string} baseStickerDataUrl
   * @param {string} emotion - e.g. 'side_eye', 'laughing', 'rage'
   * @returns {Promise<{ dataUrl: string }>}
   */
  async generateVariation(baseStickerDataUrl, emotion) {
    throw new Error('generateVariation() not implemented in provider');
  }
}
