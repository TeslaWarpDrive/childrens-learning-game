(() => {
'use strict';
if (location.protocol === 'file:') return;
const base=new URL('../',document.currentScript.src), A=window.ACCOUNTS;
const isHome=document.body.dataset.page==='home';
const isAdmin=location.pathname.includes('/accounts/')||location.pathname.includes('/grown-ups/');
if(isAdmin){
  const existing=document.getElementById('sign-out');
  const button=existing||document.createElement('button');
  button.id='sign-out';button.type='button';button.className='quiet-button auth-signout';button.textContent='Sign out';
  document.querySelector('.masthead')?.append(button);
  const update=()=>{button.hidden=!A.profile;};
  if(!existing)button.addEventListener('click',async()=>{button.disabled=true;await A.signOutFrom('portal');});
  A.subscribe(update);A.ready.then(update).catch(()=>{});update();
  if(new URL(location.href).searchParams.has('expired')){
    const note=document.createElement('p');note.className='notice';note.setAttribute('role','status');note.textContent='Signed out for safety. Please sign in again.';document.querySelector('main')?.prepend(note);
  }
}
if(!isHome&&!isAdmin){
  const strip=document.createElement('aside');strip.id='account-strip';strip.setAttribute('aria-label','Your account');
  const menu=document.createElement('details'),avatar=document.createElement('summary'),items=document.createElement('div');items.className='account-menu';
  avatar.setAttribute('aria-label','Open your profile');
  const name=document.createElement('strong'),link=document.createElement('a'),portal=document.createElement('a'),settings=document.createElement('a'),done=document.createElement('button');
  link.href=new URL('accounts/index.html',base).href;link.textContent='Profile and progress';
  portal.href=new URL('accounts/index.html#kids',base).href;portal.textContent='Grown-up portal';portal.hidden=true;
  settings.href=new URL('grown-ups/index.html',base).href;settings.textContent='Game settings';done.type='button';done.textContent='👋 Sign out';
  items.append(name,link,settings,done);menu.append(avatar,items);
  const guestLink=document.createElement('a');guestLink.href=new URL('index.html',base).href;guestLink.textContent='Sign in to save';
  strip.append(menu,guestLink);
  function render(){
    menu.hidden=!A.profile;guestLink.hidden=Boolean(A.profile);
    name.textContent=A.profile?.display_name||'';
    if(A.profile?.role==='grownup'){items.insertBefore(portal,settings);portal.hidden=false;}else{portal.hidden=true;portal.remove();}
    link.href=new URL('accounts/index.html'+(A.profile?.role==='grownup'?'#account':''),base).href;
    avatar.replaceChildren();
    const img=document.createElement('img');img.src=A.profile?.avatar?.startsWith('data:image/')?A.profile.avatar:new URL('accounts/lucy/garden.jpg',base).href;img.alt='';avatar.append(img);
  }
  function place(){const header=document.querySelector('#header'),controls=header.querySelector('.controls');if(controls&&!header.contains(strip)){const group=document.createElement('div');group.className='player-controls';controls.replaceWith(group);group.append(controls,strip);}}
  new MutationObserver(place).observe(document.querySelector('#header'),{childList:true,subtree:true});place();
  const close=()=>{menu.open=false;};
  new MutationObserver(close).observe(document.querySelector('#main'),{childList:true});
  document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target))close();});
  document.addEventListener('click',event=>{if(!menu.contains(event.target)||event.target.closest('a'))close();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){close();avatar.focus();}});
  window.addEventListener('pagehide',close);
  done.addEventListener('click',async()=>{done.disabled=true;await A.signOutFrom('game-menu');});
  A.subscribe(render);A.ready.then(render).catch(()=>{});render();
}
const connection=document.createElement('p');
connection.className='connection-notice';connection.setAttribute('role','status');
connection.textContent='Connection lost. Letters with Lucy needs the internet. Reconnect to continue and save your progress.';
(isHome?document.querySelector('#login-dialog .panel'):document.querySelector('.app, .page'))?.prepend(connection);
const showConnection=()=>{
  if(isHome)(document.body.dataset.homeStep==='layouts'?document.querySelector('main'):document.querySelector('#login-dialog .panel'))?.prepend(connection);
  connection.hidden=navigator.onLine;
};
document.addEventListener('home:layouts',showConnection);
document.addEventListener('home:login',showConnection);
window.addEventListener('online',showConnection);window.addEventListener('offline',showConnection);showConnection();
// Update only this game's old registration so existing devices retire its cache too.
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistration(base.href).then(registration=>{
    if(registration?.scope===base.href)return registration.update();
  }).catch(()=>{});
}
})();
