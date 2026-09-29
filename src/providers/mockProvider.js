import { ImageProvider } from './imageProvider.js';

export class MockImageProvider extends ImageProvider {
  constructor() {
    super();
    this.name = 'Development / Mock Provider (Offline)';
  }

  async removeBackground(imageInput, options = {}) {
    // In mock mode, we pass the image through with a flag indicating automatic cutout is ready
    // The client-side canvas engine can also apply an elliptical/soft portrait mask or user brush mask
    return {
      success: true,
      dataUrl: imageInput,
      provider: 'mock'
    };
  }

  async generateCreature(params = {}) {
    // Generate an original SVG-based creature asset with transparent background
    const archetype = params.archetype || 'sprout_beast';
    const emotion = params.emotion || 'happy';
    const palette = params.palette || {
      body: '#58b48f',
      belly: '#a7e4cb',
      accent: '#e66b42',
      eye: '#222222',
      highlight: '#ffffff'
    };

    const svg = generateCreatureSVG(archetype, emotion, palette);
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    return {
      success: true,
      name: params.name || 'Moss Prowler',
      dataUrl,
      archetype,
      emotion,
      traits: params.traits || {
        body: 'Six-legged arboreal salamander',
        element: 'Fern crown and lichen mantle',
        palette: 'Sage and copper'
      }
    };
  }

  async stylizeHuman(imageInput, strength = 0.5) {
    // Stylization is handled dynamically client-side in the 512x512 canvas pipeline
    return {
      success: true,
      dataUrl: imageInput,
      strength
    };
  }

  async generateVariation(baseStickerDataUrl, emotion) {
    return {
      success: true,
      emotion,
      dataUrl: baseStickerDataUrl
    };
  }
}

function generateCreatureSVG(archetype, emotion, palette) {
  // Generate a distinct, cute, original creature with expressive features
  let mouthPath = 'M 220 280 Q 256 310 292 280';
  let eyeLeft = '<circle cx="205" cy="225" r="14" fill="' + palette.eye + '"/><circle cx="201" cy="220" r="5" fill="#ffffff"/>';
  let eyeRight = '<circle cx="307" cy="225" r="14" fill="' + palette.eye + '"/><circle cx="303" cy="220" r="5" fill="#ffffff"/>';

  if (emotion === 'side_eye') {
    eyeLeft = '<ellipse cx="205" cy="225" rx="14" ry="10" fill="' + palette.eye + '"/><circle cx="212" cy="225" r="6" fill="#ffffff"/>';
    eyeRight = '<ellipse cx="307" cy="225" rx="14" ry="10" fill="' + palette.eye + '"/><circle cx="314" cy="225" r="6" fill="#ffffff"/>';
    mouthPath = 'M 225 285 Q 260 280 285 275';
  } else if (emotion === 'rage') {
    eyeLeft = '<polygon points="190,215 220,230 195,240" fill="' + palette.eye + '"/>';
    eyeRight = '<polygon points="322,215 292,230 317,240" fill="' + palette.eye + '"/>';
    mouthPath = 'M 215 295 Q 256 265 295 295 Z';
  } else if (emotion === 'laughing') {
    eyeLeft = '<path d="M 190 225 Q 205 210 220 225" stroke="' + palette.eye + '" stroke-width="6" fill="none" stroke-linecap="round"/>';
    eyeRight = '<path d="M 292 225 Q 307 210 322 225" stroke="' + palette.eye + '" stroke-width="6" fill="none" stroke-linecap="round"/>';
    mouthPath = 'M 215 275 Q 256 335 297 275 Z';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="10" flood-opacity="0.25"/>
      </filter>
      <radialGradient id="bodyGrad" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stop-color="${palette.belly}"/>
        <stop offset="100%" stop-color="${palette.body}"/>
      </radialGradient>
      <linearGradient id="crestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${palette.accent}"/>
        <stop offset="100%" stop-color="#b84c26"/>
      </linearGradient>
    </defs>
    <g filter="url(#shadow)">
      <!-- Back appendages / foliage crest -->
      <path d="M 256 60 C 210 80 180 140 210 180 C 230 140 282 140 302 180 C 332 140 302 80 256 60 Z" fill="url(#crestGrad)" stroke="#222" stroke-width="6"/>
      <circle cx="210" cy="110" r="16" fill="${palette.accent}" opacity="0.8"/>
      <circle cx="302" cy="110" r="16" fill="${palette.accent}" opacity="0.8"/>

      <!-- Sturdy little legs -->
      <ellipse cx="160" cy="390" rx="35" ry="45" fill="${palette.body}" stroke="#222" stroke-width="6"/>
      <ellipse cx="352" cy="390" rx="35" ry="45" fill="${palette.body}" stroke="#222" stroke-width="6"/>
      <ellipse cx="205" cy="420" rx="30" ry="25" fill="${palette.body}" stroke="#222" stroke-width="6"/>
      <ellipse cx="307" cy="420" rx="30" ry="25" fill="${palette.body}" stroke="#222" stroke-width="6"/>

      <!-- Main Body -->
      <path d="M 256 150 C 160 150 140 230 140 310 C 140 390 190 425 256 425 C 322 425 372 390 372 310 C 372 230 352 150 256 150 Z" fill="url(#bodyGrad)" stroke="#222" stroke-width="7"/>

      <!-- Belly Patch -->
      <ellipse cx="256" cy="340" rx="65" ry="60" fill="${palette.belly}" opacity="0.75"/>

      <!-- Expressive Face -->
      ${eyeLeft}
      ${eyeRight}

      <!-- Cheeks -->
      <ellipse cx="170" cy="265" rx="14" ry="9" fill="${palette.accent}" opacity="0.45"/>
      <ellipse cx="342" cy="265" rx="14" ry="9" fill="${palette.accent}" opacity="0.45"/>

      <!-- Mouth -->
      <path d="${mouthPath}" stroke="#222" stroke-width="6" fill="${emotion === 'laughing' || emotion === 'rage' ? '#8b2626' : 'none'}" stroke-linecap="round"/>
    </g>
  </svg>`;
}
