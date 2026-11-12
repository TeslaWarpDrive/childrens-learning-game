/* Lucy's pointing hint, shared by every world: after two misses on one
   prompt, Lucy points to the right picture. It never changes scoring,
   progress or sound; reduced motion and the grown-ups' calm setting get a
   still highlight (see the "Lucy's pointing hint" block in worlds.css).
   Grown-ups choose when it shows, or turn it off, with "Help when stuck"
   (the `hintAfter` setting: 1 or 2 misses, or 0 for off; 2 by default). */
(() => {
'use strict';
// TEMPORARY placeholder: an existing Lucy photo (her raised-paw wave), pending
// Bradley's pick of a generated "Lucy pointing" image. Swap only this path.
const image = '../accounts/lucy/wave.jpg';
// No voice line: the usual retry clip plays.
const voice = null;
// The on-screen line once Lucy points. To back it out, set this to null and the
// line stays "Try another picture." as on any other miss.
const line = 'Look where Lucy is pointing!';
const arrow = '<svg viewBox="0 0 24 24" fill="none"><path d="M17 5 7 17m0 0h8m-8 0V9" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const badge = () => `<span class="lucy-hint" aria-hidden="true"><span class="lucy-hint-photo"><img src="${image}" alt="" draggable="false"></span><span class="lucy-hint-arrow">${arrow}</span></span>`;
window.LucyHint = {
  image, voice, line, badge,
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
