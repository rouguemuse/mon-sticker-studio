# 🎨 Telegram Sticker Pack Creation Studio

> An end-to-end studio for turning human portraits, original companions, and custom artwork into complete, Telegram-ready sticker packs.

[![Live on Vercel](https://img.shields.io/badge/Vercel-Live%20Demo-2ea5ff?style=for-the-badge&logo=vercel)](https://mon-sticker-studio.vercel.app)
[![Tests Passing](https://img.shields.io/badge/Tests-9%20Passed-36c782?style=for-the-badge&logo=node.js)](https://github.com/rouguemuse/mon-sticker-studio)
[![Telegram Ready](https://img.shields.io/badge/Telegram-512x512%20WEBP-2481cc?style=for-the-badge&logo=telegram)](https://mon-sticker-studio.vercel.app)

---

## 🚀 Live Demo

**[https://mon-sticker-studio.vercel.app](https://mon-sticker-studio.vercel.app)**

---

## ⚡ Core Features

- **512 × 512 Multi-Layer Canvas Editor**:
  - Independent layer stack (*Human, Character, Stats, Speech Bubble, Text*).
  - Transform handles for interactive dragging, scaling, rotating, flipping, and opacity adjustment.
  - Multi-pass radial dilation white sticker stroke & ambient drop shadow.
  - Full Undo/Redo history (Ctrl+Z / Ctrl+Y).
- **Non-Destructive Photo Cutout**:
  - Preserves raw uploaded image in memory.
  - Interactive **Erase / Restore Masking Brush** with brush size and hardness sliders.
  - Auto-cutout subject isolation + reset mask.
  - Photo-to-Illustrated stylization slider (`PHOTO ─────── ILLUSTRATED`).
- **Flexible Character / Creature Source System**:
  - **Upload Character**: First-class support for custom art with built-in rights confirmation notice and non-destructive cutout masking.
  - **Generate Original Creature**: 1-click generation with the internal **Similarity Breaker** (guarantees at least 2 mutated axes away from copyrighted archetypes).
  - **Saved Characters Vault**: Save characters once and reuse them across multiple stickers and packs.
  - **✨ Blend Styles Function**: Coordinated color curves and ambient illumination harmonizing real photos and illustrated art.
- **10 Automatic Duo Presets**:
  - *On Shoulder, In Arms, On Head, Hugging, Fighting, Judging, Side Eye, Riding, Photobomb, Tiny Version*.
- **Humorous Stats & Roast Engine**:
  - Character Identity (*NAME: Rachel*, *CLASS: Parking Lot Necromancer*).
  - Humorous stat blocks (*CHAOS: 94*, *PATIENCE: 11*, *BAD DECISIONS: CRITICAL*, *CAFFEINE: 99/100*).
  - 5-Tier Roast Mode (*Friendly* to *Group Chat Has No Mercy*) with custom habit context and tone modifiers (*Make Meaner, Drier, Absurd, Shorten*).
  - In-place editable text fields.
- **Comic Bubbles & Text**:
  - Speech bubbles, thought clouds, and comic scream bursts auto-fitted to 512×512.
- **Pack Management & Telegram Validator**:
  - Pack tray with draggable sticker tiles.
  - **Mandatory Emoji Rule**: Enforces that every sticker in a pack has at least one associated emoji trigger (`🔥`, `😂`, `👀`, etc.).
  - Telegram chat simulator preview (dark & light modes).
  - One-click Telegram `.webp` export and full pack packaging.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vanilla ES Modules, HTML5 Canvas API (no bulky framework overhead).
- **Backend / Serverless**: Node.js HTTP Server & Vercel Serverless Functions (`api/index.js`).
- **Testing**: Built-in `node:test` and `node:assert`.
- **Zero-Dependency**: Runs completely offline and locally out of the box with zero external npm dependencies.

---

## 💻 Local Quickstart

```bash
# Clone the repository
git clone https://github.com/rouguemuse/mon-sticker-studio.git
cd mon-sticker-studio

# Start the local studio server
npm start

# Open http://localhost:3000 in your browser
```

### Running Tests

```bash
npm test
```

---

## 📜 License

MIT License. Free for personal and commercial sticker creation.
