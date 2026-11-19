// Neon Coast Cover Studio: wires the page — photo slots, layout, grade, size, words,
// panel picking (click, drag to pan, scroll to zoom), undo/redo and PNG export.
import { SIZES, LAYOUTS, GRADES, defaultState, panelCrop, setPanelCrop, panelPhoto, drawCover, renderCover, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();
let selectedPanel = 0;
let history = [];
let future = [];

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, state);
  document.getElementById('sizeLabel').textContent = size.label;
  syncPanelControls();
}

/** A snapshot of everything undoable (photos stay put; only the look is undone). */
function snapshot() {
  const { photos, ...rest } = state;
  return JSON.stringify(rest);
}

function pushHistory() {
  history.push(snapshot());
  if (history.length > 40) history.shift();
  future = [];
  syncUndoButtons();
}

function restore(json) {
  const saved = JSON.parse(json);
  const photos = state.photos;
  Object.assign(state, saved);
  state.photos = photos;
  syncAllControls();
  redraw();
}

function syncUndoButtons() {
  document.getElementById('undo').disabled = history.length === 0;
  document.getElementById('redo').disabled = future.length === 0;
}

function buildSlots() {
  const wrap = document.getElementById('slots');
  wrap.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    const thumb = document.createElement('div');
    thumb.className = 'thumb' + (photo ? ' filled' : '');
    thumb.title = `Photo ${i + 1}`;
    if (photo) thumb.style.backgroundImage = `url(${photo.src})`;
    const label = document.createElement('label');
    label.textContent = `Photo ${i + 1}`;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      state.photos[i] = await loadImage(URL.createObjectURL(file));
      pushHistory();
      buildSlots();
      redraw();
    });
    label.appendChild(input);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      state.photos[i] = null;
      pushHistory();
      buildSlots();
      redraw();
    });
    slot.append(thumb, label, remove);
    wrap.appendChild(slot);
  });
}

function buildChoices(id, entries, current, onPick) {
  const wrap = document.getElementById(id);
  wrap.innerHTML = '';
  for (const [key, value] of Object.entries(entries)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value.label;
    button.dataset.key = key;
    if (key === current) button.classList.add('active');
    if (id === 'grades') {
      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = `linear-gradient(135deg, ${value.sky}, ${value.deep})`;
      button.prepend(swatch);
    }
    button.addEventListener('click', () => {
      pushHistory();
      onPick(key);
      wrap.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.key === key));
      redraw();
    });
    wrap.appendChild(button);
  }
}

function buildAllChoices() {
  buildChoices('layouts', LAYOUTS, state.layout, (key) => { state.layout = key; selectedPanel = 0; });
  buildChoices('grades', GRADES, state.grade, (key) => { state.grade = key; });
  buildChoices('sizes', SIZES, state.size, (key) => { state.size = key; });
}

function syncPanelControls() {
  const crop = panelCrop(state, selectedPanel);
  const zoom = document.getElementById('zoom');
  zoom.value = crop.zoom;
  document.getElementById('panelHint').textContent =
    `Panel ${selectedPanel + 1} of ${LAYOUTS[state.layout].panels.length} — drag the photo or scroll to zoom.`;
}

function syncAllControls() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('tag').value = state.tag;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('vignette').checked = state.vignette;
  document.getElementById('frame').checked = state.frame;
  buildAllChoices();
  buildSlots();
  syncUndoButtons();
}

function pickPanelAt(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  const rects = panelRects(canvas, state);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return 0;
}

let dragging = null;
canvas.addEventListener('pointerdown', (event) => {
  selectedPanel = pickPanelAt(event);
  const rect = canvas.getBoundingClientRect();
  dragging = { x: event.clientX, y: event.clientY, rect };
  canvas.setPointerCapture(event.pointerId);
  syncPanelControls();
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const rects = panelRects(canvas, state);
  const r = rects[selectedPanel];
  const crop = panelCrop(state, selectedPanel);
  crop.ox = Math.max(-0.5, Math.min(0.5, crop.ox + (event.clientX - dragging.x) / dragging.rect.width * (canvas.width / r.w)));
  crop.oy = Math.max(-0.5, Math.min(0.5, crop.oy + (event.clientY - dragging.y) / dragging.rect.height * (canvas.height / r.h)));
  dragging.x = event.clientX;
  dragging.y = event.clientY;
  setPanelCrop(state, selectedPanel, crop);
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (dragging) pushHistory();
  dragging = null;
});
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const crop = panelCrop(state, selectedPanel);
  crop.zoom = Math.max(1, Math.min(3, crop.zoom * (event.deltaY < 0 ? 1.08 : 0.93)));
  setPanelCrop(state, selectedPanel, crop);
  redraw();
}, { passive: false });

document.getElementById('zoom').addEventListener('input', (e) => {
  const crop = panelCrop(state, selectedPanel);
  crop.zoom = Number(e.target.value);
  setPanelCrop(state, selectedPanel, crop);
  redraw();
});
document.getElementById('zoom').addEventListener('change', pushHistory);
document.getElementById('resetCrop').addEventListener('click', () => {
  pushHistory();
  setPanelCrop(state, selectedPanel, { photo: panelCrop(state, selectedPanel).photo, zoom: 1, ox: 0, oy: 0 });
  redraw();
});
document.getElementById('swapPhoto').addEventListener('click', () => {
  pushHistory();
  const crop = panelCrop(state, selectedPanel);
  crop.photo = (crop.photo + 1) % 3;
  setPanelCrop(state, selectedPanel, crop);
  redraw();
});

document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('title').addEventListener('change', pushHistory);
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('change', pushHistory);
document.getElementById('tag').addEventListener('input', (e) => { state.tag = e.target.value; redraw(); });
document.getElementById('tag').addEventListener('change', pushHistory);
for (const id of ['grain', 'vignette', 'frame']) {
  document.getElementById(id).addEventListener('change', (e) => {
    pushHistory();
    state[id] = e.target.checked;
    redraw();
  });
}

document.getElementById('undo').addEventListener('click', () => {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
  syncUndoButtons();
});
document.getElementById('redo').addEventListener('click', () => {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
  syncUndoButtons();
});

document.querySelectorAll('[data-sample]').forEach((button) => {
  button.addEventListener('click', async () => {
    const img = await loadImage(`samples/${button.dataset.sample}.jpg`);
    const slot = state.photos.findIndex((p) => !p);
    state.photos[slot === -1 ? 0 : slot] = img;
    pushHistory();
    buildSlots();
    redraw();
  });
});

document.getElementById('export').addEventListener('click', () => {
  const out = renderCover(state, state.size);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${state.size}.png`;
    a.click();
    status.textContent = `Saved neon-coast-cover-${state.size}.png`;
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
async function start() {
  try {
    await Promise.all([document.fonts.load('100px Anton'), document.fonts.load('40px Pacifico')]);
  } catch { /* system fonts still draw the cover */ }
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), state, loadImage, redraw, buildSlots);
  }
  syncAllControls();
  redraw();
  pushHistory();
}
start();
