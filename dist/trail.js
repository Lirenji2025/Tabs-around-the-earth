// A sparse constellation fitted to recent pointer samples, with no input capture.
export class ConstellationTrail {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.points=[];this.w=0;this.h=0;}
  add(x,y,t){
    const last=this.points.at(-1);
    if(last&&Math.hypot(x-last.x,y-last.y)<36)return;
    this.points.push({x,y,t,break:!last||t-last.t>350||Math.hypot(x-last.x,y-last.y)>240});
    if(this.points.length>8)this.points.shift();
    let length=0;for(let i=this.points.length-1;i>0;i--){if(!this.points[i].break)length+=Math.hypot(this.points[i].x-this.points[i-1].x,this.points[i].y-this.points[i-1].y);if(length>230){this.points.splice(0,i);break;}}
  }
  render(now,w,h,disabled){
    const ctx=this.ctx;if(!ctx)return;
    if(this.w!==w||this.h!==h){this.w=w;this.h=h;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=w*d;this.canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}
    ctx.clearRect(0,0,w,h);
    this.points=this.points.filter(p=>now-p.t<850);
    if(disabled){this.points=[];return;}
    this.canvas.dataset.stars=this.points.length;
    ctx.lineWidth=.7;
    for(let i=0;i<this.points.length;i++){
      const p=this.points[i],a=Math.min(1,(850-(now-p.t))/550);
      ctx.strokeStyle=`rgba(170,211,242,${a*.42})`;
      if(i&&!p.break){const prev=this.points[i-1];ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();}
      // Occasional chords turn the sampled path into angular constellations.
      if(i>2&&i%3===0&&!p.break&&!this.points[i-1].break){const prev=this.points[i-2];if(Math.hypot(p.x-prev.x,p.y-prev.y)<155){ctx.strokeStyle=`rgba(170,211,242,${a*.18})`;ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();}}
      ctx.shadowColor='#c4e9ff';ctx.shadowBlur=9;ctx.fillStyle=`rgba(221,242,255,${a*.85})`;ctx.beginPath();ctx.arc(p.x,p.y,i%4===0?1.8:1.15,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      if(i%4===0){ctx.strokeStyle=`rgba(204,232,255,${a*.4})`;ctx.beginPath();ctx.moveTo(p.x-4,p.y);ctx.lineTo(p.x+4,p.y);ctx.moveTo(p.x,p.y-4);ctx.lineTo(p.x,p.y+4);ctx.stroke();}
    }
  }
}
