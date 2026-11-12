/* Decorative motion for the sign-in and world picker. Nothing here touches
   accounts or saved data. Every effect checks reduced motion and the grown-ups'
   calm setting first, and everything still renders as a still scene without it. */
(() => {
'use strict';
const root=document.documentElement, body=document.body;
const sky=document.getElementById('sky'), lanterns=document.getElementById('lanterns'), bloom=document.getElementById('bloom');
const picker=document.getElementById('layout-picker'), dialog=document.getElementById('login-dialog');
const reduce=matchMedia('(prefers-reduced-motion: reduce)'), finePointer=matchMedia('(hover: hover) and (pointer: fine)');
const moving=()=>!reduce.matches&&!('calm' in root.dataset);

// Rising letter lanterns: fewer on small screens, placed so the sky is full from the first frame.
(function makeLanterns(){
  const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ', count=innerWidth<600?9:innerWidth<1100?14:18;
  let seed=7;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const frag=document.createDocumentFragment();
  for(let i=0;i<count;i++){
    const near=rand(), span=document.createElement('span'), duration=34+rand()*26;
    span.className='lantern';span.textContent=letters[Math.floor(rand()*26)];
    // When the sky stands still, keep letters in the side margins so none rests on the words.
    const x=moving()?(i+.15+rand()*.7)/count*100:(i%2?74+rand()*23:2+rand()*23);
    span.style.cssText=`--x:${x.toFixed(1)}%;--y:${8+rand()*80}vh;--s:${Math.round(15+near*36)}px;--o:${(.12+near*.3).toFixed(2)};--t:${duration.toFixed(1)}s;--d:${(-rand()*duration).toFixed(1)}s;--sw:${Math.round((rand()-.5)*80)}px`;
    frag.append(span);
  }
  lanterns.append(frag);
})();

// Soft light that follows the pointer and gentle depth on the sky layers.
const spot=document.createElement('div');spot.className='spot';sky.append(spot);
let frame=0, pointer=null;
function paintSky(){
  frame=0;if(!pointer)return;
  sky.style.setProperty('--mx',(pointer.x/innerWidth-.5).toFixed(3));
  sky.style.setProperty('--my',(pointer.y/innerHeight-.5).toFixed(3));
  spot.style.transform=`translate3d(${pointer.x}px,${pointer.y}px,0)`;
}
addEventListener('pointermove',event=>{
  if(!moving()||event.pointerType!=='mouse')return;
  pointer={x:event.clientX,y:event.clientY};sky.classList.add('lit');
  if(!frame)frame=requestAnimationFrame(paintSky);
},{passive:true});
document.addEventListener('pointerleave',()=>sky.classList.remove('lit'));

// World windows tilt toward the pointer, and their scene layers shift by depth.
for(const card of picker.querySelectorAll('.world')){
  let raf=0, last=null;
  const paint=()=>{
    raf=0;if(!last)return;
    const box=card.getBoundingClientRect(), x=(last.x-box.left)/box.width, y=(last.y-box.top)/box.height;
    card.style.setProperty('--rx',((.5-y)*9).toFixed(2)+'deg');
    card.style.setProperty('--ry',((x-.5)*11).toFixed(2)+'deg');
    card.style.setProperty('--gx',(x*100).toFixed(1)+'%');
    card.style.setProperty('--gy',(y*100).toFixed(1)+'%');
    card.style.setProperty('--tx',((x-.5)*2).toFixed(3));
    card.style.setProperty('--ty',((y-.5)*2).toFixed(3));
  };
  card.addEventListener('pointermove',event=>{
    if(!moving()||!finePointer.matches||event.pointerType!=='mouse')return;
    last={x:event.clientX,y:event.clientY};if(!raf)raf=requestAnimationFrame(paint);
  },{passive:true});
  card.addEventListener('pointerleave',()=>{last=null;for(const name of ['--rx','--ry','--tx','--ty'])card.style.removeProperty(name);});
}

// Cards rise in one after another, and further cards wait until they scroll into view.
const seen=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('seen');seen.unobserve(entry.target);}
},{rootMargin:'0px 0px -8% 0px',threshold:.12});
function revealWorlds(){
  const cards=[...picker.querySelectorAll('.world')];
  seen.disconnect();
  if(!moving()){picker.classList.remove('reveal');cards.forEach(card=>card.classList.add('seen'));return;}
  cards.forEach(card=>card.classList.remove('seen'));
  picker.classList.add('reveal');void picker.offsetWidth;
  cards.forEach(card=>seen.observe(card));
}
function arrive(){
  revealWorlds();
  if(!moving())return;
  bloom.classList.remove('go');void bloom.offsetWidth;bloom.classList.add('go');
}
document.addEventListener('home:layouts',arrive);
if(body.dataset.homeStep==='layouts')revealWorlds();

// A tap on open sky sends up a little shower of letters.
const burst=document.createElement('div');burst.className='burst';burst.setAttribute('aria-hidden','true');body.append(burst);
const colors=['#ffd36e','#ff9cc8','#7ff3e1','#c9b8ff','#fff4dc'];
document.addEventListener('pointerdown',event=>{
  if(!moving()||burst.childElementCount>40)return;
  const onSky=event.target===dialog||(body.dataset.homeStep==='layouts'&&!event.target.closest('a,button,input,label,p,h1,.world,.site-brand'));
  if(!onSky)return;
  for(let i=0;i<7;i++){
    const piece=document.createElement('b'), angle=(i/7)*Math.PI*2+Math.random()*.6, reach=60+Math.random()*70;
    piece.textContent=i%3===0?'★':'LUCYABC'[i];
    piece.style.cssText=`--x:${event.clientX}px;--y:${event.clientY}px;--dx:${Math.cos(angle)*reach}px;--dy:${Math.sin(angle)*reach-30}px;--rot:${Math.round((Math.random()-.5)*90)}deg;--c:${colors[i%colors.length]};--s:${18+Math.round(Math.random()*16)}px`;
    piece.addEventListener('animationend',()=>piece.remove(),{once:true});
    burst.append(piece);
  }
});
})();
