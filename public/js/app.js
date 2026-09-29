/**
 * app.js
 * Main studio controller orchestrating the canvas, layers, photo masking,
 * creature generator, stats & roast engines, and Telegram export.
 */

import { StickerCanvas } from './canvas.js';
import { PhotoMaskProcessor } from './photoMask.js';
import { renderStatsCardToCanvas } from './statsEditor.js';
import { renderBubbleToCanvas } from './speechBubble.js';
import { applyDuoPreset } from './compositionPresets.js';
import { PackManager } from './pack.js';

class StudioApp {
  constructor() {
    this.canvas = new StickerCanvas('stickerCanvas', 'interactionCanvas');
    this.maskProcessor = new PhotoMaskProcessor();
    this.pack = new PackManager(() => this.renderPackTray());

    // Current State
    this.humanLayerId = null;
    this.creatureLayerId = null;
    this.statsLayerId = null;
    this.bubbleLayerId = null;

    this.currentStats = {
      name: 'Rachel',
      className: 'Parking Lot Necromancer',
      stats: [
        { name: 'CHAOS', value: '94' },
        { name: 'PATIENCE', value: '11' },
        { name: 'BAD DECISIONS', value: 'CRITICAL' },
        { name: 'CAFFEINE', value: '99/100' }
      ],
      specialAbility: 'Turns a five-minute errand into an unexpected trilogy',
      passiveEffect: 'Other people somehow become responsible',
      roast: 'Frequently observed saying "I\'m literally leaving right now" while still looking for her shoes twenty minutes later.'
    };

    this.initUI();
    this.loadArchetypes();
    this.renderStatsEditorInputs();
    this.bindEvents();
    this.renderLayerList();
  }

  initUI() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tab = document.getElementById(btn.dataset.tab);
        if (tab) tab.classList.add('active');
      });
    });

    // Background toggles
    const bg = document.getElementById('canvasBgChecker');
    document.getElementById('btnBgChecker').addEventListener('click', () => {
      bg.className = 'canvas-bg-checker';
    });
    document.getElementById('btnBgTgDark').addEventListener('click', () => {
      bg.className = 'canvas-bg-checker theme-tg-dark';
    });
    document.getElementById('btnBgTgLight').addEventListener('click', () => {
      bg.className = 'canvas-bg-checker theme-tg-light';
    });
  }

  async loadArchetypes() {
    try {
      const res = await fetch('/api/archetypes');
      const archetypes = await res.json();
      const select = document.getElementById('creatureArchetypeSelect');
      select.innerHTML = '';
      archetypes.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = `#${a.slot} ${a.name}`;
        select.appendChild(opt);
      });
    } catch (e) {
      console.error('Failed to load archetypes:', e);
    }
  }

  bindEvents() {
    // Undo / Redo
    document.getElementById('btnUndo').addEventListener('click', () => {
      this.canvas.undo();
      this.renderLayerList();
      this.updateInspectorFromActive();
    });
    document.getElementById('btnRedo').addEventListener('click', () => {
      this.canvas.redo();
      this.renderLayerList();
      this.updateInspectorFromActive();
    });
    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        this.canvas.undo();
        this.renderLayerList();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        this.canvas.redo();
        this.renderLayerList();
      }
    });

    // Clear Canvas
    document.getElementById('btnClearCanvas').addEventListener('click', () => {
      if (confirm('Clear all layers on canvas?')) {
        this.canvas.layers = [];
        this.canvas.activeLayerId = null;
        this.humanLayerId = null;
        this.creatureLayerId = null;
        this.canvas.render();
        this.canvas.renderHandles();
        this.renderLayerList();
      }
    });

    // Layer management actions
    document.getElementById('btnMoveLayerUp').addEventListener('click', () => {
      if (this.canvas.activeLayerId) {
        this.canvas.moveLayerOrder(this.canvas.activeLayerId, 1);
        this.renderLayerList();
      }
    });
    document.getElementById('btnMoveLayerDown').addEventListener('click', () => {
      if (this.canvas.activeLayerId) {
        this.canvas.moveLayerOrder(this.canvas.activeLayerId, -1);
        this.renderLayerList();
      }
    });
    document.getElementById('btnDuplicateLayer').addEventListener('click', () => {
      if (this.canvas.activeLayerId) {
        this.canvas.duplicateLayer(this.canvas.activeLayerId);
        this.renderLayerList();
      }
    });

    // Inspector sliders
    document.getElementById('propScale').addEventListener('input', e => {
      const active = this.canvas.getActiveLayer();
      if (active) {
        active.scale = parseInt(e.target.value, 10) / 100;
        this.canvas.render();
        this.canvas.renderHandles();
      }
    });
    document.getElementById('propRotate').addEventListener('input', e => {
      const active = this.canvas.getActiveLayer();
      if (active) {
        active.rotation = parseInt(e.target.value, 10);
        this.canvas.render();
        this.canvas.renderHandles();
      }
    });
    document.getElementById('propOpacity').addEventListener('input', e => {
      const active = this.canvas.getActiveLayer();
      if (active) {
        active.opacity = parseInt(e.target.value, 10) / 100;
        this.canvas.render();
      }
    });
    document.getElementById('btnFlipH').addEventListener('click', () => {
      const active = this.canvas.getActiveLayer();
      if (active) {
        active.flipH = !active.flipH;
        this.canvas.render();
        this.canvas.renderHandles();
      }
    });
    document.getElementById('propStrokeWidth').addEventListener('input', e => {
      this.canvas.strokeWidth = parseInt(e.target.value, 10);
      this.canvas.render();
    });
    document.getElementById('propStrokeColor').addEventListener('input', e => {
      this.canvas.strokeColor = e.target.value;
      this.canvas.render();
    });
    document.getElementById('propShadowBlur').addEventListener('input', e => {
      this.canvas.shadowBlur = parseInt(e.target.value, 10);
      this.canvas.render();
    });
    document.getElementById('propShadowOpacity').addEventListener('input', e => {
      this.canvas.shadowOpacity = parseInt(e.target.value, 10) / 100;
      this.canvas.render();
    });
    document.getElementById('propStylizeStrength').addEventListener('input', e => {
      const active = this.canvas.getActiveLayer();
      if (active && active.type === 'human') {
        active.stylize = parseInt(e.target.value, 10);
        this.canvas.render();
      }
    });

    // Photo Upload & Samples
    const dropZone = document.getElementById('photoDropZone');
    const fileInput = document.getElementById('photoFileInput');

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) {
        this.handlePhotoFile(e.target.files[0]);
      }
    });
    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--accent)';
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = 'var(--border-color)';
    });
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--border-color)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handlePhotoFile(e.dataTransfer.files[0]);
      }
    });

    document.getElementById('btnSamplePortrait1').addEventListener('click', () => {
      this.loadHumanPhoto('assets/sample_portrait_1.svg');
    });
    document.getElementById('btnSamplePortrait2').addEventListener('click', () => {
      this.loadHumanPhoto('assets/sample_portrait_2.svg');
    });

    // Mask editing
    document.getElementById('btnBrushErase').addEventListener('click', e => {
      this.maskProcessor.brushMode = 'erase';
      e.target.style.borderColor = 'var(--accent)';
      document.getElementById('btnBrushRestore').style.borderColor = 'transparent';
    });
    document.getElementById('btnBrushRestore').addEventListener('click', e => {
      this.maskProcessor.brushMode = 'restore';
      e.target.style.borderColor = 'var(--accent)';
      document.getElementById('btnBrushErase').style.borderColor = 'transparent';
    });
    document.getElementById('brushSize').addEventListener('input', e => {
      this.maskProcessor.brushSize = parseInt(e.target.value, 10);
      document.getElementById('brushSizeVal').textContent = `${e.target.value}px`;
    });
    document.getElementById('brushHardness').addEventListener('input', e => {
      this.maskProcessor.brushHardness = parseInt(e.target.value, 10) / 100;
      document.getElementById('brushHardnessVal').textContent = `${e.target.value}%`;
    });
    document.getElementById('btnAutoCutout').addEventListener('click', () => {
      this.maskProcessor.applyAutoCutout();
      this.updateHumanLayerComposite();
    });
    document.getElementById('btnResetMask').addEventListener('click', () => {
      this.maskProcessor.resetMask();
      this.updateHumanLayerComposite();
    });

    // Mask painting on canvas when Mask tab is active
    let isPaintingMask = false;
    const iCanvas = this.canvas.interactionCanvas;
    iCanvas.addEventListener('mousedown', e => {
      const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
      if (activeTab === 'tabMask' && this.humanLayerId) {
        isPaintingMask = true;
        this.paintMaskAtEvent(e);
      }
    });
    window.addEventListener('mousemove', e => {
      if (isPaintingMask) {
        this.paintMaskAtEvent(e);
      }
    });
    window.addEventListener('mouseup', () => {
      if (isPaintingMask) {
        isPaintingMask = false;
        this.canvas.saveSnapshot();
      }
    });

    // Creature Generation
    document.getElementById('btnGenerateCreature').addEventListener('click', () => this.generateCreature());
    document.getElementById('btnBreakSimilarity').addEventListener('click', () => this.generateCreature({ breakSimilarity: true }));

    // Duo Presets
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const preset = chip.dataset.preset;
        const human = this.canvas.layers.find(l => l.id === this.humanLayerId);
        const creature = this.canvas.layers.find(l => l.id === this.creatureLayerId);
        if (!human || !creature) {
          alert('Add both a Human Photo and a Creature first to use Duo Presets!');
          return;
        }
        applyDuoPreset(preset, human, creature);
        this.canvas.saveSnapshot();
        this.canvas.render();
        this.canvas.renderHandles();
      });
    });

    // Stats & Roast
    document.getElementById('btnRerollStats').addEventListener('click', () => this.rerollStats());
    document.getElementById('btnGenerateRoast').addEventListener('click', () => this.generateRoast());
    document.getElementById('roastIntensity').addEventListener('input', e => {
      const labels = {
        '1': 'Tier 1 — Friendly',
        '2': 'Tier 2 — Teasing',
        '3': 'Tier 3 — Mean Best Friend',
        '4': 'Tier 4 — Unhinged',
        '5': 'Tier 5 — Group Chat Has No Mercy'
      };
      document.getElementById('roastIntensityLabel').textContent = labels[e.target.value];
    });

    document.getElementById('btnRoastMeaner').addEventListener('click', () => this.modifyRoast('make_meaner'));
    document.getElementById('btnRoastDrier').addEventListener('click', () => this.modifyRoast('make_drier'));
    document.getElementById('btnRoastAbsurd').addEventListener('click', () => this.modifyRoast('make_more_absurd'));
    document.getElementById('btnRoastShorten').addEventListener('click', () => this.modifyRoast('shorten'));

    document.getElementById('btnAddStatsCardToCanvas').addEventListener('click', () => this.addOrUpdateStatsCard());
    document.getElementById('btnAddBubbleToCanvas').addEventListener('click', () => this.addOrUpdateSpeechBubble());

    // Telegram Preview
    document.getElementById('btnTgPreview').addEventListener('click', () => this.showTelegramPreview());
    document.getElementById('btnCloseTgPreview').addEventListener('click', () => {
      document.getElementById('tgPreviewModal').classList.remove('open');
    });
    document.getElementById('btnToggleTgTheme').addEventListener('click', () => {
      document.getElementById('tgModalContainer').classList.toggle('light-mode');
    });

    // Pack management
    document.getElementById('btnAddToPack').addEventListener('click', () => this.addCurrentStickerToPack());
    document.getElementById('btnExportStickerWebp').addEventListener('click', () => this.exportCurrentStickerWebp());
    document.getElementById('btnExportPackZip').addEventListener('click', () => this.pack.exportPackZip());

    // Reaction quick variations
    document.querySelectorAll('.reaction-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const reaction = btn.dataset.reaction;
        this.applyReactionVariation(reaction);
      });
    });

    document.getElementById('btnCreatePackFromChar').addEventListener('click', () => this.createFullReactionPack());
  }

  paintMaskAtEvent(e) {
    const human = this.canvas.layers.find(l => l.id === this.humanLayerId);
    if (!human || !this.maskProcessor.rawImage) return;

    const rect = this.canvas.interactionCanvas.getBoundingClientRect();
    const scaleX = 512 / rect.width;
    const scaleY = 512 / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Convert from canvas coords into mask coords
    const localX = (canvasX - (human.x - (human.width * human.scale) / 2)) / human.scale;
    const localY = (canvasY - (human.y - (human.height * human.scale) / 2)) / human.scale;

    const maskW = this.maskProcessor.maskCanvas.width;
    const maskH = this.maskProcessor.maskCanvas.height;

    const normX = (localX / human.width) * maskW;
    const normY = (localY / human.height) * maskH;

    this.maskProcessor.paintBrush(normX, normY);
    this.updateHumanLayerComposite();
  }

  updateHumanLayerComposite() {
    const human = this.canvas.layers.find(l => l.id === this.humanLayerId);
    if (human) {
      human.image = this.maskProcessor.getCompositedImage();
      this.canvas.render();
      this.canvas.renderHandles();
    }
  }

  async handlePhotoFile(file) {
    const reader = new FileReader();
    reader.onload = async e => {
      await this.loadHumanPhoto(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  async loadHumanPhoto(src) {
    await this.maskProcessor.loadFromSource(src);
    const composited = this.maskProcessor.getCompositedImage();

    // Check if human layer exists, or add it
    let human = this.canvas.layers.find(l => l.id === this.humanLayerId);
    if (!human) {
      human = this.canvas.addLayer({
        name: 'Human Photo',
        type: 'human',
        image: composited,
        x: 256,
        y: 300,
        width: 320,
        height: 380,
        scale: 0.85
      });
      this.humanLayerId = human.id;
    } else {
      human.image = composited;
      this.canvas.render();
    }

    this.renderLayerList();
    this.updateInspectorFromActive();
  }

  async generateCreature(options = {}) {
    const archetypeId = document.getElementById('creatureArchetypeSelect').value || 1;
    try {
      const res = await fetch('/api/creature/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archetypeId, ...options })
      });
      const data = await res.json();

      const img = new Image();
      img.onload = () => {
        let creature = this.canvas.layers.find(l => l.id === this.creatureLayerId);
        if (!creature) {
          creature = this.canvas.addLayer({
            name: `Creature (${data.name})`,
            type: 'creature',
            image: img,
            x: 350,
            y: 200,
            width: 280,
            height: 280,
            scale: 0.55
          });
          this.creatureLayerId = creature.id;
        } else {
          creature.image = img;
          creature.name = `Creature (${data.name})`;
          this.canvas.render();
        }
        this.renderLayerList();
        this.updateInspectorFromActive();
      };
      img.src = data.dataUrl;
    } catch (e) {
      console.error('Creature generation failed:', e);
    }
  }

  renderStatsEditorInputs() {
    const container = document.getElementById('statsListContainer');
    container.innerHTML = '';
    this.currentStats.stats.forEach((st, idx) => {
      const row = document.createElement('div');
      row.className = 'input-row';
      row.innerHTML = `
        <input type="text" value="${st.name}" style="flex:1;" class="stat-name-input" data-idx="${idx}">
        <input type="text" value="${st.value}" style="flex:1;" class="stat-val-input" data-idx="${idx}">
        <button style="padding:4px 8px; color:var(--danger);" class="btn-del-stat" data-idx="${idx}">✕</button>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('.stat-name-input').forEach(inp => {
      inp.addEventListener('input', e => {
        this.currentStats.stats[e.target.dataset.idx].name = e.target.value.toUpperCase();
      });
    });
    container.querySelectorAll('.stat-val-input').forEach(inp => {
      inp.addEventListener('input', e => {
        this.currentStats.stats[e.target.dataset.idx].value = e.target.value;
      });
    });
    container.querySelectorAll('.btn-del-stat').forEach(btn => {
      btn.addEventListener('click', e => {
        this.currentStats.stats.splice(e.target.dataset.idx, 1);
        this.renderStatsEditorInputs();
      });
    });
  }

  async rerollStats() {
    try {
      const res = await fetch('/api/stats/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 4 })
      });
      const data = await res.json();
      this.currentStats.stats = data.stats;
      this.currentStats.specialAbility = data.specialAbility;
      this.currentStats.passiveEffect = data.passiveEffect;

      document.getElementById('statInputAbility').value = data.specialAbility;
      document.getElementById('statInputPassive').value = data.passiveEffect;
      this.renderStatsEditorInputs();
    } catch (e) {
      console.error('Stats reroll failed:', e);
    }
  }

  async generateRoast() {
    const name = document.getElementById('statInputName').value;
    const className = document.getElementById('statInputClass').value;
    const intensity = document.getElementById('roastIntensity').value;
    const context = document.getElementById('roastContext').value;

    try {
      const res = await fetch('/api/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, className, intensity, context })
      });
      const data = await res.json();
      this.currentStats.roast = data.text;
      document.getElementById('roastOutputText').value = data.text;
    } catch (e) {
      console.error('Roast generation failed:', e);
    }
  }

  async modifyRoast(action) {
    const text = document.getElementById('roastOutputText').value;
    const name = document.getElementById('statInputName').value;
    try {
      const res = await fetch('/api/roast/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, action, name })
      });
      const data = await res.json();
      this.currentStats.roast = data.text;
      document.getElementById('roastOutputText').value = data.text;
    } catch (e) {
      console.error('Roast modify failed:', e);
    }
  }

  addOrUpdateStatsCard() {
    this.currentStats.name = document.getElementById('statInputName').value;
    this.currentStats.className = document.getElementById('statInputClass').value;
    this.currentStats.roast = document.getElementById('roastOutputText').value;
    this.currentStats.specialAbility = document.getElementById('statInputAbility').value;

    const cardCanvas = renderStatsCardToCanvas(this.currentStats);

    let statsLayer = this.canvas.layers.find(l => l.id === this.statsLayerId);
    if (!statsLayer) {
      statsLayer = this.canvas.addLayer({
        name: 'Stats Card',
        type: 'stats',
        image: cardCanvas,
        x: 256,
        y: 400,
        width: 440,
        height: 240,
        scale: 0.8
      });
      this.statsLayerId = statsLayer.id;
    } else {
      statsLayer.image = cardCanvas;
      this.canvas.render();
    }

    this.renderLayerList();
    this.updateInspectorFromActive();
  }

  addOrUpdateSpeechBubble() {
    const text = document.getElementById('bubbleTextInput').value;
    const type = document.getElementById('bubbleTypeSelect').value;
    const fontSize = parseInt(document.getElementById('bubbleTextSize').value, 10);
    const textColor = document.getElementById('bubbleTextColor').value;

    const bubbleCanvas = renderBubbleToCanvas({
      text,
      type,
      fontSize,
      textColor
    });

    let bubbleLayer = this.canvas.layers.find(l => l.id === this.bubbleLayerId);
    if (!bubbleLayer) {
      bubbleLayer = this.canvas.addLayer({
        name: 'Speech Bubble',
        type: 'bubble',
        image: bubbleCanvas,
        x: 256,
        y: 110,
        width: 380,
        height: 160,
        scale: 0.8
      });
      this.bubbleLayerId = bubbleLayer.id;
    } else {
      bubbleLayer.image = bubbleCanvas;
      this.canvas.render();
    }

    this.renderLayerList();
    this.updateInspectorFromActive();
  }

  renderLayerList() {
    const list = document.getElementById('layerList');
    list.innerHTML = '';
    const active = this.canvas.getActiveLayer();

    for (let i = this.canvas.layers.length - 1; i >= 0; i--) {
      const l = this.canvas.layers[i];
      const item = document.createElement('div');
      item.className = `layer-item ${active && active.id === l.id ? 'active' : ''}`;
      item.innerHTML = `
        <span class="layer-icon">${l.type === 'human' ? '👤' : l.type === 'creature' ? '🦖' : l.type === 'stats' ? '🎴' : '💬'}</span>
        <span class="layer-name">${l.name}</span>
        <div class="layer-actions">
          <button class="layer-btn toggle-vis" title="Toggle Visibility">${l.visible ? '👁' : '🚫'}</button>
          <button class="layer-btn toggle-lock" title="Lock">${l.locked ? '🔒' : '🔓'}</button>
          <button class="layer-btn delete-layer" title="Delete" style="color:var(--danger);">✕</button>
        </div>
      `;

      item.addEventListener('click', e => {
        if (!e.target.classList.contains('layer-btn')) {
          this.canvas.setActiveLayer(l.id);
          this.renderLayerList();
          this.updateInspectorFromActive();
        }
      });

      item.querySelector('.toggle-vis').addEventListener('click', () => {
        l.visible = !l.visible;
        this.canvas.render();
        this.canvas.renderHandles();
        this.renderLayerList();
      });

      item.querySelector('.toggle-lock').addEventListener('click', () => {
        l.locked = !l.locked;
        this.canvas.renderHandles();
        this.renderLayerList();
      });

      item.querySelector('.delete-layer').addEventListener('click', () => {
        this.canvas.removeLayer(l.id);
        if (this.humanLayerId === l.id) this.humanLayerId = null;
        if (this.creatureLayerId === l.id) this.creatureLayerId = null;
        this.renderLayerList();
        this.updateInspectorFromActive();
      });

      list.appendChild(item);
    }
  }

  updateInspectorFromActive() {
    const active = this.canvas.getActiveLayer();
    const titleEl = document.getElementById('selectedLayerTitle');
    if (!active) {
      titleEl.textContent = 'None';
      return;
    }
    titleEl.textContent = active.name;
    document.getElementById('propScale').value = Math.round(active.scale * 100);
    document.getElementById('propRotate').value = active.rotation;
    document.getElementById('propOpacity').value = Math.round(active.opacity * 100);
    document.getElementById('propStylizeStrength').value = active.stylize || 0;
  }

  async showTelegramPreview() {
    const blob = await this.canvas.exportWebpBlob();
    const url = URL.createObjectURL(blob);
    document.getElementById('tgStickerPreviewImg').src = url;
    document.getElementById('tgPreviewModal').classList.add('open');
  }

  async addCurrentStickerToPack(options = {}) {
    const blob = await this.canvas.exportWebpBlob();
    const dataUrl = this.canvas.canvas.toDataURL('image/webp');
    const emoji = options.emoji || '🔥';

    const sticker = this.pack.addSticker({
      name: options.name || `Sticker #${this.pack.stickers.length + 1}`,
      dataUrl,
      blob,
      emoji
    });

    this.renderPackTray();
    return sticker;
  }

  renderPackTray() {
    const row = document.getElementById('packStickersRow');
    row.innerHTML = '';
    const validations = this.pack.validateAll();

    this.pack.stickers.forEach((s, idx) => {
      const val = validations[idx] || { valid: true, statusText: '✓ Telegram Ready' };
      const tile = document.createElement('div');
      tile.className = 'pack-tile';
      tile.innerHTML = `
        <span class="tile-status" style="background:${val.valid ? 'var(--success)' : 'var(--danger)'};">${val.statusText}</span>
        <img src="${s.dataUrl}" alt="Sticker ${idx}">
        <span class="tile-emoji" title="Click to edit emoji">${s.emoji}</span>
        <div class="tile-delete" title="Delete">✕</div>
      `;

      tile.querySelector('.tile-emoji').addEventListener('click', e => {
        e.stopPropagation();
        const newEmoji = prompt('Enter Telegram emoji trigger for this sticker:', s.emoji);
        if (newEmoji) {
          this.pack.setEmoji(s.id, newEmoji);
        }
      });

      tile.querySelector('.tile-delete').addEventListener('click', e => {
        e.stopPropagation();
        this.pack.removeSticker(s.id);
      });

      row.appendChild(tile);
    });
  }

  async exportCurrentStickerWebp() {
    const blob = await this.canvas.exportWebpBlob();
    const link = document.createElement('a');
    link.download = `telegram_sticker_${Date.now()}.webp`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }

  async applyReactionVariation(reaction) {
    // If speech bubble exists, update it to reaction text
    const reactionTexts = {
      laughing: 'LMAOOOO 💀',
      rage: 'ABSOLUTELY NOT.',
      crying: 'THIS IS FINE 😭',
      side_eye: 'I am looking respectfully. 👀',
      heart_eyes: 'PERFECTION 😍',
      confused: 'EXCUSE ME WHAT?? 🤔'
    };

    const emojis = {
      laughing: '😂',
      rage: '😡',
      crying: '😭',
      side_eye: '👀',
      heart_eyes: '😍',
      confused: '🤔'
    };

    if (reactionTexts[reaction]) {
      document.getElementById('bubbleTextInput').value = reactionTexts[reaction];
      this.addOrUpdateSpeechBubble();
    }

    // Re-generate creature with this emotion
    await this.generateCreature({ emotion: reaction });

    // Add to pack with the associated emoji
    await this.addCurrentStickerToPack({
      name: `${reaction.replace('_', ' ').toUpperCase()} Reaction`,
      emoji: emojis[reaction] || '🔥'
    });
  }

  async createFullReactionPack() {
    const reactions = ['laughing', 'side_eye', 'rage', 'crying'];
    for (const r of reactions) {
      await this.applyReactionVariation(r);
      await new Promise(res => setTimeout(res, 250));
    }
    alert(`Generated 4 reaction variations and added to pack tray! All with required emoji triggers.`);
  }
}

// Start application
window.addEventListener('DOMContentLoaded', () => {
  window.studioApp = new StudioApp();
});
