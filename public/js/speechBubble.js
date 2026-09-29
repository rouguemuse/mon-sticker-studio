/**
 * speechBubble.js
 * Renders vector speech bubbles, thought clouds, comic bursts, and captions
 */

export function renderBubbleToCanvas(options = {}) {
  const text = options.text || "I SAID I'M ON MY WAY.";
  const type = options.type || 'speech'; // 'speech' | 'thought' | 'burst' | 'caption' | 'badge'
  const fontSize = options.fontSize || 22;
  const textColor = options.textColor || '#111111';
  const bgColor = options.bgColor || '#ffffff';
  const borderColor = options.borderColor || '#000000';
  const borderWidth = options.borderWidth || 4;

  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const w = 400;
  const h = 130;
  const x = 20;
  const y = 15;

  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.lineJoin = 'round';

  if (type === 'speech') {
    // Rounded bubble with speech tail pointing down-left
    const r = 24;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + 120, y + h);
    ctx.lineTo(x + 80, y + h + 35); // tail tip
    ctx.lineTo(x + 95, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === 'burst') {
    // Comic scream burst
    ctx.beginPath();
    const cx = x + w / 2;
    const cy = y + h / 2;
    const spikes = 14;
    const outerR = w / 2;
    const innerR = h / 2.2;
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes;
      const sx = cx + Math.cos(angle) * radius;
      const sy = cy + Math.sin(angle) * radius * 0.7;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === 'caption') {
    // Solid rectangular bar with bold meme text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  } else {
    // Rounded pill badge
    const r = 20;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.stroke();
  }

  // Draw wrapped text
  ctx.fillStyle = type === 'caption' ? '#ffffff' : textColor;
  wrapText(ctx, text, x + w / 2, y + h / 2, w - 40, fontSize * 1.3);
  ctx.restore();

  return canvas;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  const totalHeight = lines.length * lineHeight;
  let startY = y - totalHeight / 2 + lineHeight / 2;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight);
  }
}
