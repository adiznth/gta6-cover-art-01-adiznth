// Neon Coast Cover Studio: the cover engine. Draws a multi-panel, sunset-graded poster
// cover onto a canvas from the editor state: photos per panel, layout, grade, words.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080 · Square' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350 · Portrait' },
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080 · Wide' },
};

export const LAYOUTS = {
  'hero-duo': { label: 'Hero + Duo', panels: [
    { x: 0, y: 0, w: 0.62, h: 1 },
    { x: 0.628, y: 0, w: 0.372, h: 0.496 },
    { x: 0.628, y: 0.504, w: 0.372, h: 0.496 },
  ] },
  'grid-four': { label: 'Four Grid', panels: [
    { x: 0, y: 0, w: 0.496, h: 0.496 },
    { x: 0.504, y: 0, w: 0.496, h: 0.496 },
    { x: 0, y: 0.504, w: 0.496, h: 0.496 },
    { x: 0.504, y: 0.504, w: 0.496, h: 0.496 },
  ] },
  'full-bleed': { label: 'Full Bleed', panels: [
    { x: 0, y: 0, w: 1, h: 1 },
  ] },
  'tilted-trio': { label: 'Tilted Trio', backdrop: true, panels: [
    { x: 0.06, y: 0.16, w: 0.34, h: 0.6, tilt: -6 },
    { x: 0.33, y: 0.12, w: 0.34, h: 0.64, tilt: 0 },
    { x: 0.6, y: 0.16, w: 0.34, h: 0.6, tilt: 6 },
  ] },
  'strip-trio': { label: 'Strip Trio', panels: [
    { x: 0, y: 0, w: 0.328, h: 1 },
    { x: 0.336, y: 0, w: 0.328, h: 1 },
    { x: 0.672, y: 0, w: 0.328, h: 1 },
  ] },
  'duo-split': { label: 'Duo Split', panels: [
    { x: 0, y: 0, w: 0.62, h: 1, clip: [[0, 0], [0.62, 0], [0.42, 1], [0, 1]] },
    { x: 0.38, y: 0, w: 0.62, h: 1, clip: [[0.62, 0], [1, 0], [1, 1], [0.42, 1]] },
  ] },
};

export const GRADES = {
  sunset: { label: 'Sunset', sky: '#ff9a3c', deep: '#ff2e88', wash: 'rgba(255, 80, 120, 0.16)', accent: '#ffd166' },
  neon: { label: 'Neon Nights', sky: '#ff2ec4', deep: '#00e5ff', wash: 'rgba(0, 229, 255, 0.14)', accent: '#00e5ff' },
  golden: { label: 'Golden Hour', sky: '#ffc53c', deep: '#ff7a1a', wash: 'rgba(255, 170, 40, 0.16)', accent: '#fff3c4' },
  midnight: { label: 'Midnight', sky: '#7b5cff', deep: '#12082e', wash: 'rgba(123, 92, 255, 0.18)', accent: '#b7a6ff' },
  palm: { label: 'Palm Teal', sky: '#2ee6a8', deep: '#0a5c46', wash: 'rgba(46, 230, 168, 0.14)', accent: '#a8ffdd' },
};

/** A fresh editor state: three photo slots, hero layout, sunset grade, starter words. */
export function defaultState() {
  return {
    size: '1080x1080',
    layout: 'hero-duo',
    grade: 'sunset',
    title: 'Sunset Heist',
    subtitle: 'one last ride',
    tag: 'NEON COAST',
    grain: true,
    vignette: true,
    frame: true,
    photos: [null, null, null],
    panelState: {},
  };
}

/** The crop of one panel: which photo slot fills it, zoom and pan offsets. */
export function panelCrop(state, index) {
  const saved = state.panelState[`${state.layout}:${index}`];
  if (saved) return saved;
  return { photo: index, zoom: 1, ox: 0, oy: 0 };
}

export function setPanelCrop(state, index, crop) {
  state.panelState[`${state.layout}:${index}`] = crop;
}

/** Resolves a panel's photo: its slot, or the first filled slot when that one is empty. */
export function panelPhoto(state, index) {
  const crop = panelCrop(state, index);
  if (state.photos[crop.photo]) return state.photos[crop.photo];
  return state.photos.find((p) => p) ?? null;
}

let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  noiseTile = tile;
  return tile;
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
export function drawPanelPhoto(ctx, photo, rect, crop) {
  if (!photo) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#3a1c5c');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = Math.max(2, rect.w * 0.006);
    for (let d = -rect.h; d < rect.w; d += rect.w * 0.12) {
      ctx.beginPath();
      ctx.moveTo(rect.x + d, rect.y + rect.h);
      ctx.lineTo(rect.x + d + rect.h, rect.y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = `600 ${Math.max(14, rect.w * 0.05)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    return;
  }
  const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * crop.zoom;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  const cx = rect.x + rect.w / 2 + crop.ox * rect.w;
  const cy = rect.y + rect.h / 2 + crop.oy * rect.h;
  ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
}

/** Washes the whole cover in the grade's sunset-to-neon light. */
export function applyGrade(ctx, w, h, grade) {
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, grade.sky);
  wash.addColorStop(1, grade.deep);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  const dusk = ctx.createLinearGradient(0, h * 0.45, 0, h);
  dusk.addColorStop(0, 'rgba(20, 6, 36, 0)');
  dusk.addColorStop(1, 'rgba(20, 6, 36, 0.55)');
  ctx.fillStyle = dusk;
  ctx.fillRect(0, 0, w, h);
}

/** Splits the title into at most two lines that fit the cover width. */
export function wrapTitle(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

/** Draws the halftone dot row, the big title, the script subtitle and the tag. */
export function drawTitleBlock(ctx, w, h, state, grade) {
  const pad = w * 0.045;
  const bandTop = h * 0.66;
  const band = ctx.createLinearGradient(0, bandTop, 0, h);
  band.addColorStop(0, 'rgba(12, 4, 24, 0)');
  band.addColorStop(0.45, 'rgba(12, 4, 24, 0.72)');
  band.addColorStop(1, 'rgba(12, 4, 24, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, w, h - bandTop);

  const title = state.title.trim().toUpperCase();
  const maxWidth = w - pad * 2;
  let size = h * 0.105;
  let lines = [];
  if (title) {
    ctx.font = `${size}px Anton, sans-serif`;
    while (size > h * 0.03) {
      ctx.font = `${size}px Anton, sans-serif`;
      lines = wrapTitle(ctx, title, maxWidth);
      if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= maxWidth)) break;
      size -= 2;
    }
    ctx.font = `${size}px Anton, sans-serif`;
    lines = wrapTitle(ctx, title, maxWidth);
  }

  const subSize = Math.max(18, h * 0.032);
  const lineHeight = size * 1.02;
  // Anchor the block on the bottom edge: subtitle baseline sits at the pad, the
  // title's last line above it, so nothing ever runs off the cover.
  const bottom = h - pad;
  const subBaseline = bottom;
  const titleLastBaseline = state.subtitle.trim() ? subBaseline - subSize * 1.15 : subBaseline;
  let y = titleLastBaseline - (lines.length - 1) * lineHeight;

  // Halftone dot row above the title.
  const dotY = y - size * 1.02;
  ctx.fillStyle = grade.accent;
  for (let i = 0; i < 14; i++) {
    const r = Math.max(2.5, size * 0.034 * (1 - Math.abs(i - 6.5) / 9));
    ctx.beginPath();
    ctx.arc(pad + i * (maxWidth / 13), dotY, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const line of lines) {
    const grad = ctx.createLinearGradient(0, y - size, 0, y);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, grade.accent);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.075);
    ctx.strokeStyle = '#160826';
    ctx.strokeText(line, pad, y);
    ctx.fillStyle = grad;
    ctx.fillText(line, pad, y);
    y += lineHeight;
  }

  const sub = state.subtitle.trim();
  if (sub) {
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = subSize * 0.25;
    ctx.fillText(sub, pad + size * 0.06, subBaseline);
    ctx.shadowBlur = 0;
  }

  const tag = state.tag.trim().toUpperCase();
  if (tag) {
    const tagSize = Math.max(13, h * 0.016);
    ctx.font = `700 ${tagSize}px system-ui, sans-serif`;
    const tw = ctx.measureText(tag).width;
    const bx = pad;
    const by = pad * 0.9;
    ctx.fillStyle = 'rgba(12, 4, 24, 0.72)';
    ctx.fillRect(bx - 8, by - tagSize - 6, tw + 30, tagSize + 14);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(bx - 8, by - tagSize - 6, 5, tagSize + 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tag, bx + 6, by);
  }
}

/** Draws the whole cover from the editor state onto the canvas at its own size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS['hero-duo'];
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const gap = Math.max(2, w * 0.006);

  ctx.save();
  ctx.fillStyle = '#160826';
  ctx.fillRect(0, 0, w, h);

  if (layout.backdrop) {
    const back = panelPhoto(state, 0);
    if (back) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      drawPanelPhoto(ctx, back, { x: 0, y: 0, w, h }, { zoom: 1.15, ox: 0, oy: 0 });
      ctx.restore();
      ctx.fillStyle = 'rgba(12, 4, 24, 0.45)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  layout.panels.forEach((panel, i) => {
    const rect = {
      x: panel.x * w + (panel.x > 0 ? gap / 2 : 0),
      y: panel.y * h + (panel.y > 0 ? gap / 2 : 0),
      w: panel.w * w - (panel.x > 0 ? gap / 2 : 0) - (panel.x + panel.w < 1 ? gap / 2 : 0),
      h: panel.h * h - (panel.y > 0 ? gap / 2 : 0) - (panel.y + panel.h < 1 ? gap / 2 : 0),
    };
    const crop = panelCrop(state, i);
    const photo = panelPhoto(state, i);
    ctx.save();
    if (panel.clip) {
      ctx.beginPath();
      panel.clip.forEach(([cx, cy], j) => {
        if (j === 0) ctx.moveTo(cx * w, cy * h);
        else ctx.lineTo(cx * w, cy * h);
      });
      ctx.closePath();
      ctx.clip();
      drawPanelPhoto(ctx, photo, { x: 0, y: 0, w, h }, crop);
    } else if (panel.tilt) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((panel.tilt * Math.PI) / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      drawPanelPhoto(ctx, photo, { x: 0, y: 0, w: rect.w, h: rect.h }, crop);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, w * 0.005);
      ctx.strokeRect(0, 0, rect.w, rect.h);
    } else {
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      drawPanelPhoto(ctx, photo, rect, crop);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = Math.max(2, w * 0.003);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  });

  applyGrade(ctx, w, h, grade);
  drawTitleBlock(ctx, w, h, state, grade);

  if (state.vignette) {
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(8, 2, 16, 0.42)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  if (state.grain) {
    const pattern = ctx.createPattern(grainTile(), 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  if (state.frame) {
    const inset = w * 0.022;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = Math.max(3, w * 0.006);
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    ctx.strokeStyle = grade.accent;
    ctx.lineWidth = Math.max(1.5, w * 0.002);
    ctx.strokeRect(inset + w * 0.008, inset + w * 0.008, w - (inset + w * 0.008) * 2, h - (inset + w * 0.008) * 2);
  }
  ctx.restore();
}

/** Renders the cover at a chosen size on a fresh canvas (used for export). */
export function renderCover(state, sizeKey) {
  const size = SIZES[sizeKey] ?? SIZES['1080x1080'];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  return canvas;
}

/** The panel rects in canvas pixels, for hit-testing clicks on the preview. */
export function panelRects(canvas, state) {
  const { width: w, height: h } = canvas;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS['hero-duo'];
  return layout.panels.map((panel) => ({
    x: panel.x * w,
    y: panel.y * h,
    w: panel.w * w,
    h: panel.h * h,
  }));
}
