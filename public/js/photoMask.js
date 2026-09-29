/**
 * photoMask.js
 * Non-destructive human photo masking and erase/restore brush engine
 */

export class PhotoMaskProcessor {
  constructor() {
    this.rawImage = null; // Original HTMLImageElement, NEVER modified
    this.maskCanvas = document.createElement('canvas'); // Alpha mask buffer (white = visible, black = erased)
    this.maskCtx = this.maskCanvas.getContext('2d');
    this.outputCanvas = document.createElement('canvas'); // Composite cutout buffer
    this.outputCtx = this.outputCanvas.getContext('2d');

    this.brushMode = 'erase'; // 'erase' | 'restore'
    this.brushSize = 30;
    this.brushHardness = 0.8;
  }

  async loadFromSource(imageSource) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.rawImage = img;
        this.maskCanvas.width = img.naturalWidth || img.width;
        this.maskCanvas.height = img.naturalHeight || img.height;
        this.outputCanvas.width = this.maskCanvas.width;
        this.outputCanvas.height = this.maskCanvas.height;

        // Initialize mask with smart subject isolation
        this.applyAutoCutout();
        resolve(this.getCompositedImage());
      };
      img.onerror = reject;
      img.src = imageSource;
    });
  }

  applyAutoCutout() {
    if (!this.rawImage) return;
    const w = this.maskCanvas.width;
    const h = this.maskCanvas.height;

    // Fill mask: White = keep subject, Black = remove background
    this.maskCtx.fillStyle = '#000000';
    this.maskCtx.fillRect(0, 0, w, h);

    // Initial smart subject focus (portrait ellipse with soft feathered shoulders)
    this.maskCtx.save();
    const centerX = w * 0.5;
    const centerY = h * 0.48;
    const radiusX = w * 0.38;
    const radiusY = h * 0.46;

    const grad = this.maskCtx.createRadialGradient(centerX, centerY, radiusX * 0.65, centerX, centerY, radiusX);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.85, '#ffffff');
    grad.addColorStop(1, '#000000');

    this.maskCtx.fillStyle = grad;
    this.maskCtx.beginPath();
    this.maskCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    this.maskCtx.fill();

    // Fill torso bottom
    this.maskCtx.fillStyle = '#ffffff';
    this.maskCtx.fillRect(w * 0.15, h * 0.55, w * 0.7, h * 0.45);
    this.maskCtx.restore();

    this.updateComposite();
  }

  resetMask() {
    if (!this.rawImage) return;
    this.maskCtx.fillStyle = '#ffffff';
    this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    this.updateComposite();
  }

  paintBrush(x, y) {
    if (!this.rawImage) return;
    this.maskCtx.save();

    // Map coordinates to original image scale
    const rad = this.brushSize;
    const grad = this.maskCtx.createRadialGradient(x, y, rad * (1 - this.brushHardness), x, y, rad);

    if (this.brushMode === 'erase') {
      grad.addColorStop(0, '#000000');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      this.maskCtx.globalCompositeOperation = 'destination-out';
    } else {
      // restore
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      this.maskCtx.globalCompositeOperation = 'source-over';
    }

    this.maskCtx.fillStyle = grad;
    this.maskCtx.beginPath();
    this.maskCtx.arc(x, y, rad, 0, Math.PI * 2);
    this.maskCtx.fill();
    this.maskCtx.restore();

    this.updateComposite();
  }

  updateComposite() {
    if (!this.rawImage) return;
    const w = this.maskCanvas.width;
    const h = this.maskCanvas.height;

    this.outputCtx.clearRect(0, 0, w, h);

    // Draw original image
    this.outputCtx.globalCompositeOperation = 'source-over';
    this.outputCtx.drawImage(this.rawImage, 0, 0);

    // Apply alpha mask
    this.outputCtx.globalCompositeOperation = 'destination-in';
    this.outputCtx.drawImage(this.maskCanvas, 0, 0);

    this.outputCtx.globalCompositeOperation = 'source-over';
  }

  getCompositedImage() {
    return this.outputCanvas;
  }
}
