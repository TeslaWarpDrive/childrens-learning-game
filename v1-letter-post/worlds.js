/* Letters with Lucy: each world's paper ground.
   Purely decorative and static: two torn paper bands along the bottom of every world,
   an airmail edge for Letter Post and pinprick stars for Moonboat. Colours come from
   the world's own palette in worlds.css. It never touches game state, sound or saved data. */
(() => {
'use strict';
const world = document.querySelector('.world');
if (!world || world.querySelector('.fx')) return;
const body = document.body;
const kind = body.classList.contains('silk') ? 'silk' : body.classList.contains('space') ? 'space' : 'post';
const fx = document.createElement('div');
fx.className = 'fx';
const layer = cls => { const node = document.createElement('i'); node.className = cls; fx.append(node); };
if (kind === 'post') layer('fx-airmail');
if (kind === 'space') layer('fx-pins');
layer('fx-band far');
layer('fx-band near');
world.append(fx);
})();
