/* Lucy's pointing hint, shared by every world: after two misses on one
   prompt, Lucy points to the right picture. It never changes scoring,
   progress or sound; reduced motion and the grown-ups' calm setting get a
   still highlight (see the "Lucy's pointing hint" block in worlds.css).
   Grown-ups choose when it shows, or turn it off, with "Help when stuck"
   (the `hintAfter` setting: 1 or 2 misses, or 0 for off; 2 by default). */
(() => {
'use strict';
// One pointing Lucy per world and theme (same Lucy, the world's own backdrop),
// in the order of each world's theme menu (config.js). Her paw points up-left.
const pictures = {
  post: ['post-0-airmail', 'post-1-candy', 'post-2-dark'],
  space: ['space-0-dark', 'space-1-cloud-day', 'space-2-plum-dusk'],
  silk: ['silk-0-pink', 'silk-1-purple', 'silk-2-yellow']
};
const image = () => {
  const set = pictures[window.CONCEPT?.kind];
  if (!set) return '../accounts/lucy/wave.jpg';
  return `../accounts/lucy/pointing/${set[Number(document.body?.dataset.theme)] || set[0]}.webp`;
};
// No voice line: the usual retry clip plays.
const voice = null;
// The on-screen line once Lucy points. To back it out, set this to null and the
// line stays "Try another picture." as on any other miss.
const line = 'Look where Lucy is pointing!';
// Drawn pointing down-left; worlds.css turns it up-left, the way Lucy's paw points.
const arrow = '<svg viewBox="0 0 24 24" fill="none"><path d="M17 5 7 17m0 0h8m-8 0V9" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const badge = () => `<span class="lucy-hint" aria-hidden="true"><span class="lucy-hint-photo"><img src="${image()}" alt="" draggable="false"></span><span class="lucy-hint-arrow">${arrow}</span></span>`;

// Lucy's paw and the arrow must point at the same thing: the right picture.
// Both point up-left at the same angle (the arrow sits on her ring, on her
// paw's side), so she sits below and to the right of the picture itself,
// wherever the card layout puts it, on a spot where that up-left line runs
// through the middle of the picture. Of those spots, place() keeps the one that
// covers no other picture or word, feedback line or screen edge, then covers the
// least of the drawing, then of the card's own word, then is closest. Where a
// card is too tight (Letter Post on a phone, Moonboat rows) the card's word
// steps aside just enough to clear her: left by --lucy-word-shift, or right by
// --lucy-word-pad (padding, so a row's sound icon stays at the end).
const box = node => node.getBoundingClientRect();
const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
const square = (x, y, r) => ({left: x - r, right: x + r, top: y - r, bottom: y + r});
// The ink of a word, sound icon or line, not its whole (often card-wide) box.
const ink = node => {
  const range = document.createRange();
  range.selectNodeContents(node);
  return [...range.getClientRects()];
};
function obstacles(card) {
  const out = [];
  document.querySelectorAll('.choice').forEach(other => {
    if (other === card) return;
    other.querySelectorAll('.word-picture').forEach(node => out.push(box(node)));
    other.querySelectorAll('.word').forEach(node => out.push(...ink(node)));
  });
  document.querySelectorAll('.feedback').forEach(line => out.push(...ink(line)));
  return out;
}
function place(hint) {
  const card = hint.parentElement, picture = card?.querySelector('.word-picture'), word = card?.querySelector('.word');
  const size = hint.offsetWidth;
  if (!picture || !size || !picture.offsetWidth) return;
  const pic = box(picture), px = (pic.left + pic.right) / 2, py = (pic.top + pic.bottom) / 2, edge = box(card);
  const short = Math.min(pic.width, pic.height), drawing = short * .36, ring = size / 2, area = size * size;
  // Measure the word where it sits on its own.
  card.style.removeProperty('--lucy-word-shift');
  card.style.removeProperty('--lucy-word-pad');
  const letters = word ? ink(word) : [];
  const blocked = obstacles(card), wide = document.documentElement.clientWidth, reach = Math.max(pic.width, pic.height) / 2 + size * 1.2;
  let best = null;
  for (let dx = 0; dx <= reach; dx += 3) for (let dy = 0; dy <= reach; dy += 3) {
    // How far her pointing line passes from the picture's centre.
    const miss = Math.abs(dx - dy) * Math.SQRT1_2;
    if (miss > short * .3) continue;
    const x = px + dx, y = py + dy, parts = [square(x, y, ring), square(x - size * .44, y - size * .44, size * .24)];
    const covers = blocked.reduce((sum, b) => sum + overlap(parts[0], b) + overlap(parts[1], b), 0);
    const crowds = letters.reduce((sum, b) => sum + overlap(parts[0], b) + overlap(parts[1], b), 0);
    const outside = Math.max(0, x + ring - wide + 6) * size;
    const hides = Math.max(0, drawing + ring - Math.hypot(dx, dy)) + Math.max(0, drawing + size * .24 - Math.hypot(dx - size * .44, dy - size * .44));
    const score = (covers + outside) / area * 100 + hides / size * 10 + crowds / area * 4 + miss / short * 2 + Math.hypot(dx, dy) / size * .3;
    if (!best || score < best.score) best = {score, x, y, parts};
  }
  if (!best) return;
  // Card coordinates from the picture's own offset, so a tilted or lifted card still lines up.
  let left = 0, top = 0;
  for (let n = picture; n && n !== card; n = n.offsetParent) { left += n.offsetLeft; top += n.offsetTop; }
  hint.style.left = `${left + picture.offsetWidth / 2 + best.x - px - ring}px`;
  hint.style.top = `${top + picture.offsetHeight / 2 + best.y - py - ring}px`;
  hint.style.right = hint.style.bottom = 'auto';
  // Move the word clear of her, away from her side, staying inside the card.
  const near = best.parts.filter(p => letters.some(b => overlap(p, b) > 0));
  if (!near.length) return;
  const gap = 6, text = letters[0], icons = letters.slice(1);
  if (best.x > (text.left + text.right) / 2) {
    const wordLeft = Math.min(...letters.map(b => b.left)), wordRight = Math.max(...letters.map(b => b.right));
    const shift = Math.max(Math.min(...near.map(p => p.left)) - gap - wordRight, edge.left + 12 - wordLeft);
    card.style.setProperty('--lucy-word-shift', `${Math.round(Math.min(0, shift))}px`);
  } else {
    const room = (icons.length ? Math.min(...icons.map(b => b.left)) - gap : box(word).right - 12) - text.right;
    const pad = Math.min(Math.max(...near.map(p => p.right)) + gap - text.left, room);
    card.style.setProperty('--lucy-word-pad', `${Math.round(Math.max(0, pad))}px`);
  }
}

// Keep every shown Lucy on her picture and in the current theme: when she is
// drawn (on a miss, or when the pictures come back after Listen), when the
// theme changes, and when the card changes size (rotation, resizing). Mutation
// callbacks run before the next paint, so she never shows in the wrong place.
const resized = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => entries.forEach(entry => entry.target.querySelectorAll(':scope > .lucy-hint').forEach(place))) : null;
function refresh() {
  document.querySelectorAll('.lucy-hint').forEach(hint => {
    const img = hint.querySelector('img'), src = image();
    if (img && img.getAttribute('src') !== src) img.setAttribute('src', src);
    place(hint);
    resized?.observe(hint.parentElement);
  });
}
if (typeof MutationObserver === 'function' && document.body) new MutationObserver(refresh).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-theme']});

window.LucyHint = {
  pictures, voice, line, badge, place,
  get image() { return image(); },
  // Misses before Lucy points, from the grown-ups' setting; 0 means never.
  get after() {
    const value = window.GROWN_UPS?.settings?.hintAfter;
    return [0, 1, 2].includes(value) ? value : 2;
  },
  due(misses) { return this.after > 0 && misses >= this.after; },
  show(button) {
    if (!button || button.classList.contains('lucy-hinted')) return;
    button.classList.add('lucy-hinted');
    button.insertAdjacentHTML('beforeend', badge());
  }
};
})();
