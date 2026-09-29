/**
 * canvas.js
 * High-performance 512x512 multi-layer sticker canvas editor
 * Supports interactive transform handles, sticker die-cut stroke, drop shadow, and undo/redo
 */

export class StickerCanvas {
  constructor(stickerCanvasId, interactionCanvasId) {
    this.canvas = document.getElementById(stickerCanvasId);
    this.ctx = this.canvas.getContext('2d');
    this.interactionCanvas = document.getElementById(interactionCanvasId);
    this.iCtx = this.interactionCanvas.getContext('2d');

    this.layers = [];
    this.activeLayerId = null;

    // History for Undo/Redo
    this.history = [];
    this.historyIndex = -1;

    // Global sticker effects
    this.strokeWidth = 8;
    this.strokeColor = '#ffffff';
    this.shadowBlur = 10;
    this.shadowOpacity = 0.35;

    // Interactive transform state
    this.dragMode = null; // 'move' | 'scale' | 'rotate'
    this.dragStart = { x: 0, y: 0 };
    this.activeHandle = null;
    this.layerStartProps = null;

    this.initInteractionEvents();
  }

  saveSnapshot() {
    // Truncate future history
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Deep clone layers metadata (images stay by reference)
    const snapshot = this.layers.map(l => ({ ...l }));
    this.history.push(snapshot);
    if (this.history.length > 30) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreSnapshot(this.history[this.historyIndex]);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreSnapshot(this.history[this.historyIndex]);
    }
  }

  restoreSnapshot(snapshot) {
    this.layers = snapshot.map(l => ({ ...l }));
    this.render();
    this.renderHandles();
  }

  addLayer(layer) {
    const defaultLayer = {
      id: 'layer_' + Math.random().toString(36).substring(2, 9),
      name: 'Layer',
      type: 'image', // 'human' | 'creature' | 'stats' | 'bubble' | 'text'
      image: null,
      x: 256,
      y: 256,
      width: 200,
      height: 200,
      scale: 1.0,
      rotation: 0, // degrees
      flipH: false,
      opacity: 1.0,
      visible: true,
      locked: false,
      stylize: 0
    };

    const newLayer = { ...defaultLayer, ...layer };
    this.layers.push(newLayer);
    this.activeLayerId = newLayer.id;
    this.saveSnapshot();
    this.render();
    this.renderHandles();
    return newLayer;
  }

  getActiveLayer() {
    return this.layers.find(l => l.id === this.activeLayerId) || null;
  }

  setActiveLayer(id) {
    this.activeLayerId = id;
    this.renderHandles();
  }

  removeLayer(id) {
    this.layers = this.layers.filter(l => l.id !== id);
    if (this.activeLayerId === id) {
      this.activeLayerId = this.layers.length > 0 ? this.layers[this.layers.length - 1].id : null;
    }
    this.saveSnapshot();
    this.render();
    this.renderHandles();
  }

  duplicateLayer(id) {
    const target = this.layers.find(l => l.id === id);
    if (!target) return;
    const dup = {
      ...target,
      id: 'layer_' + Math.random().toString(36).substring(2, 9),
      name: target.name + ' (Copy)',
      x: target.x + 20,
      y: target.y + 20
    };
    this.layers.push(dup);
    this.activeLayerId = dup.id;
    this.saveSnapshot();
    this.render();
    this.renderHandles();
    return dup;
  }

  moveLayerOrder(id, direction) {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= this.layers.length) return;
    const temp = this.layers[idx];
    this.layers[idx] = this.layers[targetIdx];
    this.layers[targetIdx] = temp;
    this.saveSnapshot();
    this.render();
    this.renderHandles();
  }

  render() {
    this.ctx.clearRect(0, 0, 512, 512);

    // 1. Render all visible layers onto an offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = 512;
    offscreen.height = 512;
    const offCtx = offscreen.getContext('2d');

    for (const layer of this.layers) {
      if (!layer.visible || !layer.image) continue;

      offCtx.save();
      offCtx.translate(layer.x, layer.y);
      offCtx.rotate((layer.rotation * Math.PI) / 180);
      offCtx.scale(layer.flipH ? -layer.scale : layer.scale, layer.scale);
      offCtx.globalAlpha = layer.opacity;

      const drawW = layer.width;
      const drawH = layer.height;

      // Stylization filter if requested
      if (layer.stylize > 0) {
        offCtx.filter = `contrast(${100 + layer.stylize * 0.8}%) saturate(${100 + layer.stylize * 0.6}%)`;
      }

      offCtx.drawImage(layer.image, -drawW / 2, -drawH / 2, drawW, drawH);
      offCtx.restore();
    }

    // 2. Render Sticker Die-cut Outline & Drop Shadow onto main canvas
    if (this.shadowOpacity > 0 && this.shadowBlur > 0) {
      this.ctx.save();
      this.ctx.shadowColor = `rgba(0, 0, 0, ${this.shadowOpacity})`;
      this.ctx.shadowBlur = this.shadowBlur;
      this.ctx.shadowOffsetY = 6;
      this.ctx.drawImage(offscreen, 0, 0);
      this.ctx.restore();
    }

    if (this.strokeWidth > 0) {
      // High-quality white sticker stroke using radial dilation passes
      const strokeCanvas = document.createElement('canvas');
      strokeCanvas.width = 512;
      strokeCanvas.height = 512;
      const sCtx = strokeCanvas.getContext('2d');

      const d = this.strokeWidth;
      const steps = 16;
      for (let i = 0; i < steps; i++) {
        const angle = (i * 2 * Math.PI) / steps;
        const dx = Math.cos(angle) * d;
        const dy = Math.sin(angle) * d;
        sCtx.drawImage(offscreen, dx, dy);
      }

      // Tint the dilated silhouette with strokeColor
      sCtx.globalCompositeOperation = 'source-in';
      sCtx.fillStyle = this.strokeColor;
      sCtx.fillRect(0, 0, 512, 512);

      this.ctx.drawImage(strokeCanvas, 0, 0);
    }

    // 3. Draw final crisp composite over the stroke
    this.ctx.drawImage(offscreen, 0, 0);
  }

  renderHandles() {
    this.iCtx.clearRect(0, 0, 512, 512);
    const active = this.getActiveLayer();
    if (!active || active.locked || !active.visible) return;

    this.iCtx.save();
    this.iCtx.translate(active.x, active.y);
    this.iCtx.rotate((active.rotation * Math.PI) / 180);

    const w = active.width * active.scale;
    const h = active.height * active.scale;
    const hw = w / 2;
    const hh = h / 2;

    // Bounding Box
    this.iCtx.strokeStyle = '#2ea5ff';
    this.iCtx.lineWidth = 1.5;
    this.iCtx.setLineDash([4, 4]);
    this.iCtx.strokeRect(-hw, -hh, w, h);
    this.iCtx.setLineDash([]);

    // 4 Corner Scale Handles
    const handleSize = 8;
    this.iCtx.fillStyle = '#ffffff';
    this.iCtx.strokeStyle = '#2ea5ff';
    this.iCtx.lineWidth = 2;

    const corners = [
      { x: -hw, y: -hh, id: 'nw' },
      { x: hw, y: -hh, id: 'ne' },
      { x: -hw, y: hh, id: 'sw' },
      { x: hw, y: hh, id: 'se' }
    ];

    corners.forEach(c => {
      this.iCtx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      this.iCtx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    });

    // Rotation Handle (top lollipop)
    this.iCtx.beginPath();
    this.iCtx.moveTo(0, -hh);
    this.iCtx.lineTo(0, -hh - 22);
    this.iCtx.strokeStyle = '#2ea5ff';
    this.iCtx.stroke();

    this.iCtx.beginPath();
    this.iCtx.arc(0, -hh - 22, 6, 0, Math.PI * 2);
    this.iCtx.fillStyle = '#f5a623';
    this.iCtx.fill();
    this.iCtx.strokeStyle = '#ffffff';
    this.iCtx.stroke();

    this.iCtx.restore();
  }

  initInteractionEvents() {
    let isDown = false;

    const getPos = e => {
      const rect = this.interactionCanvas.getBoundingClientRect();
      const scaleX = 512 / rect.width;
      const scaleY = 512 / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    this.interactionCanvas.addEventListener('mousedown', e => {
      const pos = getPos(e);
      const active = this.getActiveLayer();

      if (active && !active.locked && active.visible) {
        // Check handle click
        const handle = this.hitTestHandles(active, pos);
        if (handle) {
          isDown = true;
          this.dragMode = handle === 'rot' ? 'rotate' : 'scale';
          this.activeHandle = handle;
          this.dragStart = pos;
          this.layerStartProps = { ...active };
          return;
        }

        // Check bounding box click to move
        if (this.hitTestLayer(active, pos)) {
          isDown = true;
          this.dragMode = 'move';
          this.dragStart = pos;
          this.layerStartProps = { ...active };
          return;
        }
      }

      // Check if clicked another layer
      for (let i = this.layers.length - 1; i >= 0; i--) {
        const l = this.layers[i];
        if (l.visible && !l.locked && this.hitTestLayer(l, pos)) {
          this.setActiveLayer(l.id);
          isDown = true;
          this.dragMode = 'move';
          this.dragStart = pos;
          this.layerStartProps = { ...l };
          return;
        }
      }
    });

    window.addEventListener('mousemove', e => {
      if (!isDown || !this.dragMode) return;
      const pos = getPos(e);
      const active = this.getActiveLayer();
      if (!active) return;

      const dx = pos.x - this.dragStart.x;
      const dy = pos.y - this.dragStart.y;

      if (this.dragMode === 'move') {
        active.x = this.layerStartProps.x + dx;
        active.y = this.layerStartProps.y + dy;
      } else if (this.dragMode === 'scale') {
        const dist = Math.hypot(pos.x - active.x, pos.y - active.y);
        const origDist = Math.hypot(this.dragStart.x - active.x, this.dragStart.y - active.y);
        if (origDist > 0) {
          active.scale = Math.max(0.1, Math.min(3.0, (this.layerStartProps.scale * dist) / origDist));
        }
      } else if (this.dragMode === 'rotate') {
        const angle = Math.atan2(pos.y - active.y, pos.x - active.x);
        active.rotation = Math.round((angle * 180) / Math.PI + 90);
      }

      this.render();
      this.renderHandles();
    });

    window.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        this.dragMode = null;
        this.saveSnapshot();
      }
    });
  }

  hitTestLayer(layer, pos) {
    const dx = pos.x - layer.x;
    const dy = pos.y - layer.y;
    const hw = (layer.width * layer.scale) / 2;
    const hh = (layer.height * layer.scale) / 2;
    return Math.abs(dx) <= hw && Math.abs(dy) <= hh;
  }

  hitTestHandles(layer, pos) {
    const hw = (layer.width * layer.scale) / 2;
    const hh = (layer.height * layer.scale) / 2;

    // Transform pos into layer local space
    const rad = (-layer.rotation * Math.PI) / 180;
    const dx = pos.x - layer.x;
    const dy = pos.y - layer.y;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);

    // Rotation handle
    if (Math.hypot(lx, ly - (-hh - 22)) <= 12) return 'rot';

    // Corner scale handles
    const tol = 12;
    if (Math.hypot(lx - (-hw), ly - (-hh)) <= tol) return 'nw';
    if (Math.hypot(lx - hw, ly - (-hh)) <= tol) return 'ne';
    if (Math.hypot(lx - (-hw), ly - hh) <= tol) return 'sw';
    if (Math.hypot(lx - hw, ly - hh) <= tol) return 'se';

    return null;
  }

  async exportWebpBlob(quality = 0.9) {
    return new Promise(resolve => {
      this.canvas.toBlob(blob => resolve(blob), 'image/webp', quality);
    });
  }

  async exportPngBlob() {
    return new Promise(resolve => {
      this.canvas.toBlob(blob => resolve(blob), 'image/png');
    });
  }
}
