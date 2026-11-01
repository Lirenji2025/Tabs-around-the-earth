export const planets = [
  {id:'mercury',name:'水星',label:'MERCURY',description:'离太阳最近的岩石世界。',colors:['#625b53','#aaa49a','#81796e'],kind:'rock'},
  {id:'venus',name:'金星',label:'VENUS',description:'金色云海，藏着炽热的世界。',colors:['#92734c','#d9bb83','#af915f'],kind:'cloud'},
  {id:'earth',name:'地球',label:'EARTH',description:'我们的起点，也是归处。',colors:['#21516c','#738b7b'],kind:'earth'},
  {id:'mars',name:'火星',label:'MARS',description:'红色荒原，下一站的想象。',colors:['#7e3928','#c47d50','#a95737'],kind:'rock'},
  {id:'jupiter',name:'木星',label:'JUPITER',description:'条纹云带中的巨大风暴。',colors:['#b79c7f','#ead4ac','#896b58','#d2b08a'],kind:'bands'},
  {id:'saturn',name:'土星',label:'SATURN',description:'把光与尘埃，留在环里。',colors:['#a8946c','#ddcba0','#c3b58f'],kind:'bands'},
  {id:'uranus',name:'天王星',label:'URANUS',description:'遥远而安静的青色冰巨星。',colors:['#67a4ad','#a0d2cf','#7bb9c0'],kind:'cloud'},
  {id:'neptune',name:'海王星',label:'NEPTUNE',description:'深蓝色的风，来自远方。',colors:['#204780','#376bb8','#5084ca'],kind:'bands'}
];
// Original illustrative maps, generated locally; not scientific surface maps.
export function planetTexture(planet){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d');
  let seed=planet.id.split('').reduce((n,s)=>n+s.charCodeAt(0),0);const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  c.fillStyle=planet.colors[0];c.fillRect(0,0,1024,512);
  if(planet.kind==='bands'||planet.kind==='cloud'){
    for(let y=0;y<512;y+=2){c.fillStyle=planet.colors[Math.floor(random()*planet.colors.length)];c.globalAlpha=planet.kind==='bands'?.18+.45*Math.sin(y*.11)**2:.12;c.beginPath();c.moveTo(0,y);for(let x=0;x<=1024;x+=16)c.lineTo(x,y+Math.sin(x/1024*Math.PI*4+y*.08)*5);c.lineTo(1024,y+12);c.lineTo(0,y+12);c.fill();}
  }else{
    for(let i=0;i<1700;i++){const x=random()*1024,y=random()*512,r=1+random()*24;c.globalAlpha=.08+random()*.18;c.fillStyle=planet.colors[Math.floor(random()*planet.colors.length)];c.beginPath();c.ellipse(x,y,r,r*.75,0,0,Math.PI*2);c.fill();c.strokeStyle='#21140f';c.lineWidth=.8;c.stroke();}
  }
  if(planet.id==='jupiter'){c.globalAlpha=.65;c.fillStyle='#a46649';c.beginPath();c.ellipse(700,325,55,22,-.05,0,Math.PI*2);c.fill();c.strokeStyle='#ebc39b';c.lineWidth=5;c.stroke();}
  if(planet.id==='mars'){c.globalAlpha=.65;c.fillStyle='#eee0c9';c.fillRect(0,0,1024,12);c.fillRect(0,502,1024,10);}
  c.globalAlpha=1;return canvas;
}
