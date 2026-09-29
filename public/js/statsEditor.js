/**
 * statsEditor.js
 * Generates and renders customizable character stats cards into a canvas layer
 */

export function renderStatsCardToCanvas(data = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 260;
  const ctx = canvas.getContext('2d');

  const name = (data.name || 'Rachel').toUpperCase();
  const className = (data.className || 'Parking Lot Necromancer').toUpperCase();
  const stats = data.stats || [
    { name: 'CHAOS', value: '94' },
    { name: 'PATIENCE', value: '11' }
  ];
  const roast = data.roast || 'Says "Im five minutes away" while currently looking for their other sock.';
  const ability = data.specialAbility || 'Turns a five-minute errand into an unexpected trilogy';

  // Card Background with dark glassmorphism
  ctx.save();
  ctx.fillStyle = 'rgba(16, 20, 28, 0.92)';
  ctx.strokeStyle = '#2ea5ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(8, 8, 444, 244, 12);
  ctx.fill();
  ctx.stroke();

  // Header banner: Name & Class
  ctx.fillStyle = '#2ea5ff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(name, 24, 38);

  ctx.fillStyle = '#f5a623';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`[ ${className} ]`, 24, 58);

  // Divider
  ctx.strokeStyle = '#2d3444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 70);
  ctx.lineTo(436, 70);
  ctx.stroke();

  // Stats Grid (2 columns)
  ctx.font = 'bold 12px sans-serif';
  let startY = 94;
  stats.slice(0, 4).forEach((st, idx) => {
    const colX = idx % 2 === 0 ? 24 : 240;
    const rowY = startY + Math.floor(idx / 2) * 26;

    ctx.fillStyle = '#8b95a8';
    ctx.fillText(`${st.name}:`, colX, rowY);

    ctx.fillStyle = '#36c782';
    ctx.fillText(`${st.value}`, colX + 110, rowY);
  });

  // Divider
  ctx.strokeStyle = '#2d3444';
  ctx.beginPath();
  ctx.moveTo(24, 150);
  ctx.lineTo(436, 150);
  ctx.stroke();

  // Ability / Roast Section
  ctx.fillStyle = '#f0f3f8';
  ctx.font = 'italic 11px sans-serif';
  wrapText(ctx, `"${roast}"`, 24, 172, 410, 16);

  ctx.fillStyle = '#2ea5ff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(`ABILITY: ${ability}`, 24, 234);

  ctx.restore();
  return canvas;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}
