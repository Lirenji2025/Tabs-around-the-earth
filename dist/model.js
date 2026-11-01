export const uid = (prefix='tab') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function cleanCard(card){
  if(!card||typeof card.url!=='string'||typeof card.title!=='string')return null;
  try{const url=new URL(card.url);if(!['http:','https:'].includes(url.protocol))return null;}catch{return null;}
  const result={id:typeof card.id==='string'?card.id:uid(),title:card.title.slice(0,200),url:card.url,domain:typeof card.domain==='string'?card.domain:new URL(card.url).hostname,symbol:typeof card.symbol==='string'?card.symbol.slice(0,3):'↗',color:/^#[\da-f]{3,8}$/i.test(card.color)?card.color:'#b8d2e5',pinned:card.pinned===true,zoom:clamp(Number(card.zoom)||1,.25,1.8),groupId:typeof card.groupId==='string'?card.groupId:null};
  for(const key of ['kind','subtitle','description','query','engine'])if(typeof card[key]==='string')result[key]=card[key].slice(0,1000);
  if(!result.kind&&typeof card.id==='string'&&!card.id.startsWith('new-'))result.kind=card.id;
  return result;
}
export function normalizeState(saved,defaults){
  const original=Array.isArray(saved?.cards)?saved.cards:defaults;
  const seen=new Set();const cards=original.map(cleanCard).filter(c=>c&&!seen.has(c.id)&&seen.add(c.id)).slice(0,36);
  const groupSeen=new Set();const groups=(Array.isArray(saved?.groups)?saved.groups:[]).filter(g=>g&&typeof g.id==='string'&&!groupSeen.has(g.id)&&groupSeen.add(g.id)).map(g=>({id:g.id,name:typeof g.name==='string'?g.name.slice(0,40):'新星群'}));
  const favSeen=new Set();const favorites=(Array.isArray(saved?.favorites)?saved.favorites:[]).map(cleanCard).filter(c=>c&&!favSeen.has(c.url)&&favSeen.add(c.url)).slice(0,100).map(c=>({...c,groupId:null,pinned:false,zoom:1}));
  const p=saved?.preferences||saved||{};
  const state={schema:2,cards,groups,favorites,preferences:{planet:['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'].includes(p.planet)?p.planet:'earth',sound:p.sound!==false,autoOrbit:p.autoOrbit!==false,reducedMotion:typeof p.reducedMotion==='boolean'?p.reducedMotion:null,engine:['Bing','Google','DuckDuckGo'].includes(p.engine)?p.engine:'Bing'}};
  reconcile(state);return state;
}
export function reconcile(state){
  const valid=new Set(state.groups.map(g=>g.id));
  state.cards.forEach(c=>{if(!valid.has(c.groupId))c.groupId=null;});
  state.groups=state.groups.filter(g=>{const members=state.cards.filter(c=>c.groupId===g.id);if(members.length<2){members.forEach(c=>c.groupId=null);return false;}return true;});
}
export function members(state,id){const group=state.groups.find(g=>g.id===id);return group?state.cards.filter(c=>c.groupId===id):state.cards.filter(c=>c.id===id);}
export function entities(state){
  const emitted=new Set(),out=[];
  for(const card of state.cards){
    if(card.groupId){if(emitted.has(card.groupId))continue;const group=state.groups.find(g=>g.id===card.groupId);if(group){emitted.add(group.id);const list=members(state,group.id);out.push({...group,type:'group',members:list,pinned:list.some(c=>c.pinned),zoom:1});}}
    else out.push({...card,type:'card'});
  }
  return out.sort((a,b)=>Number(a.pinned)-Number(b.pinned));
}
export function groupTogether(state,sourceId,targetId){
  if(sourceId===targetId)return null;
  const source=members(state,sourceId),target=members(state,targetId);if(!source.length||!target.length)return null;
  const ids=new Set([...source,...target].map(c=>c.id));if(ids.size<2)return null;
  let targetGroup=state.groups.find(g=>g.id===targetId)||state.groups.find(g=>g.id===target[0].groupId);
  if(!targetGroup){targetGroup={id:uid('group'),name:`${target[0].title} · 星群`};state.groups.push(targetGroup);}
  state.cards.forEach(c=>{if(ids.has(c.id))c.groupId=targetGroup.id;});
  reconcile(state);return targetGroup.id;
}
export function dissolveGroup(state,id){state.cards.forEach(c=>{if(c.groupId===id)c.groupId=null;});state.groups=state.groups.filter(g=>g.id!==id);}
export function detachCard(state,id){const card=state.cards.find(c=>c.id===id);if(card)card.groupId=null;reconcile(state);}
export function removeEntity(state,id){const ids=new Set(members(state,id).map(c=>c.id));state.cards=state.cards.filter(c=>!ids.has(c.id));reconcile(state);return ids.size;}
export function togglePin(state,id){const list=members(state,id);const next=!list.every(c=>c.pinned);list.forEach(c=>c.pinned=next);return next;}
export function toggleFavorite(state,id){
  const card=state.cards.find(c=>c.id===id);if(!card)return false;
  const existing=state.favorites.findIndex(c=>c.url===card.url);
  if(existing>=0){state.favorites.splice(existing,1);return false;}
  state.favorites.push({...cleanCard(card),id:uid('favorite'),groupId:null,pinned:false,zoom:1});return true;
}
export function spawnFavorite(state,id){
  if(state.cards.length>=36)return null;const favorite=state.favorites.find(c=>c.id===id);if(!favorite)return null;
  const card={...favorite,id:uid(),groupId:null,pinned:false,zoom:1};state.cards.push(card);return card;
}
export function searchTarget(query,engine='Bing'){
  const q=query.trim();if(!q)return null;
  if(/^https?:\/\//i.test(q)){
    try{const u=new URL(q);if(!u.hostname)return null;return{url:u.href,domain:u.hostname,title:u.hostname.replace(/^www\./,''),kind:'web'};}catch{return null;}
  }
  if(/^[a-z][a-z\d+.-]*:/i.test(q))return null;
  if(/^[\w-]+(\.[\w-]+)+(\/[\S]*)?$/.test(q)){const u=new URL('https://'+q);return{url:u.href,domain:u.hostname,title:u.hostname.replace(/^www\./,''),kind:'web'};}
  const base={Bing:'https://www.bing.com/search?q=',Google:'https://www.google.com/search?q=',DuckDuckGo:'https://duckduckgo.com/?q='}[engine]||'https://www.bing.com/search?q=';
  return{url:base+encodeURIComponent(q),domain:new URL(base).hostname,title:q,query:q,kind:'search',engine};
}
export function rowPositions(list,width,height,focus=null){
  const ordered=[...list].sort((a,b)=>Number(a.pinned)-Number(b.pinned));
  const margin=width<600?16:48,available=width-margin*2;
  const gap=Math.min(width<600?7:14,available/Math.max(1,ordered.length*5));
  const sizes=ordered.map(e=>(e.type==='group'?144:192)*.78*(e.zoom||1)*(e.id===focus?1.18:1));
  const fit=Math.min(1,(available-gap*Math.max(0,ordered.length-1))/(sizes.reduce((a,b)=>a+b,0)||1));
  const total=sizes.reduce((a,b)=>a+b,0)*fit+gap*Math.max(0,ordered.length-1);
  let x=ordered.some(e=>e.pinned)?width-margin-total:(width-total)/2;
  const points=new Map();
  ordered.forEach((e,i)=>{const size=sizes[i]*fit;points.set(e.id,{x:x+size/2,y:height*.47,scale:.78*fit});x+=size+gap;});
  return points;
}
