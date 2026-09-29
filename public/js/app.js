/**
 * app.js
 * Main studio controller orchestrating the canvas, layers, photo masking,
 * Character Source System (Upload, Generate, Saved Vault), Blend Styles,
 * Stats & Roast engines, and Telegram export.
 */

import { StickerCanvas } from './canvas.js';
import { PhotoMaskProcessor } from './photoMask.js';
import { CharacterManager } from './characterManager.js';
import { renderStatsCardToCanvas } from './statsEditor.js';
import { renderBubbleToCanvas } from './speechBubble.js';
import { applyDuoPreset } from './compositionPresets.js';
import { PackManager } from './pack.js';

class StudioApp {
  constructor() {
    this.canvas = new StickerCanvas('stickerCanvas', 'interactionCanvas');
    this.humanMaskProcessor = new PhotoMaskProcessor();
    this.charManager = new CharacterManager(this);
    this.pack = new PackManager(() => this.renderPackTray());

    // Current State
    this.humanLayerId = null;
    this.characterLayerId = null;
    this.statsLayerId = null;
    this.bubbleLayerId = null;
    this.activeMaskTarget = 'human'; // 'human' | 'char'

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
    this.renderStatsEditorInputs();
    this.renderVaultList();
    this.bindEvents();
    this.renderLayerList();
  }

  initUI() {
    // Top Tab switching
    document.querySelectorAll('.tabs-nav .tab-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tabs-nav .tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tab = document.getElementById(btn.dataset.tab);
        if (tab) tab.classList.add('active');
      });
    });

    // Character Source sub-tabs (Upload, Generate, Saved Vault)
    const btnSourceUpload = document.getElementById('btnSourceUpload');
    const btnSourceGenerate = document.getElementById('btnSourceGenerate');
    const btnSourceSaved = document.getElementById('btnSourceSaved');

    const panelUpload = document.getElementById('sourcePanelUpload');
    const panelGenerate = document.getElementById('sourcePanelGenerate');
    const panelSaved = document.getElementById('sourcePanelSaved');

    const setSourceTab = (activeBtn, activePanel) => {
      [btnSourceUpload, btnSourceGenerate, btnSourceSaved].forEach(b => b.classList.remove('active'));
      [panelUpload, panelGenerate, panelSaved].forEach(p => p.style.display = 'none');
      activeBtn.classList.add('active');
      activePanel.style.display = 'block';
    };

    btnSourceUpload.addEventListener('click', () => setSourceTab(btnSourceUpload, panelUpload));
    btnSourceGenerate.addEventListener('click', () => setSourceTab(btnSourceGenerate, panelGenerate));
    btnSourceSaved.addEventListener('click', () => {
      setSourceTab(btnSourceSaved, panelSaved);
      this.renderVaultList();
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
        this.characterLayerId = null;
        this.canvas.render();
        this.canvas.renderHandles();
        this.renderLayerList();
      }
    });

    // Layer stack controls
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
      if (active && (active.type === 'human' || active.type === 'creature')) {
        active.stylize = parseInt(e.target.value, 10);
        this.canvas.render();
      }
    });

    // Human Photo Upload & Samples
    const photoDropZone = document.getElementById('photoDropZone');
    const photoFileInput = document.getElementById('photoFileInput');

    photoDropZone.addEventListener('click', () => photoFileInput.click());
    photoFileInput.addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) {
        this.handlePhotoFile(e.target.files[0]);
      }
    });
    photoDropZone.addEventListener('dragover', e => {
      e.preventDefault();
      photoDropZone.style.borderColor = 'var(--accent)';
    });
    photoDropZone.addEventListener('dragleave', () => {
      photoDropZone.style.borderColor = 'var(--border-color)';
    });
    photoDropZone.addEventListener('drop', e => {
      e.preventDefault();
      photoDropZone.style.borderColor = 'var(--border-color)';
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

    // Character Upload
    const charDropZone = document.getElementById('charDropZone');
    const charFileInput = document.getElementById('charFileInput');

    charDropZone.addEventListener('click', () => charFileInput.click());
    charFileInput.addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) {
        this.handleCharacterFile(e.target.files[0]);
      }
    });
    charDropZone.addEventListener('dragover', e => {
      e.preventDefault();
      charDropZone.style.borderColor = 'var(--accent)';
    });
    charDropZone.addEventListener('dragleave', () => {
      charDropZone.style.borderColor = 'var(--border-color)';
    });
    charDropZone.addEventListener('drop', e => {
      e.preventDefault();
      charDropZone.style.borderColor = 'var(--border-color)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleCharacterFile(e.dataTransfer.files[0]);
      }
    });

    // Character styling modes (as-is, light-stylize, match-human, composite)
    document.querySelectorAll('.btn-char-style').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-char-style').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.style;
        this.applyCharacterStyleMode(mode);
      });
    });

    // Character Vault Save
    document.getElementById('btnSaveUploadedToVault').addEventListener('click', () => {
      const name = prompt('Name for this saved character:', 'My Character');
      if (name) {
        this.charManager.saveCurrentCharacterToVault(name);
        this.renderVaultList();
        alert(`Saved "${name}" to your character vault!`);
      }
    });
    document.getElementById('btnSaveGeneratedToVault').addEventListener('click', () => {
      const name = prompt('Name for this saved creature:', 'Original Creature');
      if (name) {
        this.charManager.saveCurrentCharacterToVault(name);
        this.renderVaultList();
        alert(`Saved "${name}" to your character vault!`);
      }
    });

    // Original Creature Generator buttons
    document.getElementById('btnGenerateCreature').addEventListener('click', () => this.generateCreature());
    document.getElementById('btnRandomizeCreature').addEventListener('click', () => this.generateCreature({ randomize: true }));
    document.getElementById('btnBreakSimilarity').addEventListener('click', () => this.generateCreature({ breakSimilarity: true }));

    // Duo Presets
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const preset = chip.dataset.preset;
        const human = this.canvas.layers.find(l => l.id === this.humanLayerId);
        const charLayer = this.canvas.layers.find(l => l.id === this.characterLayerId);
        if (!human || !charLayer) {
          alert('Add both a Human Subject and a Character first to use Duo Presets!');
          return;
        }
        applyDuoPreset(preset, human, charLayer);
        this.canvas.saveSnapshot();
        this.canvas.render();
        this.canvas.renderHandles();
      });
    });

    // Blend Styles button
    document.getElementById('btnBlendStyles').addEventListener('click', () => {
      const human = this.canvas.layers.find(l => l.id === this.humanLayerId);
      const charLayer = this.canvas.layers.find(l => l.id === this.characterLayerId);
      if (!human || !charLayer) {
        alert('Add both a Human Subject and a Character first to blend styles!');
        return;
      }
      this.charManager.blendStyles(human, charLayer);
      this.canvas.saveSnapshot();
      this.canvas.render();
      alert('✨ Styles harmonized! Color grades and ambient tones unified between human and character.');
    });

    // Mask Target Switcher (Human vs Character)
    const btnMaskHuman = document.getElementById('btnMaskTargetHuman');
    const btnMaskChar = document.getElementById('btnMaskTargetChar');
    btnMaskHuman.addEventListener('click', () => {
      this.activeMaskTarget = 'human';
      btnMaskHuman.classList.add('active');
      btnMaskHuman.style.borderColor = 'var(--accent)';
      btnMaskChar.classList.remove('active');
      btnMaskChar.style.borderColor = 'transparent';
    });
    btnMaskChar.addEventListener('click', () => {
      this.activeMaskTarget = 'char';
      btnMaskChar.classList.add('active');
      btnMaskChar.style.borderColor = 'var(--accent)';
      btnMaskHuman.classList.remove('active');
      btnMaskHuman.style.borderColor = 'transparent';
    });

    // Mask editing brush controls
    document.getElementById('btnBrushErase').addEventListener('click', e => {
      this.getCurrentMaskProcessor().brushMode = 'erase';
      e.target.style.borderColor = 'var(--accent)';
      document.getElementById('btnBrushRestore').style.borderColor = 'transparent';
    });
    document.getElementById('btnBrushRestore').addEventListener('click', e => {
      this.getCurrentMaskProcessor().brushMode = 'restore';
      e.target.style.borderColor = 'var(--accent)';
      document.getElementById('btnBrushErase').style.borderColor = 'transparent';
    });
    document.getElementById('brushSize').addEventListener('input', e => {
      this.humanMaskProcessor.brushSize = parseInt(e.target.value, 10);
      this.charManager.maskProcessor.brushSize = parseInt(e.target.value, 10);
      document.getElementById('brushSizeVal').textContent = `${e.target.value}px`;
    });
    document.getElementById('brushHardness').addEventListener('input', e => {
      const h = parseInt(e.target.value, 10) / 100;
      this.humanMaskProcessor.brushHardness = h;
      this.charManager.maskProcessor.brushHardness = h;
      document.getElementById('brushHardnessVal').textContent = `${e.target.value}%`;
    });
    document.getElementById('btnAutoCutout').addEventListener('click', () => {
      const proc = this.getCurrentMaskProcessor();
      proc.applyAutoCutout();
      this.updateActiveLayerComposite();
    });
    document.getElementById('btnResetMask').addEventListener('click', () => {
      const proc = this.getCurrentMaskProcessor();
      proc.resetMask();
      this.updateActiveLayerComposite();
    });

    // Mask painting on canvas
    let isPaintingMask = false;
    const iCanvas = this.canvas.interactionCanvas;
    iCanvas.addEventListener('mousedown', e => {
      const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
      if (activeTab === 'tabMask') {
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

  getCurrentMaskProcessor() {
    return this.activeMaskTarget === 'human' ? this.humanMaskProcessor : this.charManager.maskProcessor;
  }

  paintMaskAtEvent(e) {
    const isHuman = this.activeMaskTarget === 'human';
    const layer = isHuman
      ? this.canvas.layers.find(l => l.id === this.humanLayerId)
      : this.canvas.layers.find(l => l.id === this.characterLayerId);

    const proc = isHuman ? this.humanMaskProcessor : this.charManager.maskProcessor;
    if (!layer || !proc.rawImage) return;

    const rect = this.canvas.interactionCanvas.getBoundingClientRect();
    const scaleX = 512 / rect.width;
    const scaleY = 512 / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const localX = (canvasX - (layer.x - (layer.width * layer.scale) / 2)) / layer.scale;
    const localY = (canvasY - (layer.y - (layer.height * layer.scale) / 2)) / layer.scale;

    const maskW = proc.maskCanvas.width;
    const maskH = proc.maskCanvas.height;

    const normX = (localX / layer.width) * maskW;
    const normY = (localY / layer.height) * maskH;

    proc.paintBrush(normX, normY);
    this.updateActiveLayerComposite();
  }

  updateActiveLayerComposite() {
    const isHuman = this.activeMaskTarget === 'human';
    const layer = isHuman
      ? this.canvas.layers.find(l => l.id === this.humanLayerId)
      : this.canvas.layers.find(l => l.id === this.characterLayerId);

    const proc = isHuman ? this.humanMaskProcessor : this.charManager.maskProcessor;
    if (layer) {
      layer.image = proc.getCompositedImage();
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
    await this.humanMaskProcessor.loadFromSource(src);
    const composited = this.humanMaskProcessor.getCompositedImage();

    let human = this.canvas.layers.find(l => l.id === this.humanLayerId);
    if (!human) {
      human = this.canvas.addLayer({
        name: 'Human Subject',
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

  async handleCharacterFile(file) {
    const rightsChecked = document.getElementById('chkRightsConfirmation').checked;
    if (!rightsChecked) {
      alert('Please confirm rights/permission before importing character images.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async e => {
      const charObj = await this.charManager.handleCharacterUpload(e.target.result, true);
      this.placeCharacterOnCanvas(charObj.imageCanvas, 'Uploaded Character');
    };
    reader.readAsDataURL(file);
  }

  placeCharacterOnCanvas(imageCanvas, name = 'Character') {
    let charLayer = this.canvas.layers.find(l => l.id === this.characterLayerId);
    if (!charLayer) {
      charLayer = this.canvas.addLayer({
        name,
        type: 'creature',
        image: imageCanvas,
        x: 350,
        y: 200,
        width: 280,
        height: 280,
        scale: 0.55
      });
      this.characterLayerId = charLayer.id;
    } else {
      charLayer.image = imageCanvas;
      charLayer.name = name;
      this.canvas.render();
    }
    this.renderLayerList();
    this.updateInspectorFromActive();
  }

  applyCharacterStyleMode(mode) {
    const charLayer = this.canvas.layers.find(l => l.id === this.characterLayerId);
    if (!charLayer) return;

    if (mode === 'light_stylize') {
      charLayer.stylize = 35;
    } else if (mode === 'match_human') {
      charLayer.stylize = 15;
    } else if (mode === 'composite') {
      const human = this.canvas.layers.find(l => l.id === this.humanLayerId);
      this.charManager.blendStyles(human, charLayer);
    } else {
      charLayer.stylize = 0;
    }
    this.canvas.render();
  }

  renderVaultList() {
    const container = document.getElementById('vaultList');
    if (!container) return;
    container.innerHTML = '';

    if (this.charManager.savedVault.length === 0) {
      container.innerHTML = '<p style="grid-column:1/3; font-size:11px; color:var(--text-muted); text-align:center;">No saved characters yet. Upload or generate one and click Save to Vault!</p>';
      return;
    }

    this.charManager.savedVault.forEach(item => {
      const card = document.createElement('div');
      card.className = 'preset-chip';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'center';
      card.style.gap = '4px';
      card.style.position = 'relative';

      card.innerHTML = `
        <img src="${item.dataUrl}" style="width:48px; height:48px; object-fit:contain; border-radius:4px;">
        <span style="font-size:10px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80px;">${item.name}</span>
        <button class="btn-del-vault" style="position:absolute; top:2px; right:2px; padding:0 3px; font-size:9px; background:rgba(235,87,87,0.8); border:none; border-radius:50%; color:#fff;">✕</button>
      `;

      card.addEventListener('click', e => {
        if (!e.target.classList.contains('btn-del-vault')) {
          const img = new Image();
          img.onload = () => {
            this.charManager.currentCharacter = {
              name: item.name,
              sourceType: 'saved',
              imageCanvas: img,
              rawSource: item.dataUrl
            };
            this.placeCharacterOnCanvas(img, item.name);
          };
          img.src = item.dataUrl;
        }
      });

      card.querySelector('.btn-del-vault').addEventListener('click', e => {
        e.stopPropagation();
        this.charManager.deleteFromVault(item.id);
        this.renderVaultList();
      });

      container.appendChild(card);
    });
  }

  async generateCreature(options = {}) {
    try {
      const res = await fetch('/api/creature/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      const data = await res.json();

      const img = new Image();
      img.onload = () => {
        this.charManager.currentCharacter = {
          name: data.name,
          sourceType: 'generated',
          imageCanvas: img,
          rawSource: data.dataUrl
        };
        this.placeCharacterOnCanvas(img, `Creature (${data.name})`);
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
        <span class="layer-icon">${l.type === 'human' ? '👤' : l.type === 'creature' ? '🎨' : l.type === 'stats' ? '🎴' : '💬'}</span>
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
        if (this.characterLayerId === l.id) this.characterLayerId = null;
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

    // If character layer exists and is generated, update its emotion
    if (this.charManager.currentCharacter?.sourceType === 'generated') {
      await this.generateCreature({ emotion: reaction });
    }

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
