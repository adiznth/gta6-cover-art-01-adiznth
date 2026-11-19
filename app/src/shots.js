// Fixed scenes for screenshots: ?shot=editor shows the studio with sample photos loaded;
// ?shot=cover shows the cover alone, full viewport, from the query's layout, grade and size.
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, state, loadImage, redraw, buildSlots) {
  const sample = query.get('photo') ?? 'pier';
  const second = query.get('photo2') ?? 'boulevard';
  state.photos[0] = await loadImage(`samples/${sample}.jpg`);
  state.photos[1] = await loadImage(`samples/${second}.jpg`);
  state.title = query.get('caption') ?? 'Sunset Heist';
  state.subtitle = query.get('subtitle') ?? 'one last ride';
  state.tag = query.get('tag') ?? 'NEON COAST';
  state.layout = query.get('layout') ?? 'hero-duo';
  state.grade = query.get('grade') ?? 'sunset';
  state.size = query.get('size') ?? '1080x1080';
  for (let i = 0; i < 4; i++) {
    const p = query.get(`p${i}`);
    const ox = query.get(`ox${i}`);
    const oy = query.get(`oy${i}`);
    if (p !== null || ox !== null || oy !== null) {
      state.panelState[`${state.layout}:${i}`] = {
        photo: p === null ? i : Number(p),
        zoom: 1,
        ox: ox === null ? 0 : Number(ox),
        oy: oy === null ? 0 : Number(oy),
      };
    }
  }
  buildSlots();
  redraw();
  if (shot === 'cover') document.body.classList.add('shot-cover');
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
