import * as THREE from './assets/three.module.js';

const $ = (selector) => document.querySelector(selector);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
const escapeHTML = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults = [
  {id:'github',title:'GitHub',subtitle:'Build something wonderful.',url:'https://github.com/',domain:'github.com',symbol:'⌘',color:'#d6dfeb',description:'每一个想法，都值得一次 commit。继续你的项目，探索下一个值得创造的东西。'},
  {id:'figma',title:'Figma',subtitle:'Ideas take shape here.',url:'https://www.figma.com/',domain:'figma.com',symbol:'F',color:'#bca4f4',description:'让想法有形状，让灵感有去处。你的下一次设计，正等待一个新的开始。'},
  {id:'nasa',title:'NASA',subtitle:'There is more out there.',url:'https://www.nasa.gov/',domain:'nasa.gov',symbol:'N',color:'#96baf1',description:'抬起头，世界比想象更辽阔。探索正在发生的太空任务，以及那些遥远却真实的世界。'},
  {id:'notion',title:'Notion',subtitle:'A little room for your mind.',url:'https://www.notion.so/',domain:'notion.so',symbol:'N',color:'#ecebe4',description:'把暂时放不下的想法，轻轻放在这里。一页笔记，一个计划，一点慢慢生长的秩序。'},
  {id:'youtube',title:'YouTube',subtitle:'One more perspective.',url:'https://www.youtube.com/',domain:'youtube.com',symbol:'▶',color:'#ef8f8f',description:'听听另一种声音，看看另一种生活。那些尚未看完的故事，依然在这里等你。'},
  {id:'spotify',title:'Spotify',subtitle:'Give your orbit a soundtrack.',url:'https://open.spotify.com/',domain:'open.spotify.com',symbol:'≋',color:'#9ad8a5',description:'为今天的轨道选一段配乐。让节奏慢下来，让注意力重新回到自己身上。'},
  {id:'arena',title:'Are.na',subtitle:'Follow a thread of curiosity.',url:'https://www.are.na/',domain:'are.na',symbol:'✳',color:'#d7c6a3',description:'连接图像、文字与偶然的发现。循着好奇心，一直走到意料之外的地方。'},
  {id:'mdn',title:'MDN Web Docs',subtitle:'Understand the web.',url:'https://developer.mozilla.org/',domain:'developer.mozilla.org',symbol:'M',color:'#a4ccef',description:'理解一行代码，也就多理解一点这个世界。查阅文档，继续你刚才的探索。'},
  {id:'canvas',title:'Assignment 3',subtitle:'Make something that responds.',url:'https://canvas.polyu.edu.hk/',domain:'canvas.polyu.edu.hk',symbol:'C',color:'#dca5aa',description:'一次输入，一次回应，一次清晰的反馈。把小小的想法，变成别人可以亲手体验的作品。'},
  {id:'wiki',title:'Wikipedia',subtitle:'Stay wonderfully curious.',url:'https://en.wikipedia.org/wiki/Earth',domain:'wikipedia.org',symbol:'W',color:'#e1ded7',description:'我们生活的这颗蓝色星球，依然藏着数不清的故事。从一个问题，抵达另一个发现。'},
  {id:'pinterest',title:'Pinterest',subtitle:'Collect what moves you.',url:'https://www.pinterest.com/',domain:'pinterest.com',symbol:'P',color:'#e1a69d',description:'色彩、光线、材料与形状。把让你停留片刻的灵感，收进自己的小小宇宙。'},
  {id:'linear',title:'Linear',subtitle:'A small step, then another.',url:'https://linear.app/',domain:'linear.app',symbol:'◒',color:'#b5b0ec',description:'把大想法拆成可以完成的小事。下一步不必很大，只需要清楚。'},
];
const STORAGE = 'orbit-earth-prototype-v1';
let saved;
try { saved = JSON.parse(localStorage.getItem(STORAGE) || 'null'); } catch {}
let cards = Array.isArray(saved?.cards) ? saved.cards.filter(c => c && typeof c.id === 'string' && typeof c.title === 'string' && typeof c.url === 'string' && /^https?:\/\//.test(c.url)).slice(0,36) : defaults.map(c => ({...c}));
let soundEnabled = saved?.sound !== false;
let autoOrbit = saved?.autoOrbit !== false;
let reducedMotion = saved?.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
let engine = ['Bing','Google','DuckDuckGo'].includes(saved?.engine) ? saved.engine : 'Bing';
let hoveredId = null, keyboardFocusId = null, busy = false, flightStart = null, flightKind = 'assembly';
let enteringId = null, birth = null, activeDestination = null, lastClosed = null, toastTimer;
let yaw = .36, targetYaw = .36, pitch = -.04, targetPitch = -.04, speed = .055;
let width = innerWidth, height = innerHeight, lastFrame = 0, elapsed = 0, running = true;
let scene, camera, renderer, earth, earthGroup, starGroup, atmosphere, orbitGroup, landLines;
let rendererReady = false, planetRotation = .9;
let audioContext;
const elements = new Map();
const layer = $('#card-layer');

function persist() {
  try { localStorage.setItem(STORAGE, JSON.stringify({cards, sound:soundEnabled, autoOrbit, reducedMotion, engine})); } catch { /* Session still works when storage is unavailable. */ }
}
function updateCount() { $('#tab-count').textContent = cards.length; }
function setStatus(text = 'YOUR PERSONAL ORBIT') { $('#orbit-status').textContent = text; }
function toast(message, undo = false) {
  clearTimeout(toastTimer); $('#toast-message').textContent = message;
  $('#toast-undo').hidden = !undo; $('#toast').hidden = false;
  toastTimer = setTimeout(() => $('#toast').hidden = true, undo ? 7000 : 3800);
}
function previewHTML(card) {
  const kind = card.kind || card.id;
  const nav = (brand, right='') => `<div class="mini-nav"><b>${brand}</b><span>${right}</span></div>`;
  const lines = '<div class="mini-lines"><i></i><i></i><i></i></div>';
  switch (kind) {
    case 'github': return `<div class="card-preview preview-github">${nav('⌘ GitHub','Product　Solutions　Open Source')}<div class="github-inner"><div class="github-repo">your-universe / a-new-beginning <span class="mini-pill">Public</span></div><div class="github-chart">${'<i></i>'.repeat(100)}</div><div class="github-footer">Make a little progress. Every day.</div></div></div>`;
    case 'figma': return '<div class="card-preview preview-figma"><div class="figma-board"><div class="figma-sidebar"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="figma-art"><div class="shape1"></div><div class="shape2">✳</div><div class="shape3"></div><div class="figma-cursor">↖ You</div></div></div></div>';
    case 'nasa': return `<div class="card-preview preview-nasa">${nav('NASA','EXPLORE THE UNIVERSE')}<div class="nasa-title">Beyond<br>the known.<span>DARE TO EXPLORE</span></div><div class="nasa-planet"></div></div>`;
    case 'notion': return '<div class="card-preview preview-notion"><div class="notion-page"><span>✺</span><b>A space to begin.</b><div class="notion-task"><i></i> Make something meaningful</div><div class="notion-task"><i></i> Collect a little inspiration</div><div class="notion-task"><i></i> Leave room for the unexpected</div></div></div>';
    case 'youtube': return `<div class="card-preview preview-youtube">${nav('▶ YouTube','Explore　Watch later')}<div class="youtube-layout"><div class="youtube-feature"><div class="youtube-mountain"></div><i class="play-icon"></i></div><div class="youtube-side"><i></i><i></i></div></div><div class="youtube-caption">A quieter place, a different perspective.</div></div>`;
    case 'spotify': return '<div class="card-preview preview-spotify"><div class="spotify-top"><div class="album-art">slow</div><div class="album-info">PLAYLIST<strong>Quiet orbit</strong>For the world inside your head.</div></div><div class="spotify-track"><span>▶　01　Weightless</span><span>5:12</span></div></div>';
    case 'arena': return `<div class="card-preview preview-arena">${nav('Are.na','a collection of small discoveries')}<div class="arena-grid"><i></i><i></i><i></i><i></i></div></div>`;
    case 'mdn': return `<div class="card-preview preview-mdn">${nav('mdn_','References　Guides')}<div class="mdn-page"><b>Build a better web.</b><p>Everything you need to create something new.</p><div class="mdn-code">const world = new Universe();<br>world.begin({ curiosity: true });</div></div></div>`;
    case 'canvas': return '<div class="card-preview preview-canvas"><div class="canvas-layout"><div class="canvas-sidebar"><span>◉</span><span>▦</span><span>▤</span><span>◷</span></div><div class="canvas-main"><small>SD5913 / ASSIGNMENTS</small><b>Assignment 3</b><div class="canvas-assignment">An interactive experience<br>Input → Response → Feedback<br>Make it small. Make it work.</div></div></div></div>';
    case 'wiki': return '<div class="card-preview preview-wiki"><div class="wiki-page"><b>Earth</b><p>From Wikipedia, the free encyclopedia</p><p>Earth is the third planet from the Sun and the only astronomical object known to harbor life.</p><div class="mini-lines"><i></i><i></i><i></i></div></div></div>';
    case 'pinterest': return '<div class="card-preview preview-pinterest"><div class="pin-grid"><div class="pin-col"><i></i><i></i></div><div class="pin-col"><i></i><i></i></div><div class="pin-col"><i></i><i></i></div></div></div>';
    case 'linear': return '<div class="card-preview preview-linear"><div class="linear-page"><b>Build with intention.</b><div class="linear-columns"><div><i></i><i></i><i></i></div><div><i></i><i></i></div><div><i></i><i></i><i></i></div></div></div></div>';
    default: return `<div class="card-preview preview-search"><div class="search-preview-content"><small>${escapeHTML(card.kind === 'web' ? card.domain : `${engine.toUpperCase()} · A NEW DISCOVERY`)}</small><b>${escapeHTML(card.title)}</b></div></div>`;
  }
}
function createElement(card) {
  const node = document.createElement('article');
  node.className = 'tab-card'; node.dataset.id = card.id; node.tabIndex = 0;
  node.setAttribute('role','button'); node.setAttribute('aria-label',`进入 ${card.title}，右键关闭`);
  node.style.setProperty('--site-color', card.color || '#a7cce2');
  node.innerHTML = `<div class="card-top"><span class="card-favicon">${escapeHTML(card.symbol || '↗')}</span><span class="card-title">${escapeHTML(card.title)}</span><button class="card-close" aria-label="关闭 ${escapeHTML(card.title)}" title="关闭标签页">×</button></div>${previewHTML(card)}<div class="card-hover-caption"><span class="card-domain">${escapeHTML(card.domain || '')}</span><span>进入 ↗</span></div>`;
  node.addEventListener('pointerenter', () => { if(!busy && !drag.active) hoveredId = card.id; });
  node.addEventListener('pointerleave', () => { if(hoveredId === card.id) hoveredId = keyboardFocusId; });
  node.addEventListener('focus', () => { keyboardFocusId = card.id; hoveredId = card.id; });
  node.addEventListener('blur', () => { keyboardFocusId = null; if(hoveredId === card.id) hoveredId = null; });
  node.addEventListener('pointerdown', e => { e.stopPropagation(); unlockAudio(); });
  node.addEventListener('click', e => { if(!e.target.closest('.card-close')) enterCard(card.id); });
  node.addEventListener('contextmenu', e => { e.preventDefault(); closeCard(card.id); });
  node.addEventListener('keydown', e => {
    if(e.target !== node) return;
    if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterCard(card.id); }
    if(e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); closeCard(card.id); }
  });
  node.querySelector('.card-close').addEventListener('click', e => {e.stopPropagation(); closeCard(card.id);});
  card.alpha = 1; card.scale = 1;
  layer.append(node); elements.set(card.id,node); return node;
}
cards.forEach(createElement); updateCount();

function unlockAudio() {
  if(!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if(audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  } catch {}
}
function whoosh(kind='enter') {
  if(!soundEnabled) return; unlockAudio();
  if(!audioContext || audioContext.state !== 'running') return;
  const ctx = audioContext, now = ctx.currentTime;
  const duration = kind === 'close' ? .75 : kind === 'birth' ? .95 : 1.2;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0); let filtered = 0;
  for(let i=0;i<data.length;i++){ filtered = (filtered + (Math.random()*2-1)*.04)/1.04; data[i] = filtered * 4; }
  const source = ctx.createBufferSource(); source.buffer = buffer;
  const filter = ctx.createBiquadFilter(); filter.type='lowpass'; filter.Q.value=.6;
  filter.frequency.setValueAtTime(kind === 'birth'?450:160,now);
  filter.frequency.exponentialRampToValueAtTime(kind === 'close'?800:2400,now+duration*.48);
  filter.frequency.exponentialRampToValueAtTime(80,now+duration);
  const gain = ctx.createGain(); gain.gain.setValueAtTime(0,now);
  gain.gain.linearRampToValueAtTime(kind === 'close'?.10:.23,now+duration*.4);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  const pan = ctx.createStereoPanner();pan.pan.setValueAtTime(-.8,now);pan.pan.linearRampToValueAtTime(.8,now+duration);
  source.connect(filter).connect(gain).connect(pan).connect(ctx.destination);source.start(now);
}

function setupThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40,width/height,.1,180);
  renderer = new THREE.WebGLRenderer({canvas:$('#space'),antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(width,height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  earthGroup = new THREE.Group(); scene.add(earthGroup);
  const texture = new THREE.TextureLoader().load('./assets/earth.jpg', () => {rendererReady=true;}, undefined, () => {rendererReady=true;toast('地球纹理暂不可用，轨道仍可使用。');});
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy=4;
  const material = new THREE.ShaderMaterial({
    uniforms:{map:{value:texture},sunDirection:{value:new THREE.Vector3(-.75,.5,1.2).normalize()},time:{value:0}},
    vertexShader:`varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;void main(){vUv=uv;vNormal=normalize(mat3(modelMatrix)*normal);vPosition=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vPosition,1.0);}`,
    fragmentShader:`uniform sampler2D map;uniform vec3 sunDirection;uniform float time;varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;void main(){vec3 n=normalize(vNormal);vec3 c=texture2D(map,vUv).rgb;float daylight=smoothstep(-.3,.85,dot(n,sunDirection));float land=smoothstep(.02,.17,c.g-c.b*.64);vec3 ocean=vec3(.027,.085,.135)+c*vec3(.16,.33,.46);vec3 terrain=mix(ocean,mix(c,vec3(.31,.42,.42),.56),land*.7);vec3 color=terrain*(.13+daylight*1.05);float fresnel=pow(1.0-max(0.0,dot(n,normalize(cameraPosition-vPosition))),3.4);color+=vec3(.055,.15,.23)*fresnel*(.3+daylight*.7);gl_FragColor=vec4(color,1.0);}`
  });
  earth = new THREE.Mesh(new THREE.SphereGeometry(1.8,96,64),material);earth.rotation.y=.9;earthGroup.add(earth);
  atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.845,64,48),new THREE.ShaderMaterial({
    transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,
    vertexShader:`varying vec3 vNormal;varying vec3 vWorldPosition;void main(){vNormal=normalize(mat3(modelMatrix)*normal);vWorldPosition=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorldPosition,1.0);}`,
    fragmentShader:`varying vec3 vNormal;varying vec3 vWorldPosition;void main(){float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(cameraPosition-vWorldPosition))),4.5);gl_FragColor=vec4(.18,.45,.68,rim*.55);}`
  }));earthGroup.add(atmosphere);

  // An orbital grid gives the globe a quiet observatory feel.
  const gridMaterial = new THREE.LineBasicMaterial({color:0x9fcee8,transparent:true,opacity:.055,depthWrite:false});
  const geoPoints=[];
  for(let lat=-60;lat<=60;lat+=30){const phi=lat*Math.PI/180;for(let i=0;i<180;i++){for(const j of [i,i+1]){const theta=j/180*Math.PI*2;geoPoints.push(Math.cos(phi)*Math.cos(theta)*1.805,Math.sin(phi)*1.805,Math.cos(phi)*Math.sin(theta)*1.805);}}}
  for(let lon=0;lon<180;lon+=30){const theta=lon*Math.PI/180;for(let i=0;i<180;i++){for(const j of [i,i+1]){const phi=j/180*Math.PI*2;geoPoints.push(Math.cos(phi)*Math.cos(theta)*1.805,Math.sin(phi)*1.805,Math.cos(phi)*Math.sin(theta)*1.805);}}}
  const gridGeo = new THREE.BufferGeometry();gridGeo.setAttribute('position',new THREE.Float32BufferAttribute(geoPoints,3));earth.add(new THREE.LineSegments(gridGeo,gridMaterial));

  // Public-domain Natural Earth coastlines, kept local with the prototype.
  fetch('./assets/land.geojson').then(r=>r.json()).then(data=>{
    const pts=[];
    data.features.forEach(f=>{const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;polygons.forEach(poly=>poly.forEach(ring=>{for(let i=1;i<ring.length;i++){for(const [lon,lat] of [ring[i-1],ring[i]]){const phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;pts.push(-1.807*Math.sin(phi)*Math.cos(theta),1.807*Math.cos(phi),1.807*Math.sin(phi)*Math.sin(theta));}}}));});
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));landLines=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xb0d6dc,transparent:true,opacity:.075}));earth.add(landLines);
  }).catch(()=>{});

  // A few warm city lights on the night side.
  const cities=[[116,40],[121,31],[114,22],[139,36],[127,38],[77,28],[73,19],[31,30],[29,41],[37,56],[2,49],[-.1,51],[-74,41],[-87,42],[-118,34],[-122,38],[-99,19],[-46,-24],[-58,-35],[151,-34],[103,1],[106,-6],[100,14],[121,14],[55,25],[12,42],[13,52]];
  const cityPts=cities.flatMap(([lon,lat])=>{const phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;return[-1.812*Math.sin(phi)*Math.cos(theta),1.812*Math.cos(phi),1.812*Math.sin(phi)*Math.sin(theta)];});
  const cityGeo=new THREE.BufferGeometry();cityGeo.setAttribute('position',new THREE.Float32BufferAttribute(cityPts,3));earth.add(new THREE.Points(cityGeo,new THREE.PointsMaterial({color:0xf1d9a0,size:.017,transparent:true,opacity:.5,depthWrite:false})));

  starGroup = new THREE.Group();scene.add(starGroup);
  let seed=17;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  for(const [count,size,opacity] of [[950,.025,.47],[100,.046,.6]]){
    const pts=[];for(let i=0;i<count;i++){const t=random()*Math.PI*2,v=Math.acos(2*random()-1),r=35+random()*25;pts.push(r*Math.sin(v)*Math.cos(t),r*Math.sin(v)*Math.sin(t),r*Math.cos(v));}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));starGroup.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xb7cddd,size,transparent:true,opacity,sizeAttenuation:true,depthWrite:false})));
  }
  orbitGroup = new THREE.Group();scene.add(orbitGroup);
  for(const [radius,tilt,opacity] of [[3.38,.43,.14],[3.55,-.27,.055],[2.2,1.33,.045]]){
    const pts=[];for(let i=0;i<=220;i++){const a=i/220*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*radius,0,Math.sin(a)*radius));}
    const g=new THREE.BufferGeometry().setFromPoints(pts);const line=new THREE.Line(g,new THREE.LineBasicMaterial({color:0x7797b5,transparent:true,opacity}));line.rotation.z=tilt;line.rotation.x=.13;orbitGroup.add(line);
  }
  resize(); rendererReady=true;
}
try { setupThree(); } catch(error) {
  console.warn('WebGL fallback:',error.message);$('#planet-fallback').hidden=false;
  camera = new THREE.PerspectiveCamera(40,width/height,.1,180);resize();rendererReady=true;
  toast('当前设备使用轻量地球视图，卡片交互仍然可用。');
}
function resize(){
  width=innerWidth;height=innerHeight;
  camera.aspect=width/height;
  camera.position.set(0,0,Math.max(10.4, 5.3/(Math.tan(20*Math.PI/180)*camera.aspect)));
  camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  renderer?.setSize(width,height);
  if(earthGroup){earthGroup.position.y=.13;earthGroup.scale.setScalar(width<600?1.16:1);}
}
window.addEventListener('resize',resize);

const drag={active:false,moved:false,x:0,y:0,startX:0,startY:0};
$('#universe').addEventListener('pointerdown',e=>{
  if(busy || e.button!==0)return;unlockAudio();drag.active=true;drag.moved=false;
  drag.x=drag.startX=e.clientX;drag.y=drag.startY=e.clientY;hoveredId=null;
  $('#universe').classList.add('dragging');$('#universe').setPointerCapture(e.pointerId);
});
$('#universe').addEventListener('pointermove',e=>{
  if(!drag.active)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>4)drag.moved=true;
  targetYaw+=dx*.006;targetPitch=clamp(targetPitch+dy*.004,-.64,.64);
  drag.x=e.clientX;drag.y=e.clientY;
});
function endDrag(){drag.active=false;$('#universe').classList.remove('dragging');}
$('#universe').addEventListener('pointerup',endDrag);$('#universe').addEventListener('pointercancel',endDrag);

function basePosition(index,total){
  // Alternate upper and lower bands so cards read as an orbit, not a flat grid.
  const golden=Math.PI*(3-Math.sqrt(5));
  const sy=1-2*(index+.5)/Math.max(total,1);
  const radius=Math.sqrt(Math.max(0,1-sy*sy));
  const theta=index*golden;
  const v=new THREE.Vector3(Math.cos(theta)*radius*3.65,sy*2.85,Math.sin(theta)*radius*3.65);
  v.applyEuler(new THREE.Euler(pitch,yaw,.06));v.y+=.1;return v;
}
function projected(v){
  const p=v.clone().project(camera);
  return {x:(p.x*.5+.5)*width,y:(-.5*p.y+.5)*height,depth:v.z};
}
function assemblyPosition(v,index,now){
  if(flightStart===null)return {v,opacity:1,tilt:0};
  if(reducedMotion)return {v,opacity:1,tilt:0};
  const seconds=(now-flightStart)/1000;
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

function frame(now){
  requestAnimationFrame(frame);
  if(!running || activeDestination)return;
  const dt=Math.min((now-lastFrame)/1000 || .016,.05);lastFrame=now;elapsed+=dt;
  const interaction=hoveredId || drag.active || busy;
  const targetSpeed=autoOrbit&&!reducedMotion?(interaction?.003:.055):0;
  speed=lerp(speed,targetSpeed,1-Math.exp(-dt*4));targetYaw+=speed*dt;
  yaw=lerp(yaw,targetYaw,1-Math.exp(-dt*7));pitch=lerp(pitch,targetPitch,1-Math.exp(-dt*7));
  if(earth){
    planetRotation+=dt*(reducedMotion?0:.017);
    earth.rotation.y=planetRotation+yaw*.52;earth.rotation.x=pitch*.45;earth.rotation.z=.13;
    earthGroup.rotation.z=.015;
    starGroup.rotation.y=elapsed*.0004;
    orbitGroup.rotation.y=yaw*.3;
    earth.material.uniforms.time.value=elapsed;
    renderer.render(scene,camera);
  }
  if(flightStart!==null&&(reducedMotion || now-flightStart>3350+cards.length*35)){
    flightStart=null;busy=false;$('#replay-button').disabled=false;setStatus();
  }
  const earthScreen=projected(new THREE.Vector3(0,.13,0));
  const radiusPx=height*.5/Math.tan(20*Math.PI/180)*1.8/camera.position.z*(width<600?1.16:1);
  cards.forEach((card,index)=>{
    const node=elements.get(card.id);if(!node || card.closing)return;
    const target=basePosition(index,cards.length);
    let {v,opacity,tilt}=assemblyPosition(target,index,now);
    if(birth?.id===card.id){
      const t=ease(clamp((now-birth.start)/950,0,1));
      const from=new THREE.Vector3(0,-4,1.8);
      v=from.multiplyScalar(1-t).add(target.clone().multiplyScalar(t));v.x+=Math.sin(t*Math.PI)*1.4;v.z+=Math.sin(t*Math.PI)*1.3;
      opacity=clamp(t*4,0,1);
    }
    const p=projected(v);
    // Reserve the header and search bar while retaining perspective in depth.
    p.y = height * .46 + (p.y - height * .5) * (width < 700 ? .83 : .70);
    const depthScale=clamp(camera.position.z/(camera.position.z-v.z),.55,1.5);
    const focus=hoveredId===card.id;
    const targetScale=depthScale*(focus?1.24:1)*(width<480?.60:width<700?.76:.88);
    card.scale=lerp(card.scale??targetScale,targetScale,1-Math.exp(-dt*9));
    const distance=Math.hypot(p.x-earthScreen.x,p.y-earthScreen.y);
    const isBehindPlanet=v.z<0&&distance<radiusPx*.96;
    const atBack=v.z<-1.3;
    let alpha=opacity*(focus?1:hoveredId?.25:atBack?.57:.94);
    if(isBehindPlanet)alpha*=.03;
    card.alpha=lerp(card.alpha??alpha,alpha,1-Math.exp(-dt*9));
    if(enteringId===card.id)alpha=0;
    const tiltY=clamp(v.x*-4,-19,19),tiltX=clamp(v.y*2.5,-11,11);
    const spin=tilt+clamp(v.x*v.y*.23,-5,5);
    node.style.transform=`translate3d(${p.x}px,${p.y}px,0) translate(-50%,-50%) scale(${card.scale}) perspective(900px) rotateY(${tiltY}deg) rotateX(${tiltX}deg) rotate(${spin}deg)`;
    node.style.opacity=enteringId===card.id?'0':card.alpha.toFixed(3);
    node.style.zIndex=focus?'200':String(Math.round(40+v.z*5));
    node.style.pointerEvents=busy||isBehindPlanet?'none':'auto';
    node.classList.toggle('is-hovered',focus);
    node.setAttribute('aria-hidden',isBehindPlanet?'true':'false');
    node.tabIndex=isBehindPlanet||busy?-1:0;
    node.querySelector('.card-close').tabIndex=isBehindPlanet||busy?-1:0;
  });
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{running=!document.hidden;lastFrame=performance.now();});

function replay(){
  if(busy || activeDestination)return;
  hoveredId=null;keyboardFocusId=null;busy=true;flightStart=performance.now();flightKind='assembly';
  $('#replay-button').disabled=true;setStatus('REASSEMBLING YOUR UNIVERSE');whoosh('birth');
}
$('#replay-button').addEventListener('click',replay);

function puffCloud(rect){
  const fx=$('#flight-layer');
  for(let i=0;i<15;i++){
    const p=document.createElement('i');p.className='cloud-puff';
    p.style.left=`${rect.left+Math.random()*rect.width-25}px`;p.style.top=`${rect.top+Math.random()*rect.height-25}px`;
    fx.append(p);
    p.animate([{opacity:0,transform:'translate(0,0) scale(.3)'},{opacity:.55,offset:.22},{opacity:0,transform:`translate(${(Math.random()-.5)*150}px,${-25-Math.random()*65}px) scale(${1+Math.random()*1.6})`}],{duration:900+Math.random()*500,easing:'ease-out',fill:'forwards'}).finished.finally(()=>p.remove());
  }
}
function closeCard(id){
  if(busy)return;
  const index=cards.findIndex(c=>c.id===id),card=cards[index],node=elements.get(id);if(!card||card.closing||!node)return;
  unlockAudio();whoosh('close');card.closing=true;hoveredId=null;keyboardFocusId=null;
  const rect=node.getBoundingClientRect();puffCloud(rect);
  node.classList.add('is-closing');
  node.animate([{opacity:node.style.opacity,filter:'blur(0px)'},{opacity:0,filter:'blur(17px)',transform:node.style.transform+' scale(1.12)'}],{duration:reducedMotion?120:650,easing:'ease-out',fill:'forwards'}).finished.then(()=>{
    const clean={...card};delete clean.closing;delete clean.scale;delete clean.alpha;
    lastClosed={card:clean,index};cards=cards.filter(c=>c.id!==id);node.remove();elements.delete(id);updateCount();persist();
    toast(cards.length?`${card.title} 已化作星云`:'轨道已清空。搜索一个新的世界，或在设置中恢复示例。',true);
  });
}
$('#toast-undo').addEventListener('click',()=>{
  if(!lastClosed)return;cards.splice(Math.min(lastClosed.index,cards.length),0,lastClosed.card);createElement(lastClosed.card);
  hoveredId=lastClosed.card.id;lastClosed=null;updateCount();persist();toast('已回到轨道');
  setTimeout(()=>{if(!keyboardFocusId)hoveredId=null;},1400);
});

async function enterCard(id){
  if(busy)return;const card=cards.find(c=>c.id===id),node=elements.get(id);if(!card||!node)return;
  unlockAudio();whoosh('enter');busy=true;enteringId=id;hoveredId=id;
  $('#settings-panel').hidden=true;$('#settings-button').setAttribute('aria-expanded','false');
  const rect=node.getBoundingClientRect();
  const portal=document.createElement('div');portal.className='portal';portal.innerHTML=previewHTML(card);
  Object.assign(portal.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
  const preview=portal.firstElementChild;
  Object.assign(preview.style,{width:'192px',height:'135px',transformOrigin:'top left',transform:`scale(${rect.width/192})`});
  $('#flight-layer').append(portal);
  const duration=reducedMotion?150:980;
  const animation=portal.animate([
    {left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',borderRadius:'10px',filter:'brightness(1)'},
    {left:width*.4+'px',top:height*.4+'px',width:width*.2+'px',height:height*.2+'px',borderRadius:'16px',filter:'brightness(1.18)',offset:.2},
    {left:'-4px',top:'-4px',width:width+8+'px',height:height+8+'px',borderRadius:'0',filter:'brightness(1.05)'}
  ],{duration,easing:'cubic-bezier(.68,.02,.24,1)',fill:'forwards'});
  preview.animate([{transform:`scale(${rect.width/192})`},{transform:`scale(${Math.max(width/192,height/104)*1.12})`}],{duration,easing:'cubic-bezier(.68,.02,.24,1)',fill:'forwards'});
  await animation.finished.catch(()=>{});
  showDestination(card);portal.remove();enteringId=null;busy=false;
}
function showDestination(card){
  activeDestination=card.id;const panel=$('#destination');
  document.querySelectorAll('#universe,.topbar,.greeting,.search-area,.bottom-bar,.settings-panel').forEach(n=>n.inert=true);
  const query=card.query||card.title;
  const resultLinks=card.kind==='search'?`<div class="destination-results"><a class="result-link" href="${escapeHTML(card.url)}" target="_blank" rel="noopener noreferrer"><small>${escapeHTML(engine.toUpperCase())} · WEB SEARCH</small><h3>探索「${escapeHTML(query)}」</h3><p>打开真实搜索结果，继续这个新的发现。 ↗</p></a><a class="result-link" href="https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer"><small>WIKIPEDIA · ANOTHER PERSPECTIVE</small><h3>从一个问题开始</h3><p>在维基百科中查找「${escapeHTML(query)}」。 ↗</p></a></div>`:`<div class="destination-art">${previewHTML(card)}</div>`;
  panel.innerHTML=`<nav class="destination-nav"><button class="back-orbit"><span>←</span> 返回轨道</button><span class="destination-address">${escapeHTML(card.url)}</span><a class="open-real" href="${escapeHTML(card.url)}" target="_blank" rel="noopener noreferrer">${card.kind==='search'?'打开真实搜索结果':'打开真实网页'} ↗</a></nav><main class="destination-content"><div class="destination-eyebrow">YOU HAVE ARRIVED · ${escapeHTML((card.domain||'A NEW WORLD').toUpperCase())}</div><h1 class="destination-brand"><span class="card-favicon" style="--site-color:${card.color||'#a7cce2'}">${escapeHTML(card.symbol||'↗')}</span>${escapeHTML(card.title)}</h1><p>${escapeHTML(card.description || (card.kind==='search'?`关于「${query}」的探索，已经开始。选择下面的入口，前往真实搜索结果。`:'一个新的世界，已加入你的轨道。继续探索，或随时返回。'))}</p>${resultLinks}<div class="destination-footer"><span>你已进入示例页面。真实网页会在新窗口打开。<br>按 Esc，或点击左上角，回到你的宇宙。</span><button class="destination-back">回到地球，继续探索 ↗</button></div></main>`;
  panel.hidden=false;panel.scrollTop=0;
  panel.querySelector('.back-orbit').addEventListener('click',returnOrbit);
  panel.querySelector('.destination-back').addEventListener('click',returnOrbit);
  panel.querySelector('.back-orbit').focus({preventScroll:true});
}
function returnOrbit(){
  if(!activeDestination)return;const id=activeDestination;activeDestination=null;$('#destination').hidden=true;$('#destination').innerHTML='';
  document.querySelectorAll('#universe,.topbar,.greeting,.search-area,.bottom-bar,.settings-panel').forEach(n=>n.inert=false);
  hoveredId=null;busy=false;lastFrame=performance.now();elements.get(id)?.focus({preventScroll:true});
  keyboardFocusId=null;hoveredId=null;
}

function searchURL(query){
  const trimmed=query.trim();
  if(/^(https?:\/\/)/i.test(trimmed)){
    try{const u=new URL(trimmed);if(!u.hostname)throw Error();return {url:u.href,domain:u.hostname,kind:'web',title:u.hostname.replace(/^www\./,'')};}catch{return null;}
  }
  if(/^[\w-]+(\.[\w-]+)+(\/[\S]*)?$/.test(trimmed)){
    const u=new URL('https://'+trimmed);return{url:u.href,domain:u.hostname,kind:'web',title:u.hostname.replace(/^www\./,'')};
  }
  if(/^[a-z][a-z\d+.-]*:/i.test(trimmed))return null;
  const base={Bing:'https://www.bing.com/search?q=',Google:'https://www.google.com/search?q=',DuckDuckGo:'https://duckduckgo.com/?q='}[engine];
  return{url:base+encodeURIComponent(trimmed),domain:new URL(base).hostname,kind:'search',title:trimmed,query:trimmed};
}
$('#search-form').addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;
  const query=$('#search-input').value.trim();
  if(!query){toast('输入一个关键词或网址，让新的世界诞生。');$('#search-input').focus();return;}
  if(cards.length>=36){toast('当前轨道已满。先关闭一些卡片，再探索新世界。');return;}
  const info=searchURL(query);if(!info){toast('请使用有效的 http / https 网址，或输入搜索词。');return;}
  unlockAudio();whoosh('birth');hoveredId=null;busy=true;setStatus('A NEW WORLD IS BORN');
  const card={...info,id:'new-'+Date.now()+'-'+Math.random().toString(36).slice(2,5),symbol:info.kind==='web'?'↗':'⌕',color:'#bdd8e5'};
  cards.push(card);createElement(card);updateCount();persist();
  birth={id:card.id,start:performance.now()};
  $('#search-form').classList.add('is-birthing');$('#search-input').value='';$('#search-input').blur();
  const r=$('#search-form').getBoundingClientRect();
  const blob=document.createElement('i');blob.className='cloud-puff';Object.assign(blob.style,{left:r.left+r.width/2-25+'px',top:r.top-12+'px',width:'70px',height:'45px'});$('#flight-layer').append(blob);
  blob.animate([{opacity:.2,transform:'scale(.4)'},{opacity:.8,transform:'translateY(-30px) scale(1.2)',offset:.4},{opacity:0,transform:'translateY(-110px) scale(.2)'}],{duration:reducedMotion?100:950,easing:'ease-in-out',fill:'forwards'}).finished.then(()=>blob.remove());
  await new Promise(resolve=>setTimeout(resolve,reducedMotion?180:1300));
  birth=null;busy=false;hoveredId=card.id;$('#search-form').classList.remove('is-birthing');setStatus();
  enterCard(card.id);
});

$('#engine-button').addEventListener('click',()=>{const menu=$('#engine-menu');menu.hidden=!menu.hidden;$('#engine-button').setAttribute('aria-expanded',String(!menu.hidden));});
$('#engine-menu').addEventListener('click',e=>{const button=e.target.closest('[data-engine]');if(!button)return;engine=button.dataset.engine;$('#engine-button').innerHTML=`${engine} <span>⌄</span>`;$('#engine-menu').hidden=true;$('#engine-button').setAttribute('aria-expanded','false');persist();$('#search-input').focus();});
$('#engine-button').innerHTML=`${engine} <span>⌄</span>`;
function syncSound(){
  $('#sound-button').classList.toggle('sound-muted',!soundEnabled);$('#sound-button').setAttribute('aria-pressed',String(soundEnabled));
  $('#sound-button').setAttribute('aria-label',soundEnabled?'关闭声效':'开启声效');$('#sound-button').title=soundEnabled?'声效开启':'声效关闭';
}
syncSound();$('#sound-button').addEventListener('click',()=>{soundEnabled=!soundEnabled;syncSound();persist();if(soundEnabled){unlockAudio();whoosh('birth');}toast(soundEnabled?'声效已开启 · 戴上耳机，感受掠过':'声效已关闭');});
$('#settings-button').addEventListener('click',()=>{const panel=$('#settings-panel');panel.hidden=!panel.hidden;$('#settings-button').setAttribute('aria-expanded',String(!panel.hidden));});
$('#auto-orbit').checked=autoOrbit;$('#reduce-motion').checked=reducedMotion;
$('#auto-orbit').addEventListener('change',e=>{autoOrbit=e.target.checked;persist();});
$('#reduce-motion').addEventListener('change',e=>{reducedMotion=e.target.checked;persist();if(reducedMotion && flightStart!==null){flightStart=null;busy=false;$('#replay-button').disabled=false;setStatus();}});
$('#reset-button').addEventListener('click',()=>{
  if(busy){toast('请等当前飞行结束，再恢复轨道。');return;}
  cards=defaults.map(c=>({...c}));elements.forEach(n=>n.remove());elements.clear();cards.forEach(createElement);lastClosed=null;
  updateCount();persist();$('#settings-panel').hidden=true;$('#settings-button').setAttribute('aria-expanded','false');replay();toast('12 个示例世界已回到轨道');
});
const help=$('#help-dialog');
$('#help-button').addEventListener('click',()=>{hoveredId=null;help.showModal();});
help.querySelector('.dialog-close').addEventListener('click',()=>help.close());$('#start-exploring').addEventListener('click',()=>help.close());
help.addEventListener('click',e=>{if(e.target===help){const r=help.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)help.close();}});
document.addEventListener('click',e=>{
  if(!e.target.closest('#settings-panel,#settings-button')){$('#settings-panel').hidden=true;$('#settings-button').setAttribute('aria-expanded','false');}
  if(!e.target.closest('#engine-menu,#engine-button')){$('#engine-menu').hidden=true;$('#engine-button').setAttribute('aria-expanded','false');}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){returnOrbit();$('#settings-panel').hidden=true;$('#settings-button').setAttribute('aria-expanded','false');$('#engine-menu').hidden=true;$('#engine-button').setAttribute('aria-expanded','false');hoveredId=null;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)&&!activeDestination){if(lastClosed){e.preventDefault();$('#toast-undo').click();}}
});
function updateClock(){const now=new Date();$('#clock').textContent=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});$('#date').textContent=now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'2-digit'}).toUpperCase();}
updateClock();setInterval(updateClock,15000);

window.addEventListener('load',()=>{
  setTimeout(()=>{const loading=$('#loading');loading.style.opacity='0';setTimeout(()=>loading.remove(),700);replay();},250);
});
// Keep the application useful even when a browser skips a cached load event.
if(document.readyState==='complete')setTimeout(()=>{if($('#loading')){$('#loading').remove();replay();}},300);
