const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class OrbitAudio{
  constructor(enabled=true){this.enabled=enabled;this.ctx=null;this.flight=null;this.lastHover=0;}
  unlock(){
    try{
      if(!this.ctx){
        this.ctx=new(window.AudioContext||window.webkitAudioContext)();
        const ctx=this.ctx;this.master=ctx.createGain();this.master.gain.value=.64;
        const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-15;limiter.knee.value=12;limiter.ratio.value=4;
        this.master.connect(limiter).connect(ctx.destination);
        this.reverb=ctx.createConvolver();const impulse=ctx.createBuffer(2,ctx.sampleRate*2.8,ctx.sampleRate);
        for(let ch=0;ch<2;ch++){const d=impulse.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3.5)*.35;}
        this.reverb.buffer=impulse;const wet=ctx.createGain();wet.gain.value=.27;this.reverb.connect(wet).connect(this.master);
        const b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=b.getChannelData(0);let p=0;
        for(let i=0;i<d.length;i++){p=(p+(Math.random()*2-1)*.04)/1.04;d[i]=p*4;}
        this.noiseBuffer=b;
      }
      if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
      return this.ctx;
    }catch{return null;}
  }
  bus(wet=.25,pan=0){const ctx=this.ctx,g=ctx.createGain(),p=ctx.createStereoPanner();p.pan.value=pan;g.connect(p).connect(this.master);if(wet){const w=ctx.createGain();w.gain.value=wet;g.connect(w).connect(this.reverb);}return g;}
  tone(freq,duration,volume,{end=freq,type='sine',delay=0,attack=.03,pan=0,wet=.4}={}){
    const ctx=this.ctx,now=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
    osc.type=type;osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(Math.max(15,end),now+duration);
    filter.type='lowpass';filter.frequency.value=type==='sawtooth'?680:2200;filter.Q.value=.4;
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+Math.min(attack,duration*.4));gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(filter).connect(gain).connect(this.bus(wet,pan));osc.start(now);osc.stop(now+duration+.05);
  }
  noise(duration,volume,{from=180,to=50,pan=-.7,endPan=.7,type='lowpass',wet=.2}={}){
    const c=this.ctx,n=c.currentTime,source=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain(),p=c.createStereoPanner();
    source.buffer=this.noiseBuffer;source.loop=true;filter.type=type;filter.Q.value=.6;filter.frequency.setValueAtTime(from,n);filter.frequency.exponentialRampToValueAtTime(Math.max(20,to),n+duration);
    g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(volume,n+duration*.25);g.gain.exponentialRampToValueAtTime(.0001,n+duration);
    p.pan.setValueAtTime(pan,n);p.pan.linearRampToValueAtTime(endPan,n+duration);
    source.connect(filter).connect(g).connect(p).connect(this.bus(wet));source.start(n);source.stop(n+duration+.1);
  }
  play(kind){
    if(!this.enabled||!this.unlock()||this.ctx.state!=='running')return;
    if(kind==='hover'){
      if(performance.now()-this.lastHover<300)return;this.lastHover=performance.now();
      // An original, quiet open-fifth brass pad, softened by a long room tail.
      [110,164.8138,220.12].forEach((f,i)=>this.tone(f,1.15,.012/(i+1),{type:'sawtooth',attack:.18,delay:i*.025,wet:1.15,pan:(i-1)*.2}));
    }else if(kind==='magnet'){
      this.tone(320,.27,.08,{end:72,type:'triangle',attack:.012,wet:.3});this.tone(740,.6,.025,{end:660,delay:.1,wet:.8});this.noise(.32,.11,{from:1100,to:80,type:'bandpass',pan:-.15,endPan:0});
    }else if(kind==='enter'){
      this.noise(1.15,.24,{from:260,to:42,pan:-.85,endPan:.85,wet:.35});this.tone(46,1.2,.12,{end:25,attack:.3,wet:.25});this.tone(69,1,.035,{end:38,attack:.25});
    }else if(kind==='return'){
      this.noise(1.3,.19,{from:330,to:35,pan:0,endPan:.95,wet:.5});this.tone(58,1.25,.07,{end:21,attack:.05,wet:.8});
    }else if(kind==='close')this.noise(.9,.09,{from:420,to:65,pan:0,endPan:-.4,wet:.8});
    else if(kind==='birth'){this.tone(90,.85,.035,{end:220,attack:.12,wet:.8});this.noise(.8,.09,{from:130,to:700,pan:0,endPan:.2});}
  }
  toggle(next){
    const ctx=this.unlock();if(ctx){this.tone(next?440:523.25,.8,.035,{end:next?523.25:392,attack:.1,wet:1.3});this.tone(next?880:1046.5,.95,.008,{end:next?1046.5:783.99,attack:.12,wet:1.5});this.noise(.55,.035,{from:1600,to:400,type:'highpass',pan:0,endPan:0,wet:1.2});}
    this.enabled=next;if(!next)this.stopFlight();
  }
  updateFlight({speed=0,radial=0,pan=0,proximity=.5}){
    if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
    const c=this.ctx,n=c.currentTime;
    if(!this.flight){
      const source=c.createBufferSource();source.buffer=this.noiseBuffer;source.loop=true;
      const filter=c.createBiquadFilter();filter.type='lowpass';filter.Q.value=.5;
      const gain=c.createGain();gain.gain.value=0;const stereo=c.createStereoPanner();
      const sub=c.createOscillator();sub.type='sine';sub.frequency.value=38;const subGain=c.createGain();subGain.gain.value=0;
      source.connect(filter).connect(gain).connect(stereo).connect(this.master);sub.connect(subGain).connect(stereo);source.start();sub.start();
      this.flight={source,filter,gain,stereo,sub,subGain};
    }
    const f=this.flight,doppler=clamp(24/(24+radial),.62,1.65),energy=clamp(speed/13,0,1)*proximity;
    f.source.playbackRate.setTargetAtTime(doppler,n,.08);f.filter.frequency.setTargetAtTime((100+energy*430)*doppler,n,.08);
    f.sub.frequency.setTargetAtTime(38*doppler,n,.08);f.gain.gain.setTargetAtTime(energy*.25,n,.1);f.subGain.gain.setTargetAtTime(energy*.065,n,.1);f.stereo.pan.setTargetAtTime(clamp(pan,-1,1),n,.06);
  }
  stopFlight(){
    if(!this.flight)return;const f=this.flight,c=this.ctx,n=c.currentTime;this.flight=null;
    f.gain.gain.cancelScheduledValues(n);f.gain.gain.setTargetAtTime(0,n,.08);f.subGain.gain.cancelScheduledValues(n);f.subGain.gain.setTargetAtTime(0,n,.08);
    f.source.stop(n+.4);f.sub.stop(n+.4);
  }
}
