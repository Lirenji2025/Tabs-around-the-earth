import * as THREE from './assets/three.module.js';
import {planets} from './planets.js';
import {trackballPoint,ArcballRotation} from './arcball.js';
export function createGlobe(notify=()=>{}){
const $=s=>document.querySelector(s);
let width=innerWidth,height=innerHeight,scene,camera,renderer,earth,earthGroup,starGroup,atmosphere,orbitGroup,landLines,rendererReady=false;
let rotation=.9;
let planetId='earth',earthTexture,generatedTexture,rings,assetGeneration=0;
const userRotation=new ArcballRotation();
const initialOrientation=new THREE.Quaternion().setFromEuler(new THREE.Euler(.36,.252,.36,'YXZ'));
function dragPoint(x,y){
  const center=new THREE.Vector3(0,.26,0).project(camera);
  const radius=height*.5/Math.tan(20*Math.PI/180)*1.8/camera.position.z*(width<600?1.45:1.30);
  return trackballPoint(x,y,width/2,(-center.y*.5+.5)*height,Math.max(80,radius*1.35));
}
const toast=notify;
function setupThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40,width/height,.1,180);
  renderer = new THREE.WebGLRenderer({canvas:$('#space'),antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(width,height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  earthGroup = new THREE.Group(); scene.add(earthGroup);
  const texture = new THREE.TextureLoader().load('./assets/earth.jpg', () => {rendererReady=true;}, undefined, () => {rendererReady=true;toast('地球纹理暂不可用，轨道仍可使用。');});
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy=4;
  earthTexture=texture;
  const material = new THREE.ShaderMaterial({
    uniforms:{map:{value:texture},earthMode:{value:1},sunDirection:{value:new THREE.Vector3(-.75,.5,1.2).normalize()},time:{value:0}},
    vertexShader:`varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;void main(){vUv=uv;vNormal=normalize(mat3(modelMatrix)*normal);vPosition=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vPosition,1.0);}`,
    fragmentShader:`uniform sampler2D map;uniform float earthMode;uniform vec3 sunDirection;uniform float time;varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;void main(){vec3 n=normalize(vNormal);vec3 c=texture2D(map,vUv).rgb;float daylight=smoothstep(-.3,.85,dot(n,sunDirection));float land=smoothstep(.02,.17,c.g-c.b*.64);vec3 ocean=vec3(.027,.085,.135)+c*vec3(.16,.33,.46);vec3 terrain=mix(ocean,mix(c,vec3(.31,.42,.42),.56),land*.7);terrain=mix(c,terrain,earthMode);vec3 color=terrain*(.13+daylight*1.05);float fresnel=pow(1.0-max(0.0,dot(n,normalize(cameraPosition-vPosition))),3.4);color+=vec3(.055,.15,.23)*fresnel*(.3+daylight*.7);gl_FragColor=vec4(color,1.0);}`
  });
  earth = new THREE.Mesh(new THREE.SphereGeometry(1.8,96,64),material);earth.rotation.y=.9;earthGroup.add(earth);
  rings=new THREE.Group();earthGroup.add(rings);rings.rotation.x=Math.PI/2;rings.visible=false;
  const ringMap=new THREE.TextureLoader().load('./assets/planets/8k_saturn_ring_alpha.png');ringMap.colorSpace=THREE.SRGBColorSpace;ringMap.anisotropy=8;
  const ringGeometry=new THREE.RingGeometry(2.1,3.55,256,1),ringPositions=ringGeometry.attributes.position,ringUV=ringGeometry.attributes.uv;
  for(let i=0;i<ringPositions.count;i++){const radius=Math.hypot(ringPositions.getX(i),ringPositions.getY(i));ringUV.setXY(i,(radius-2.1)/1.45,.5);}
  rings.add(new THREE.Mesh(ringGeometry,new THREE.MeshBasicMaterial({map:ringMap,color:0xddd7cb,transparent:true,alphaTest:.025,side:THREE.DoubleSide,depthWrite:false})));
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
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));landLines=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xb0d6dc,transparent:true,opacity:.075}));landLines.visible=planetId==='earth';earth.add(landLines);
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

function resize(){
width=innerWidth;height=innerHeight;
camera.aspect=width/height;camera.position.set(0,0,Math.max(11.2,5.7/(Math.tan(20*Math.PI/180)*camera.aspect)));camera.lookAt(0,0,0);camera.updateProjectionMatrix();renderer?.setSize(width,height);
if(earthGroup){earthGroup.position.y=.26;earthGroup.scale.setScalar(width<600?1.45:1.30);}
}
try{setupThree();}catch(error){$('#planet-fallback').hidden=false;camera=new THREE.PerspectiveCamera(40,width/height,.1,180);resize();notify('已启用轻量地球视图，卡片交互仍可使用。');}
window.addEventListener('resize',resize);
return{
beginDrag(x,y){userRotation.begin(dragPoint(x,y));},
dragTo(x,y){userRotation.move(dragPoint(x,y));},
endDrag(){userRotation.end();},
setPlanet(id){
  const p=planets.find(p=>p.id===id)||planets[2];planetId=p.id;const generation=++assetGeneration;
  const fallback=$('.fallback-planet');fallback.style.backgroundImage=`url("${p.texture||'./assets/earth.jpg'}")`;
  if(!earth)return;
  earth.material.uniforms.earthMode.value=p.id==='earth'?1:0;
  if(p.id==='earth'){generatedTexture?.dispose();generatedTexture=null;earth.material.uniforms.map.value=earthTexture;$('#space').dataset.texture='earth';}
  else{
    $('#space').dataset.texture='loading';
    new THREE.TextureLoader().load(p.texture,texture=>{
      if(generation!==assetGeneration){texture.dispose();return;}
      texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      generatedTexture?.dispose();generatedTexture=texture;earth.material.uniforms.map.value=texture;
      $('#space').dataset.texture=p.id;
    },undefined,()=>{if(generation===assetGeneration){$('#space').dataset.texture='error';toast(`${p.name}高清纹理加载失败，请重新选择。`);}});
  }
  earth.children.forEach(n=>n.visible=p.id==='earth');rings.visible=p.id==='saturn';atmosphere.visible=p.id==='earth';
},
project(v){const p=v.clone().project(camera);return{x:(p.x*.5+.5)*width,y:(-.5*p.y+.5)*height,depth:v.z};},
get radius(){return height*.5/Math.tan(20*Math.PI/180)*1.8/camera.position.z*(width<600?1.45:1.30);},
render(dt,{yaw,pitch,time,reduced,row}){
  if(!earth)return;rotation+=dt*(reduced?0:.012);
  // Shared axial orientation keeps the surface, atmosphere and rings together.
  earthGroup.quaternion.copy(initialOrientation).premultiply(userRotation.orientation);earth.rotation.set(0,rotation,0);
  $('#space').dataset.orientation=earthGroup.quaternion.toArray().map(v=>v.toFixed(4)).join(',');
  $('#space').dataset.ringNormal=new THREE.Vector3(0,1,0).applyQuaternion(earthGroup.quaternion).toArray().map(v=>v.toFixed(4)).join(',');
  starGroup.rotation.y=time*.0004;orbitGroup.rotation.y=yaw*.3;orbitGroup.visible=row<.98;earth.material.uniforms.time.value=time;renderer.render(scene,camera);
},
camera
};
}
