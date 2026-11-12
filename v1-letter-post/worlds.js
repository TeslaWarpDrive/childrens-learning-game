/* Letters with Lucy: world scenery and pointer effects.
   Purely decorative. It builds each world's sky inside the existing .world layer,
   adds gentle pointer parallax, and tilts picture cards toward the mouse.
   It never touches game state, sound or saved data. Reduced motion and the
   grown-ups' calm setting leave the scenery standing still. */
(() => {
'use strict';
const body=document.body, world=document.querySelector('.world');
if(!world)return;
const kind=body.classList.contains('silk')?'silk':body.classList.contains('space')?'space':'post';
const reduce=matchMedia('(prefers-reduced-motion: reduce)'), fine=matchMedia('(hover: hover) and (pointer: fine)');
const moving=()=>!reduce.matches&&!('calm' in document.documentElement.dataset);
const small=innerWidth<640;
let seed=11;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
const el=(tag,cls,style)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(style)n.style.cssText=style;return n;};

const fx=el('div','fx');
const depth=(d,...children)=>{const layer=el('div','fx-depth','--d:'+d+'px');layer.append(...children);fx.append(layer);return layer;};
depth(-10,el('div','fx-glow g1'),el('div','fx-glow g2'));

if(kind==='silk'){
  const ribbons=el('div','fx-ribbons');
  const paths=['M0 60C120 10 220 110 360 60S600 0 760 50 1000 120 1200 40','M0 50C160 110 260 0 420 50S700 110 860 40 1080 0 1200 60','M0 70C140 20 300 100 460 50S720 0 900 60 1100 110 1200 40'];
  paths.forEach((d,i)=>{
    const colorA=i===1?'var(--ribbon-3)':'var(--ribbon-1)';
    ribbons.insertAdjacentHTML('beforeend',`<svg viewBox="0 0 1200 120" preserveAspectRatio="none" style="opacity:${[.38,.26,.2][i]}"><path d="${d}" stroke="var(--ribbon-2)" stroke-opacity=".75" stroke-width="${[46,34,28][i]}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${colorA}" stroke-width="${[18,14,11][i]}" stroke-linecap="round" fill="none"/><path class="flow" d="${d}" stroke="#fff" stroke-width="3" stroke-dasharray="2 22" stroke-linecap="round" fill="none"/></svg>`);
  });
  depth(16,ribbons);
  const bokeh=el('div','fx-bokeh');bokeh.style.inset='0';
  for(let i=0;i<(small?7:13);i++){const s=18+rand()*70;bokeh.append(el('i','',`left:${rand()*96}%;top:${rand()*92}%;width:${s}px;height:${s}px;opacity:${(.25+rand()*.5).toFixed(2)};--t:${(7+rand()*8).toFixed(1)}s;--dl:${(-rand()*8).toFixed(1)}s;--fx:${Math.round((rand()-.5)*40)}px;--fy:${Math.round(-10-rand()*40)}px`));}
  depth(28,bokeh);
}
if(kind==='post'){
  const sky=el('div');sky.style.inset='0';
  for(let i=0;i<(small?4:7);i++){const w=140+rand()*260;sky.append(el('div','fx-cloud',`top:${4+rand()*70}%;left:0;--w:${Math.round(w)}px;--o:${(.45+rand()*.45).toFixed(2)};--t:${Math.round(70+rand()*80)}s;--dl:${(-rand()*140).toFixed(1)}s`));}
  depth(12,sky);
  const route=el('div','fx-route');
  route.innerHTML='<svg viewBox="0 0 1200 800" preserveAspectRatio="none" style="width:100%;height:100%"><path d="M-40 640C200 420 420 720 640 500S1000 180 1260 260"/><path d="M-40 260C240 120 480 320 760 200S1080 60 1260 120"/></svg>';
  depth(6,route);
  const mail=el('div');mail.style.inset='0';
  const envelope='<svg viewBox="0 0 46 32"><rect x="2" y="2" width="42" height="28" rx="4" fill="#fffdf6" stroke="var(--route)" stroke-width="2.5"/><path d="M3 4l20 14L43 4" stroke="var(--route)" stroke-width="2.5" fill="none" stroke-linejoin="round"/><rect x="32" y="6" width="8" height="9" rx="1" fill="var(--dot)"/></svg>';
  [['70vh','38vh','12vh',22,0],['30vh','12vh','4vh',28,-14]].slice(0,small?1:2).forEach(([y0,y1,y2,t,dl])=>{const m=el('div','fx-mail',`--y0:${y0};--y1:${y1};--y2:${y2};--t:${t}s;--dl:${dl}s`);m.innerHTML=envelope;mail.append(m);});
  depth(22,mail);
  depth(-6,el('div','fx-stars night'));
}
if(kind==='space'){
  depth(-8,el('div','fx-stars'));
  depth(-18,el('div','fx-stars near'));
  const aurora=el('div','fx-aurora');
  [['6vw',-22,'rgb(140 130 255/.22)','22vw',17],['34vw',-10,'rgb(127 243 225/.14)','12vw',13],['60vw',12,'rgb(255 150 200/.16)','24vw',19],['84vw',26,'rgb(140 130 255/.18)','16vw',15]].forEach(([l,a,c,w,t])=>aurora.append(el('i','',`--l:${l};--a:${a}deg;--c:${c};--w:${w};--t:${t}s`)));
  depth(10,aurora);
  const planets=el('div');planets.style.inset='0';
  planets.append(el('i','fx-planet',`right:6%;top:14%;--s:${small?46:84}px;--c:#a9b1ff;--t:14s`),el('i','fx-planet',`left:4%;bottom:12%;--s:${small?30:52}px;--c:#ffb38f;--t:11s;--fy:20px`));
  depth(30,planets);
  for(let i=0;i<(small?1:3);i++)fx.append(el('i','fx-shoot',`left:${60+rand()*35}%;top:${5+rand()*30}%;--dl:${(i*3.1).toFixed(1)}s`));
}
fx.append(el('div','fx-grain'));
const spot=el('div','fx-spot');fx.append(spot);
world.append(fx);
if(kind==='post'){const night=fx.querySelector('.fx-stars');const sync=()=>{night.style.display=body.dataset.theme==='2'?'':'none';};sync();new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['data-theme']});}

// Pointer parallax and a soft light under the mouse.
let frame=0,pointer=null;
const paint=()=>{frame=0;if(!pointer)return;fx.style.setProperty('--mx',(pointer.x/innerWidth-.5).toFixed(3));fx.style.setProperty('--my',(pointer.y/innerHeight-.5).toFixed(3));spot.style.transform=`translate3d(${pointer.x}px,${pointer.y}px,0)`;};
addEventListener('pointermove',event=>{if(!moving()||event.pointerType!=='mouse')return;pointer={x:event.clientX,y:event.clientY};fx.classList.add('lit');if(!frame)frame=requestAnimationFrame(paint);},{passive:true});
document.addEventListener('pointerleave',()=>fx.classList.remove('lit'));

// Picture cards lean toward the pointer, with a glare that follows it.
let tiltFrame=0,tilt=null;
document.addEventListener('pointermove',event=>{
  if(!moving()||!fine.matches||event.pointerType!=='mouse')return;
  const card=event.target.closest?.('.choice');
  if(tilt&&tilt.card!==card)reset(tilt.card);
  if(!card){tilt=null;return;}
  tilt={card,x:event.clientX,y:event.clientY};
  if(!tiltFrame)tiltFrame=requestAnimationFrame(()=>{tiltFrame=0;if(!tilt)return;const box=tilt.card.getBoundingClientRect(),x=(tilt.x-box.left)/box.width,y=(tilt.y-box.top)/box.height;
    tilt.card.style.setProperty('--rx',((.5-y)*8).toFixed(2)+'deg');tilt.card.style.setProperty('--ry',((x-.5)*10).toFixed(2)+'deg');
    tilt.card.style.setProperty('--gx',(x*100).toFixed(1)+'%');tilt.card.style.setProperty('--gy',(y*100).toFixed(1)+'%');});
},{passive:true});
function reset(card){if(!card)return;card.style.removeProperty('--rx');card.style.removeProperty('--ry');}
})();
