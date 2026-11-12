/* Lucy's pointing hint, shared by every world: after two misses on one
   prompt, Lucy points to the right picture. It never changes scoring,
   progress or sound; reduced motion and the grown-ups' calm setting get a
   still highlight (see the "Lucy's pointing hint" block in worlds.css). */
(() => {
'use strict';
// TEMPORARY placeholder: an existing Lucy photo (her raised-paw wave), pending
// Bradley's pick of a generated "Lucy pointing" image. Swap only this path.
const image = '../accounts/lucy/wave.jpg';
// AUDIO NEEDED: no hint voice line yet. While this is null the usual retry clip plays.
const voice = null;
const arrow = '<svg viewBox="0 0 24 24" fill="none"><path d="M17 5 7 17m0 0h8m-8 0V9" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const badge = () => `<span class="lucy-hint" aria-hidden="true"><span class="lucy-hint-photo"><img src="${image}" alt="" draggable="false"></span><span class="lucy-hint-arrow">${arrow}</span></span>`;
window.LucyHint = {
  after: 2, image, voice, badge,
  show(button) {
    if (!button || button.classList.contains('lucy-hinted')) return;
    button.classList.add('lucy-hinted');
    button.insertAdjacentHTML('beforeend', badge());
  }
};
})();
