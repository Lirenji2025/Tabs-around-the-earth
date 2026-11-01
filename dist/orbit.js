import * as THREE from './assets/three.module.js';
import {defaults,previewHTML,escapeHTML as esc} from './previews.js';
import {normalizeState,entities,members,groupTogether,dissolveGroup,detachCard,removeEntity,togglePin,toggleFavorite,spawnFavorite,searchTarget,rowPositions,uid,reconcile} from './model.js';
import {OrbitAudio} from './audio.js';
import {createGlobe} from './globe.js';
import {planets} from './planets.js';
import {ConstellationTrail} from './trail.js';

const $=s=>document.querySelector(s),clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const STORAGE='orbit-earth-prototype-v2';
let saved=null;try{saved=JSON.parse(localStorage.getItem(STORAGE)||localStorage.getItem('orbit-earth-prototype-v1')||'null');}catch{}
let state=normalizeState(saved,defaults.map(c=>({...c,kind:c.id})));
state.cards.forEach(c=>{if(!c.kind&&defaults.some(d=>d.id===c.id))c.kind=c.id;});
let reduced=state.preferences.reducedMotion??matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio=new OrbitAudio(state.preferences.sound),globe=createGlobe(message=>toast(message));
const views=new Map(),layer=$('#card-layer');
const trail=new ConstellationTrail($('#constellation-trail'));
let hovered=null,focused=null,contextId=null,openGroup=null,groupSource=null;
let rowTarget=false,rowBlend=0,yaw=.36,targetYaw=.36,pitch=-.04,targetPitch=-.04,speed=.035;
let busy=false,flight=null,birth=null,closing=null,activeDestination=null,entering=null,lastClosed=null;
let pulse=null,elapsed=0,lastFrame=performance.now(),toastTimer,favoriteTimer,suppressClickUntil=0;
let dwellTimer;
let settingsTab='preferences',menuStage='main',width=innerWidth,height=innerHeight;
const drag={pending:false,active:false,settling:false,id:null,x:0,y:0,startX:0,startY:0,target:null,since:0,pointerId:null};
const worldDrag={active:false,moved:false,x:0,y:0};

function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{}}
function toast(message,undo=false){clearTimeout(toastTimer);$('#toast-message').textContent=message;$('#toast-undo').hidden=!undo;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,undo?7000:3500);}
function setStatus(text='YOUR PERSONAL ORBIT'){$('#orbit-status').textContent=text;}
function entity(id){return entities(state).find(e=>e.id===id)||state.cards.find(c=>c.id===id);}
function favorite(card){return state.favorites.some(c=>c.url===card.url);}
function chip(card){return `<span class="card-favicon" style="--site-color:${card.color}">${esc(card.symbol||'↗')}</span>`;}
function metadataChanged(){persist();syncViews();renderFavorites();if(!$('#settings-panel').hidden)renderManagement();}
function syncViews(){
  const desired=entities(state);
  if(openGroup){const group=state.groups.find(g=>g.id===openGroup);if(!group){openGroup=null;updateGroupCaption();}else desired.push(...members(state,openGroup).map(c=>({...c,type:'card',expanded:true})));}
  const ids=new Set(desired.map(e=>e.id));
  for(const [id,view] of views)if(!ids.has(id)){view.node.remove();views.delete(id);}
  for(const e of desired){
    let view=views.get(e.id);
    if(!view){const node=document.createElement('article');node.dataset.id=e.id;node.tabIndex=0;node.setAttribute('role','button');layer.append(node);view={node,x:width/2,y:height*.46,scale:.55,alpha:0,entity:e,manualZoom:1,bounce:0,bounceVelocity:0};views.set(e.id,view);attachEntityEvents(node,e.id);}
    view.entity=e;
    const n=view.node;n.className=`entity ${e.type==='group'?'orbit-group':'tab-card'}${e.pinned?' is-pinned':''}`;
    n.setAttribute('aria-label',e.type==='group'?`展开星群 ${e.name}，${e.members.length} 个网页`:`进入 ${e.title}，右键管理`);
    if(e.type==='group')n.innerHTML=`<span class="group-halo"></span><span class="group-pin ${e.pinned?'is-visible':''}">◆</span><div class="group-avatars">${e.members.slice(0,3).map(chip).join('')}</div><span class="group-name">${esc(e.name)}</span><span class="group-count">${e.members.length} WORLDS</span>`;
    else n.innerHTML=`<div class="card-top">${chip(e)}<span class="card-title">${esc(e.title)}</span><span class="pin-indicator" title="已置顶">◆</span><button class="card-close" title="关闭标签页" aria-label="关闭 ${esc(e.title)}">×</button></div>${previewHTML(e,state.preferences.engine)}<div class="card-hover-caption"><span class="card-domain">${esc(e.domain||'')}</span><span>${favorite(e)?'★ ':''}进入 ↗</span></div>`;
    n.querySelector('.card-close')?.addEventListener('click',ev=>{ev.stopPropagation();closeEntity(e.id);});
  }
  $('#tab-count').textContent=state.cards.length;
}
function attachEntityEvents(node,id){
  node.addEventListener('pointerenter',()=>{if(busy||drag.active)return;if(hovered!==id)audio.play('hover');hovered=id;});
  node.addEventListener('pointerleave',()=>{if(hovered===id&&!drag.active)hovered=null;});
  node.addEventListener('focusin',()=>{if(!busy){focused=id;audio.play('hover');}});
  node.addEventListener('focusout',ev=>{if(!node.contains(ev.relatedTarget)&&focused===id)focused=null;});
  node.addEventListener('pointerdown',ev=>{
    if(ev.button!==0||busy||ev.target.closest('button'))return;ev.stopPropagation();audio.unlock();closeMenu();
    Object.assign(drag,{pending:true,active:false,settling:false,id,x:ev.clientX,y:ev.clientY,startX:ev.clientX,startY:ev.clientY,target:null,since:0,pointerId:ev.pointerId});
    node.setPointerCapture(ev.pointerId);
  });
  node.addEventListener('click',ev=>{
    if(ev.target.closest('button')||performance.now()<suppressClickUntil||busy)return;
    if(groupSource){if(groupSource!==id)merge(groupSource,id);return;}
    const e=entity(id);if(e?.type==='group')expandGroup(id);else enterCard(id);
  });
  node.addEventListener('contextmenu',ev=>{ev.preventDefault();ev.stopPropagation();if(busy)return;cancelDrag();audio.unlock();hovered=id;showMenu(id,ev.clientX,ev.clientY);});
  node.addEventListener('keydown',ev=>{
    if(ev.target!==node)return;
    if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();if(groupSource&&groupSource!==id)merge(groupSource,id);else if(entity(id)?.type==='group')expandGroup(id);else enterCard(id);}
    if(ev.key==='Delete'){ev.preventDefault();closeEntity(id);}
    if(ev.key==='ContextMenu'||ev.shiftKey&&ev.key==='F10'){ev.preventDefault();const r=node.getBoundingClientRect();showMenu(id,r.x+r.width/2,r.y+r.height/2);}
  });
}
function cancelDrag(){
  clearTimeout(dwellTimer);
  $('#favorites-button').classList.remove('favorite-drop-target');
  for(const v of views.values()){v.node.classList.remove('is-dragging','drop-target');v.node.style.removeProperty('--dwell');}
  Object.assign(drag,{pending:false,active:false,settling:false,id:null,target:null,since:0});
}
document.addEventListener('pointermove',ev=>{
  if(!drag.pending)return;
  if(drag.settling){const stillOver=drag.target==='@favorites'?overFavorites(ev.clientX,ev.clientY):document.elementsFromPoint(ev.clientX,ev.clientY).some(n=>n.closest?.('.entity')?.dataset.id===drag.target);if(!stillOver){cancelDrag();hovered=null;setStatus();}return;}
  drag.x=ev.clientX;drag.y=ev.clientY;
  if(!drag.active&&Math.hypot(drag.x-drag.startX,drag.y-drag.startY)>6){drag.active=true;hovered=drag.id;focused=null;views.get(drag.id)?.node.classList.add('is-dragging');setStatus('HOLD TO CONNECT · 0.5 SECONDS');}
  if(!drag.active)return;
  const target=overFavorites(ev.clientX,ev.clientY)?'@favorites':document.elementsFromPoint(ev.clientX,ev.clientY).map(n=>n.closest?.('.entity')).find(n=>n&&n.dataset.id!==drag.id&&Number(n.style.opacity)>.15)?.dataset.id||null;
  if(target!==drag.target){$('#favorites-button').classList.remove('favorite-drop-target');if(drag.target)views.get(drag.target)?.node.classList.remove('drop-target');drag.target=target;drag.since=performance.now();clearTimeout(dwellTimer);if(target)dwellTimer=setTimeout(()=>{if(drag.active&&drag.target===target){if(target==='@favorites')collectDragged();else merge(drag.id,target);}},500);}
});
document.addEventListener('pointerup',()=>{if(!drag.pending)return;const moved=drag.active;if(moved&&drag.target){drag.settling=true;suppressClickUntil=performance.now()+850;return;}cancelDrag();if(moved){suppressClickUntil=performance.now()+350;hovered=null;setStatus();}});
document.addEventListener('pointercancel',()=>{cancelDrag();setStatus();});

function overFavorites(x,y){
  const r=$('#favorites-button').getBoundingClientRect();return x>=r.left-12&&x<=r.right+12&&y>=r.top-12&&y<=r.bottom+12;
}
function collectDragged(){
  const list=members(state,drag.id);let added=0;
  for(const c of list)if(!favorite(c)){toggleFavorite(state,c.id);added++;}
  cancelDrag();hovered=focused=null;suppressClickUntil=performance.now()+700;metadataChanged();audio.play('magnet');
  $('#favorites-button').animate([{filter:'brightness(1)',transform:'scale(1)'},{filter:'brightness(3)',transform:'scale(1.3)'},{filter:'brightness(1)',transform:'scale(1)'}],{duration:500});
  toast(added?`已收藏 ${added} 个网页`:'已在收藏夹中');setStatus();
}
function merge(source,target){
  if(busy||source===target)return;
  const a=views.get(source),b=views.get(target);const point=b?{x:b.x,y:b.y}:{x:width/2,y:height*.45};
  const groupId=groupTogether(state,source,target);if(!groupId)return;
  cancelDrag();suppressClickUntil=performance.now()+450;groupSource=null;$('#grouping-banner').hidden=true;closeMenu();openGroup=null;updateGroupCaption();
  audio.play('magnet');magnetRing(point.x,point.y);metadataChanged();hovered=groupId;focused=null;
  const view=views.get(groupId);if(view){view.x=point.x;view.y=point.y;view.scale=.65;}
  setStatus();toast(`已吸附为「${state.groups.find(g=>g.id===groupId).name}」`);
  setTimeout(()=>{if(hovered===groupId)hovered=null;},1100);
}
function magnetRing(x,y){
  const ring=document.createElement('i');ring.className='electromagnet-ring';Object.assign(ring.style,{left:x-90+'px',top:y-90+'px',width:'180px',height:'180px'});$('#flight-layer').append(ring);
  ring.animate([{opacity:0,transform:'scale(1.6)'},{opacity:.9,transform:'scale(.72)',offset:.38},{opacity:0,transform:'scale(1.18)'}],{duration:reduced?120:800,easing:'ease-out',fill:'forwards'}).finished.then(()=>ring.remove());
}
function expandGroup(id){
  if(busy)return;closeMenu();cancelGrouping();openGroup=id;hovered=focused=null;audio.play('birth');updateGroupCaption();syncViews();
  const origin=views.get(id);for(const c of members(state,id)){const v=views.get(c.id);if(v){v.x=origin?.x??width/2;v.y=origin?.y??height*.45;v.scale=.2;v.alpha=0;}}
}
function collapseGroup(){if(!openGroup)return;openGroup=null;hovered=focused=null;updateGroupCaption();syncViews();audio.play('return');}
function updateGroupCaption(){const g=state.groups.find(g=>g.id===openGroup);$('#group-caption').hidden=!g;document.body.classList.toggle('group-open',!!g);if(g)$('#group-title').textContent=g.name;}
$('#collapse-group').addEventListener('click',collapseGroup);

function showMenu(id,x,y){
  contextId=id;menuStage='main';hovered=id;renderMenu();const menu=$('#context-menu');menu.hidden=false;
  menu.style.left=clamp(x,10,width-245)+'px';menu.style.top=clamp(y,12,height-menu.offsetHeight-12)+'px';
  menu.querySelector('button')?.focus({preventScroll:true});
}
function closeMenu(){contextId=null;$('#context-menu').hidden=true;}
function renderMenu(){
  const e=entity(contextId);if(!e){closeMenu();return;}const title=e.type==='group'?e.name:e.title,menu=$('#context-menu');
  if(menuStage==='group'){
    const targets=entities(state).filter(t=>t.id!==contextId&&!members(state,t.id).some(c=>members(state,contextId).some(s=>s.id===c.id)));
    menu.innerHTML=`<button class="context-back" data-menu="back">← 返回菜单</button><div class="context-heading">将 ${esc(title)} 与…建组</div><div class="group-target-list">${targets.map(t=>`<button data-group-target="${t.id}">${t.type==='group'?'<span>◉</span>':chip(t)}${esc(t.name||t.title)}</button>`).join('')||'<p class="empty-state">暂时没有其他卡片</p>'}</div><button data-menu="pick">✦ 在轨道上选择另一张</button>`;
  }else{
    const pinned=members(state,contextId).every(c=>c.pinned),isGroup=e.type==='group';
    menu.innerHTML=`<div class="context-heading">${esc(title)}${isGroup?` · ${e.members.length} 个网页`:''}</div><button data-menu="group">◉ 与其他标签页建组 <span>›</span></button>${!isGroup?`<button data-menu="favorite">${favorite(e)?'★ 移出收藏夹':'☆ 加入收藏夹'}</button>`:''}<button data-menu="pin">${pinned?'◇ 取消置顶':'◆ 置顶网页'}<span>横列右端</span></button>${isGroup?'<button data-menu="expand">↗ 展开星群</button><button data-menu="dissolve">⤢ 解散星群，保留网页</button>':e.groupId?'<button data-menu="detach">⤢ 移出当前星群</button>':''}<div class="menu-divider"></div><button data-menu="close" class="danger-action">× ${isGroup?'关闭整个星群':'关闭标签页'}</button>`;
  }
}
$('#context-menu').addEventListener('click',ev=>{
  const target=ev.target.closest('[data-group-target]');if(target){merge(contextId,target.dataset.groupTarget);return;}
  const action=ev.target.closest('[data-menu]')?.dataset.menu,id=contextId;if(!action||!id)return;
  if(action==='group'||action==='back'){menuStage=action==='group'?'group':'main';renderMenu();const m=$('#context-menu');m.style.top=clamp(parseFloat(m.style.top),12,height-m.offsetHeight-12)+'px';return;}
  if(action==='pick'){groupSource=id;$('#grouping-banner').hidden=false;closeMenu();return;}
  if(action==='favorite'){const added=toggleFavorite(state,id);metadataChanged();toast(added?'已加入收藏夹':'已移出收藏夹');}
  if(action==='pin'){const pinned=togglePin(state,id);metadataChanged();toast(pinned?'已置顶 · 横列右端完整显示':'已取消置顶');}
  if(action==='expand')expandGroup(id);
  if(action==='dissolve'){dissolveGroup(state,id);if(openGroup===id){openGroup=null;updateGroupCaption();}metadataChanged();toast('星群已解散，网页已回到轨道');}
  if(action==='detach'){detachCard(state,id);if(!state.groups.some(g=>g.id===openGroup)){openGroup=null;updateGroupCaption();}metadataChanged();toast('已移出星群');}
  if(action==='close')closeEntity(id);
  closeMenu();
});
function cancelGrouping(){groupSource=null;$('#grouping-banner').hidden=true;}
$('#cancel-grouping').addEventListener('click',cancelGrouping);

const universe=$('#universe');
universe.addEventListener('pointerdown',ev=>{
  if(ev.target.closest('.entity')||ev.button!==0||busy)return;closeMenu();audio.unlock();hovered=focused=null;worldDrag.active=true;worldDrag.moved=false;worldDrag.x=ev.clientX;worldDrag.y=ev.clientY;universe.setPointerCapture(ev.pointerId);universe.classList.add('dragging');
});
universe.addEventListener('pointermove',ev=>{
  if(!worldDrag.active)return;const dx=ev.clientX-worldDrag.x,dy=ev.clientY-worldDrag.y;if(Math.abs(dx)+Math.abs(dy)>2)worldDrag.moved=true;
  targetYaw+=dx*.006;targetPitch=clamp(targetPitch+dy*.003,-.55,.55);worldDrag.x=ev.clientX;worldDrag.y=ev.clientY;
});
universe.addEventListener('pointerup',()=>{if(worldDrag.active&&!worldDrag.moved&&openGroup)collapseGroup();worldDrag.active=false;universe.classList.remove('dragging');});
universe.addEventListener('pointercancel',()=>{worldDrag.active=false;universe.classList.remove('dragging');});
universe.addEventListener('contextmenu',ev=>{if(!ev.target.closest('.entity')){ev.preventDefault();closeMenu();}});
universe.addEventListener('wheel',ev=>{
  ev.preventDefault();if(busy||drag.active)return;
  const id=ev.target.closest('.entity')?.dataset.id||hovered||focused;
  const view=views.get(id);
  if(view&&view.alpha>.15){
    const amount=ev.deltaY<0?.10:-.10;const card=state.cards.find(c=>c.id===id);
    const current=card?card.zoom:view.manualZoom,next=clamp(current+amount,.25,1.8);
    if(next===current&&!reduced)view.bounceVelocity=amount>0?1.9:-1.9;
    if(card){card.zoom=next;view.entity.zoom=next;}else view.manualZoom=next;
    hovered=id;persist();return;
  }
  if(openGroup)return;
  const near=Math.hypot(ev.clientX-width/2,ev.clientY-height*.46)<Math.max(globe.radius*1.8,Math.min(width*.48,height*.44));
  if(near)setRow(ev.deltaY<0);
},{passive:false});
function setRow(next){
  rowTarget=next;hovered=focused=null;document.body.classList.toggle('row-mode',next);
  $('#layout-name').textContent=next?'静止横列':'球形轨道';$('#layout-tip').textContent=next?'下滚恢复轨道 · 置顶网页在右端':'地球附近上滚，收束成一行';
  closeMenu();
}

function orbitPosition(index,total){
  const sy=1-2*(index+.5)/Math.max(total,1),r=Math.sqrt(1-sy*sy),theta=index*Math.PI*(3-Math.sqrt(5));
  const v=new THREE.Vector3(Math.cos(theta)*r*4.05,sy*2.85,Math.sin(theta)*r*4.05);v.applyEuler(new THREE.Euler(pitch,yaw,.04));v.y+=.2;return v;
}
function assemblyPosition(v,index,now){
  if(!flight)return {v,opacity:1,tilt:0};
  if(reduced)return {v,opacity:1,tilt:0};
  const seconds=(now-flight.start)/1000;
  if(seconds<.74){
    const t=ease(clamp(seconds/.74,0,1));const out=v.clone().multiplyScalar(1+t*2.1);out.y-=t*t*9;out.z-=t*9;
    return{v:out,opacity:1-t*.9,tilt:t*60*(index%2?1:-1)};
  }
  const t=ease(clamp((seconds-.92-index*.035)/1.65,0,1));
  const from=new THREE.Vector3(-12-index*.2,7+Math.sin(index)*.5,-20-index*.4);
  const control=new THREE.Vector3(-5+index*.16,5.3,2.5);
  const result=from.clone().multiplyScalar((1-t)**2).add(control.multiplyScalar(2*(1-t)*t)).add(v.clone().multiplyScalar(t*t));
  return {v:result,opacity:clamp(t*3,0,1),tilt:(1-t)*(-25-index*3)};
}

function flightPosition(target,index,total,now){return assemblyPosition(target,index,now).v;}
function replay(){
  if(busy)return;if(!state.cards.length){toast('轨道暂时为空。搜索一个世界，或在设置中恢复示例。');return;}collapseGroup();closeMenu();cancelGrouping();hovered=focused=null;setRow(false);audio.unlock();
  busy=true;flight={start:performance.now(),previous:null};$('#replay-button').disabled=true;$('#skip-flight').hidden=false;setStatus('REASSEMBLING YOUR UNIVERSE');
  if(reduced)finishFlight();
}
function finishFlight(){flight=null;busy=false;audio.stopFlight();$('#replay-button').disabled=false;$('#skip-flight').hidden=true;setStatus();}
$('#replay-button').addEventListener('click',replay);$('#skip-flight').addEventListener('click',finishFlight);

function repulsion(){pulse={start:performance.now()};const n=document.createElement('i');n.className='repulsion-flash';$('#flight-layer').append(n);n.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.4)'},{opacity:.7,offset:.3},{opacity:0,transform:'translate(-50%,-50%) scale(4)'}],{duration:reduced?120:1100,easing:'ease-out',fill:'forwards'}).finished.then(()=>n.remove());}
function cloud(x,y){for(let i=0;i<14;i++){const n=document.createElement('i');n.className='cloud-puff';Object.assign(n.style,{left:x+(Math.random()-.5)*120-25+'px',top:y+(Math.random()-.5)*70-25+'px'});$('#flight-layer').append(n);n.animate([{opacity:0,transform:'scale(.2)'},{opacity:.55,offset:.25},{opacity:0,transform:`translate(${(Math.random()-.5)*180}px,${-40-Math.random()*70}px) scale(2)`}],{duration:reduced?120:1000,easing:'ease-out',fill:'forwards'}).finished.then(()=>n.remove());}}
async function closeEntity(id){
  if(busy)return;const e=entity(id),view=views.get(id);if(!e||!view)return;
  closeMenu();audio.play('close');hovered=focused=null;busy=true;
  const removed=members(state,id).map(c=>({...c,index:state.cards.indexOf(c)})),affected=new Set(removed.map(c=>c.groupId).filter(Boolean));
  lastClosed={cards:removed,groups:state.groups.filter(g=>affected.has(g.id)).map(g=>({...g})),survivors:state.cards.filter(c=>affected.has(c.groupId)).map(c=>({id:c.id,groupId:c.groupId}))};
  closing={id,start:performance.now(),x:view.x,y:view.y,scale:view.scale};repulsion();setStatus('MAKING ROOM FOR A NEW WORLD');
  await new Promise(r=>setTimeout(r,reduced?150:850));cloud(width/2,height*.46);removeEntity(state,id);closing=null;busy=false;
  if(openGroup&&!state.groups.some(g=>g.id===openGroup)){openGroup=null;updateGroupCaption();}
  metadataChanged();setStatus();toast(`${e.name||e.title} 已离开轨道`,true);
}
$('#toast-undo').addEventListener('click',()=>{
  if(!lastClosed||busy)return;
  for(const c of lastClosed.cards){if(state.cards.length>=36)break;if(state.cards.some(x=>x.id===c.id))continue;const {index,...card}=c;state.cards.splice(Math.min(index,state.cards.length),0,card);}
  for(const g of lastClosed.groups)if(!state.groups.some(x=>x.id===g.id))state.groups.push(g);
  for(const m of lastClosed.survivors){const c=state.cards.find(x=>x.id===m.id);if(c&&!c.groupId)c.groupId=m.groupId;}
  reconcile(state);lastClosed=null;metadataChanged();toast('已回到轨道');
});
async function birthCard(card){
  if(busy)return;collapseGroup();closeMenu();hideFavorites();hovered=focused=null;busy=true;audio.play('birth');
  const r=$('#search-form').getBoundingClientRect();birth={id:card.id,start:performance.now(),x:r.x+r.width/2,y:r.y+r.height/2};repulsion();
  syncViews();persist();setStatus('A NEW WORLD · A NEW POSSIBILITY');$('#search-form').classList.add('is-birthing');
  await new Promise(r=>setTimeout(r,reduced?180:1450));birth=null;busy=false;$('#search-form').classList.remove('is-birthing');setStatus();
  enterCard(card.id);
}
$('#search-form').addEventListener('submit',ev=>{
  ev.preventDefault();if(busy)return;const query=$('#search-input').value.trim();if(!query){toast('输入关键词或网址，打开一个新的世界。');$('#search-input').focus();return;}
  if(state.cards.length>=36){toast('轨道已有 36 张网页，请先关闭一些再探索。');return;}
  const target=searchTarget(query,state.preferences.engine);if(!target){toast('请输入有效的 http / https 网址，或搜索关键词。');return;}
  const card={...target,id:uid(),symbol:target.kind==='web'?'↗':'⌕',color:'#bdd8e5',zoom:1,pinned:false,groupId:null};state.cards.push(card);$('#search-input').value='';$('#search-input').blur();birthCard(card);
});

async function enterCard(id){
  if(busy)return;const card=state.cards.find(c=>c.id===id),view=views.get(id);if(!card||!view)return;
  busy=true;entering=id;audio.play('enter');closeMenu();hideSettings();hideFavorites();
  const rect=view.node.getBoundingClientRect(),portal=document.createElement('div');portal.className='portal';portal.innerHTML=previewHTML(card,state.preferences.engine);Object.assign(portal.style,{left:rect.x+'px',top:rect.y+'px',width:rect.width+'px',height:rect.height+'px'});$('#flight-layer').append(portal);
  const p=portal.firstElementChild;Object.assign(p.style,{width:'192px',height:'135px',transformOrigin:'top left',transform:`scale(${rect.width/192})`});
  const duration=reduced?140:1150;
  p.animate([{transform:`scale(${rect.width/192})`},{transform:`scale(${Math.max(width/192,height/104)*1.12})`}],{duration,easing:'cubic-bezier(.72,.02,.2,1)',fill:'forwards'});
  await portal.animate([{left:rect.x+'px',top:rect.y+'px',width:rect.width+'px',height:rect.height+'px',borderRadius:'10px'},{left:'-4px',top:'-4px',width:width+8+'px',height:height+8+'px',borderRadius:'0'}],{duration,easing:'cubic-bezier(.72,.02,.2,1)',fill:'forwards'}).finished.catch(()=>{});
  showDestination(card);portal.remove();busy=false;entering=null;
}
function showDestination(card){
  activeDestination=card.id;document.body.classList.add('destination-open');
  document.querySelectorAll('#universe,.topbar,.greeting,.search-area,.bottom-bar,.settings-panel,#group-caption').forEach(n=>n.inert=true);
  const q=card.query||card.title;const content=card.kind==='search'?`<div class="destination-results"><a class="result-link" href="${esc(card.url)}" target="_blank" rel="noopener noreferrer"><small>${esc(card.engine||state.preferences.engine)} · WEB SEARCH</small><h3>探索「${esc(q)}」</h3><p>打开真实搜索结果，继续新的发现。 ↗</p></a><a class="result-link" href="https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer"><small>WIKIPEDIA</small><h3>从一个问题开始</h3><p>在维基百科中查找「${esc(q)}」。 ↗</p></a></div>`:`<div class="destination-art">${previewHTML(card,state.preferences.engine)}</div>`;
  $('#destination').innerHTML=`<nav class="destination-nav"><button class="back-orbit"><span>←</span> 返回轨道</button><span class="destination-address">${esc(card.url)}</span><a class="open-real" href="${esc(card.url)}" target="_blank" rel="noopener noreferrer">${card.kind==='search'?'打开真实搜索结果':'打开真实网页'} ↗</a></nav><main class="destination-content"><div class="destination-eyebrow">YOU HAVE ARRIVED · ${esc(card.domain.toUpperCase())}</div><h1 class="destination-brand">${chip(card)}${esc(card.title)}</h1><p>${esc(card.description||`关于「${q}」的探索，已经开始。你随时可以回到自己的轨道。`)}</p>${content}<div class="destination-footer"><span>你已进入示例页面。真实网页会在新窗口打开。<br>按 Esc，或点击左上角，回到你的宇宙。</span><button class="destination-back">回到地球，继续探索 ↗</button></div></main>`;
  $('#destination').hidden=false;$('#destination').scrollTop=0;$('#destination .back-orbit').addEventListener('click',returnOrbit);$('#destination .destination-back').addEventListener('click',returnOrbit);$('#destination .back-orbit').focus();
}
function returnOrbit(){
  if(!activeDestination)return;const id=activeDestination;audio.play('return');activeDestination=null;$('#destination').hidden=true;$('#destination').innerHTML='';document.body.classList.remove('destination-open');
  document.querySelectorAll('#universe,.topbar,.greeting,.search-area,.bottom-bar,.settings-panel,#group-caption').forEach(n=>n.inert=false);
  lastFrame=performance.now();hovered=focused=null;views.get(id)?.node.focus({preventScroll:true});focused=null;
  $('#universe').animate([{opacity:.2,transform:'scale(1.1)'},{opacity:1,transform:'scale(1)'}],{duration:reduced?100:900,easing:'cubic-bezier(.2,.7,.2,1)'});
}

function renderFavorites(){
  const list=$('#favorites-list');list.innerHTML=state.favorites.length?state.favorites.map(c=>`<button type="button" class="favorite-entry" data-favorite="${c.id}">${chip(c)}<span><b>${esc(c.title)}</b><small>${esc(c.domain)}</small></span><i>↗</i></button>`).join(''):'<div class="empty-state"><b>留住值得回来的世界</b>右键任意卡片 → 加入收藏夹</div>';
  $('#favorites-count').textContent=state.favorites.length;$('#favorites-count').hidden=!state.favorites.length;
}
function showFavorites(){clearTimeout(favoriteTimer);if(busy||drag.active)return;$('#favorites-popover').hidden=false;$('#favorites-button').setAttribute('aria-expanded','true');renderFavorites();}
function hideFavorites(){clearTimeout(favoriteTimer);$('#favorites-popover').hidden=true;$('#favorites-button').setAttribute('aria-expanded','false');}
$('#favorite-anchor').addEventListener('pointerenter',showFavorites);$('#favorite-anchor').addEventListener('pointerleave',()=>favoriteTimer=setTimeout(hideFavorites,180));
$('#favorites-button').addEventListener('focus',showFavorites);$('#favorites-button').addEventListener('click',()=>{$('#favorites-popover').hidden?showFavorites():hideFavorites();});
$('#favorites-list').addEventListener('click',ev=>{const id=ev.target.closest('[data-favorite]')?.dataset.favorite;if(!id||busy)return;const card=spawnFavorite(state,id);if(!card){toast('轨道已满，请先关闭一些网页。');return;}birthCard(card);});
$('#manage-favorites').addEventListener('click',()=>{hideFavorites();showSettings('favorites');});

function showSettings(tab='preferences'){
  settingsTab=tab;closeMenu();hideFavorites();$('#settings-panel').hidden=false;$('#settings-button').setAttribute('aria-expanded','true');
  document.querySelectorAll('[data-settings-tab]').forEach(n=>{const on=n.dataset.settingsTab===tab;n.classList.toggle('active',on);n.setAttribute('aria-pressed',String(on));});
  for(const name of ['preferences','groups','favorites','pins'])$('#'+name+'-panel').hidden=name!==tab;
  renderManagement();
}
function hideSettings(){$('#settings-panel').hidden=true;$('#settings-button').setAttribute('aria-expanded','false');}
$('#settings-button').addEventListener('click',()=>$('#settings-panel').hidden?showSettings():hideSettings());$('#close-settings').addEventListener('click',hideSettings);
document.querySelector('.settings-tabs').addEventListener('click',ev=>{const tab=ev.target.closest('[data-settings-tab]')?.dataset.settingsTab;if(tab)showSettings(tab);});
function renderManagement(){
  $('#planet-select').value=state.preferences.planet;
  $('#sound-toggle').checked=state.preferences.sound;$('#auto-orbit').checked=state.preferences.autoOrbit;$('#reduce-motion').checked=reduced;
  $('#groups-panel').innerHTML=`<p class="manage-help">拖动卡片并停留半秒，或使用右键菜单建组。可重命名、展开或解散星群。</p>${state.groups.length?state.groups.map(g=>`<div class="manage-row"><span class="manage-symbol">◉</span><div class="manage-main"><input aria-label="重命名 ${esc(g.name)}" data-rename-group="${g.id}" value="${esc(g.name)}" maxlength="40"><small>${members(state,g.id).length} 个网页</small></div><button data-manage="expand" data-id="${g.id}">展开</button><button data-manage="dissolve" data-id="${g.id}">解散</button></div>`).join(''):'<div class="empty-state"><b>尚无星群</b>把两个世界吸附到一起，开始整理。</div>'}`;
  $('#favorites-panel').innerHTML=`<p class="manage-help">右键网页可加入收藏夹。移除收藏不会关闭已打开的网页。</p>${state.favorites.length?state.favorites.map(c=>`<div class="manage-row">${chip(c)}<div class="manage-main"><b>${esc(c.title)}</b><small>${esc(c.domain)}</small></div><button data-manage="launch-favorite" data-id="${c.id}">打开</button><button data-manage="remove-favorite" data-id="${c.id}">移除</button></div>`).join(''):'<div class="empty-state"><b>收藏夹还是空的</b>右键卡片 → 加入收藏夹。</div>'}`;
  const pins=state.cards.filter(c=>c.pinned);
  $('#pins-panel').innerHTML=`<p class="manage-help">置顶网页泛着微弱金光，在静止横列的右端完整显示。</p>${pins.length?pins.map(c=>`<div class="manage-row">${chip(c)}<div class="manage-main"><b>${esc(c.title)}</b><small>${esc(c.domain)}</small></div><button data-manage="locate-pin" data-id="${c.id}">定位</button><button data-manage="unpin" data-id="${c.id}">取消置顶</button></div>`).join(''):'<div class="empty-state"><b>还没有置顶的世界</b>右键卡片 → 置顶网页。</div>'}`;
}
$('#settings-panel').addEventListener('change',ev=>{
  if(ev.target.matches('[data-rename-group]')){const group=state.groups.find(g=>g.id===ev.target.dataset.renameGroup);if(group){group.name=ev.target.value.trim()||'未命名星群';ev.target.value=group.name;persist();updateGroupCaption();}}
});
$('#settings-panel').addEventListener('input',ev=>{
  if(!ev.target.matches('[data-rename-group]'))return;
  const g=state.groups.find(g=>g.id===ev.target.dataset.renameGroup);if(!g)return;
  g.name=ev.target.value.trim()||'未命名星群';persist();
  const view=views.get(g.id);if(view){view.entity.name=g.name;const name=view.node.querySelector('.group-name');if(name)name.textContent=g.name;view.node.setAttribute('aria-label',`展开星群 ${g.name}，${members(state,g.id).length} 个网页`);}
  updateGroupCaption();
});
$('#settings-panel').addEventListener('click',ev=>{
  const b=ev.target.closest('[data-manage]');if(!b)return;const id=b.dataset.id,action=b.dataset.manage;
  if(busy){toast('请等待当前飞行结束。');return;}
  if(action==='expand'){hideSettings();expandGroup(id);}
  if(action==='dissolve'){dissolveGroup(state,id);if(openGroup===id){openGroup=null;updateGroupCaption();}metadataChanged();}
  if(action==='remove-favorite'){state.favorites=state.favorites.filter(c=>c.id!==id);metadataChanged();}
  if(action==='launch-favorite'){const card=spawnFavorite(state,id);if(card){hideSettings();birthCard(card);}else toast('轨道已满，请先关闭一些网页。');}
  if(action==='unpin'){const card=state.cards.find(c=>c.id===id);if(card)card.pinned=false;metadataChanged();}
  if(action==='locate-pin'){const c=state.cards.find(c=>c.id===id);hideSettings();if(c?.groupId)expandGroup(c.groupId);else setRow(true);hovered=id;setTimeout(()=>{if(hovered===id)hovered=null;},2000);}
});
$('#sound-toggle').addEventListener('change',ev=>{state.preferences.sound=ev.target.checked;audio.toggle(ev.target.checked);persist();});
$('#auto-orbit').addEventListener('change',ev=>{state.preferences.autoOrbit=ev.target.checked;persist();});
$('#reduce-motion').addEventListener('change',ev=>{reduced=ev.target.checked;state.preferences.reducedMotion=reduced;if(reduced&&flight)finishFlight();persist();});
$('#reset-button').addEventListener('click',()=>{if(busy){toast('请先等待飞行结束，或跳过入场。');return;}state.cards=normalizeState(null,defaults.map(c=>({...c,kind:c.id}))).cards;state.groups=[];lastClosed=null;openGroup=null;updateGroupCaption();metadataChanged();hideSettings();replay();toast('已恢复 12 个示例网页，收藏夹保留。');});
const help=$('#help-dialog');$('#help-button').addEventListener('click',()=>{hideSettings();help.showModal();});help.querySelector('.dialog-close').addEventListener('click',()=>help.close());$('#start-exploring').addEventListener('click',()=>help.close());help.addEventListener('click',ev=>{if(ev.target===help){const r=help.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)help.close();}});
$('#engine-button').addEventListener('click',()=>{const m=$('#engine-menu');m.hidden=!m.hidden;$('#engine-button').setAttribute('aria-expanded',String(!m.hidden));});
$('#engine-menu').addEventListener('click',ev=>{const e=ev.target.closest('[data-engine]')?.dataset.engine;if(e){state.preferences.engine=e;syncEngine();persist();$('#engine-menu').hidden=true;$('#engine-button').setAttribute('aria-expanded','false');$('#search-input').focus();}});
function syncEngine(){$('#engine-button').innerHTML=`${state.preferences.engine} <span>⌄</span>`;}
function syncPlanet(){
  const p=planets.find(p=>p.id===state.preferences.planet)||planets[2];
  globe.setPlanet(p.id);$('.planet-caption strong').textContent=p.label;
  $('.planet-caption div>span').textContent=p.description;
  $('.planet-caption .coordinate').textContent=`SOLAR SYSTEM / ${String(planets.indexOf(p)+1).padStart(2,'0')}`;
  $('#planet-select').value=p.id;
}
$('#planet-select').addEventListener('change',ev=>{state.preferences.planet=ev.target.value;syncPlanet();persist();audio.play('toggle');});
document.addEventListener('pointerdown',ev=>{
  if(state.preferences.sound)audio.unlock();
  if(!ev.target.closest('#context-menu,.entity'))closeMenu();
  if(!ev.target.closest('#settings-panel,#settings-button'))hideSettings();
  if(!ev.target.closest('#favorite-anchor'))hideFavorites();
  if(!ev.target.closest('#engine-menu,#engine-button')){$('#engine-menu').hidden=true;$('#engine-button').setAttribute('aria-expanded','false');}
});
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'){
    if(activeDestination)returnOrbit();else if(contextId)closeMenu();else if(groupSource)cancelGrouping();else if(openGroup)collapseGroup();
    hideSettings();hideFavorites();hovered=focused=null;cancelDrag();
  }
  if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='z'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)&&!activeDestination){if(lastClosed){ev.preventDefault();$('#toast-undo').click();}}
  if(ev.key==='F1'){ev.preventDefault();hideSettings();help.showModal();}
  if(state.preferences.sound)audio.unlock();
});

function frame(now){
  requestAnimationFrame(frame);if(document.hidden||activeDestination){lastFrame=now;return;}
  const dt=Math.min((now-lastFrame)/1000||.016,.05);lastFrame=now;elapsed+=dt;
  width=innerWidth;height=innerHeight;rowBlend=mix(rowBlend,rowTarget?1:0,1-Math.exp(-dt*6));if(Math.abs(rowBlend-(rowTarget?1:0))<.001)rowBlend=rowTarget?1:0;
  const focus=contextId||hovered||focused;
  const stopped=rowTarget||openGroup||drag.active||worldDrag.active||busy;
  const targetSpeed=state.preferences.autoOrbit&&!reduced&&!stopped?(focus?.002:.035):0;
  speed=mix(speed,targetSpeed,1-Math.exp(-dt*5));targetYaw+=speed*dt;yaw=mix(yaw,targetYaw,1-Math.exp(-dt*8));pitch=mix(pitch,targetPitch,1-Math.exp(-dt*8));
  globe.render(dt,{yaw,pitch,time:elapsed,reduced,row:rowBlend});
  trail.render(now,width,height,reduced);
  const list=entities(state),row=rowPositions(list.map(e=>({...e,zoom:e.type==='group'?views.get(e.id)?.manualZoom||1:e.zoom})),width,height,focus),center={x:width/2,y:height*.45};
  if(flight){
    if(now-flight.start>(reduced?100:3350+list.length*35))finishFlight();
    else{
      const mid=Math.floor(list.length/2),point=flightPosition(orbitPosition(mid,list.length),mid,list.length,now);
      if(flight.previous){const velocity=point.clone().sub(flight.previous).divideScalar(dt),relative=point.clone().sub(globe.camera.position),distance=relative.length();audio.updateFlight({speed:velocity.length(),radial:velocity.dot(relative.normalize()),pan:point.x/4.5,proximity:clamp(1-distance/23,.1,1)});}
      flight.previous=point;
    }
  }
  const expanded=members(state,openGroup),expandedIds=new Set(openGroup?expanded.map(c=>c.id):[]);
  let all=list;if(openGroup)all=[...list,...expanded.map(c=>({...c,type:'card',expanded:true}))];
  all.forEach((e,index)=>{
    const view=views.get(e.id);if(!view)return;
    let world=orbitPosition(index%Math.max(1,list.length),Math.max(1,list.length)),p=globe.project(world),angle=0;
    const nativeDistance=Math.hypot(p.x-width/2,p.y-height*.48);
    let behind=world.z<-.2&&nativeDistance<globe.radius*.98;
    const depth=clamp(globe.camera.position.z/(globe.camera.position.z-world.z),.65,1.55);
    let scale=depth*(width<480?.54:width<700?.66:.78)*(e.type==='group'?1.12:1);
    p.y=height*.45+(p.y-height*.5)*.68;
    let alpha=behind?0:world.z<-1?.48:.95;
    if(flight){const assembly=assemblyPosition(world,index,now);world=assembly.v;angle=assembly.tilt;p=globe.project(world);p.y=height*.45+(p.y-height*.5)*.7;scale=clamp(globe.camera.position.z/(globe.camera.position.z-world.z),.65,1.55)*(width<600?.6:.78);alpha=assembly.opacity*(world.z<-.5&&Math.hypot(p.x-width/2,p.y-height*.48)<globe.radius*.95?.02:1);behind=alpha<.05;}
    else if(openGroup){
      if(expandedIds.has(e.id)){
        const i=expanded.findIndex(c=>c.id===e.id),n=expanded.length;
        const a=(n===2?0:-Math.PI/2)+i*Math.PI*2/n,rX=Math.min(width*.30,335),rY=Math.min(height*.13,140);
        p={x:width/2+Math.cos(a)*rX,y:height*.53+Math.sin(a)*rY};scale=width<600?.69:1;alpha=1;behind=false;angle=Math.cos(a)*-4;
      }else alpha=e.id===openGroup?0:.09;
    }else{
      const rp=row.get(e.id);if(rp){p.x=mix(p.x,rp.x,rowBlend);p.y=mix(p.y,rp.y,rowBlend);scale=mix(scale,rp.scale,rowBlend);alpha=mix(alpha,1,rowBlend);if(rowBlend>.1)behind=false;}
      angle=clamp(world.x*world.y*.18,-4,4)*(1-rowBlend);
    }
    if(pulse&&e.id!==birth?.id&&e.id!==closing?.id){const t=(now-pulse.start)/1300;if(t>=1)pulse=null;else{const amount=Math.sin(clamp(t,0,1)*Math.PI)*(reduced?8:48),dx=p.x-center.x,dy=p.y-center.y,d=Math.hypot(dx,dy)||1;p.x+=dx/d*amount;p.y+=dy/d*amount;}}
    if(birth?.id===e.id){
      const t=clamp((now-birth.start)/1400,0,1),a=ease(clamp(t/.55,0,1)),b=ease(clamp((t-.55)/.45,0,1));
      const px=mix(birth.x,center.x,a),py=mix(birth.y,center.y,a);p.x=mix(px,p.x,b);p.y=mix(py,p.y,b);scale=mix(.3,1.12,Math.sin(t*Math.PI))*(width<600?.7:1);alpha=1;behind=false;
    }
    if(closing?.id===e.id){const t=ease(clamp((now-closing.start)/800,0,1));p.x=mix(closing.x,center.x,t);p.y=mix(closing.y,center.y,t);scale=closing.scale*(1+.12*t);alpha=1-clamp((t-.4)/.6,0,1);view.node.style.filter=`blur(${Math.max(0,t-.5)*25}px)`;behind=false;}
    const isFocus=focus===e.id&&!drag.active;
    if(isFocus){scale*=1.18;alpha=1;behind=false;}
    else if(focus&&!openGroup&&!drag.active)alpha*=.28;
    scale*=e.type==='group'?view.manualZoom:(e.zoom||1);
    if(rowBlend>.85&&!flight&&!openGroup){const half=(e.type==='group'?72:96)*scale;p.x=clamp(p.x,half+16,width-half-16);}
    view.bounceVelocity+=(-90*view.bounce-13*view.bounceVelocity)*dt;view.bounce+=view.bounceVelocity*dt;scale*=1+view.bounce;
    if(drag.active&&drag.id===e.id){p.x=drag.x;p.y=drag.y;scale=Math.max(scale,width<600?.8:1.05);alpha=1;behind=false;angle=0;}
    const response=1-Math.exp(-dt*(drag.active&&drag.id===e.id?28:9));
    view.x=mix(view.x,p.x,response);view.y=mix(view.y,p.y,response);view.scale=mix(view.scale,scale,response);view.alpha=mix(view.alpha,entering===e.id?0:alpha,response);
    const rotateY=(openGroup||rowBlend>.9||flight)?0:clamp(world.x*-3,-13,13)*(1-rowBlend),rotateX=0;
    view.node.style.transform=`translate3d(${view.x}px,${view.y}px,0) translate(-50%,-50%) scale(${view.scale}) perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) rotate(${angle}deg)`;
    view.node.style.opacity=view.alpha.toFixed(3);view.node.style.zIndex=drag.id===e.id&&drag.active?'1100':isFocus?'700':rowBlend>.85?String(600-index*2):String(Math.round(100+world.z*8+index));
    const disabled=busy||behind||openGroup&&!expandedIds.has(e.id)||view.alpha<.08;
    view.node.style.pointerEvents=disabled||drag.id===e.id&&drag.active?'none':'auto';view.node.classList.toggle('is-hovered',isFocus);view.node.tabIndex=disabled?-1:0;view.node.setAttribute('aria-hidden',disabled?'true':'false');
    const close=view.node.querySelector('.card-close');if(close)close.tabIndex=disabled?-1:0;
  });
  if(drag.active&&drag.target){const target=views.get(drag.target),progress=clamp((now-drag.since)/500,0,1);if(drag.target==='@favorites'){$('#favorites-button').classList.add('favorite-drop-target');$('#favorites-button').style.setProperty('--dwell',progress);if(progress>=1)collectDragged();}else if(target){target.node.classList.add('drop-target');target.node.style.setProperty('--dwell',progress.toFixed(3));if(progress>=1)merge(drag.id,drag.target);}}
}
document.addEventListener('visibilitychange',()=>{audio.stopFlight();lastFrame=performance.now();if(flight)flight.previous=null;});
function updateClock(){const date=new Date();$('#clock').textContent=date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});$('#date').textContent=date.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'2-digit'}).toUpperCase();}
updateClock();setInterval(updateClock,15000);syncViews();renderFavorites();renderManagement();syncEngine();syncPlanet();persist();requestAnimationFrame(frame);
$('#search-form').addEventListener('pointerdown',ev=>{
  if(ev.target.closest('#favorites-popover'))return;
  $('#search-form').animate([{borderColor:'#b9cfdf55',boxShadow:'0 0 0px #bde8ff00'},{borderColor:'#e8f6ffcc',boxShadow:'0 0 32px #bde8ff38',offset:.25},{borderColor:'#bbdcf078',boxShadow:'0 0 12px #bde8ff0a'}],{duration:reduced?100:430,easing:'ease-out'});
});
document.addEventListener('pointermove',ev=>{if(!activeDestination&&!reduced&&ev.pointerType!=='touch')trail.add(ev.clientX,ev.clientY,performance.now());});
function start(){const loading=$('#loading');if(!loading)return;loading.style.opacity='0';setTimeout(()=>loading.remove(),500);replay();}
if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
