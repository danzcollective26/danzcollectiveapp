import type { Race } from './engine'

/** Original synthesis: engine, tire noise, start lights, boost and lap cues. */
export class KartAudio {
  private context:AudioContext|null=null
  private engine:OscillatorNode|null=null
  private harmonic:OscillatorNode|null=null
  private motor:GainNode|null=null
  private tires:GainNode|null=null
  private master:GainNode|null=null
  private source:AudioBufferSourceNode|null=null
  private lap=0
  private count=0
  private boosted=false
  private phase='ready'
  private timer:ReturnType<typeof setTimeout>|null=null
  start(){
    if(this.timer){clearTimeout(this.timer);this.timer=null}
    if(!this.context){
      const Audio=window.AudioContext??(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext
      if(!Audio)return
      const ctx=this.context=new Audio(),master=this.master=ctx.createGain();master.gain.value=.32;master.connect(ctx.destination)
      const motor=this.motor=ctx.createGain(),filter=ctx.createBiquadFilter();motor.gain.value=0;filter.type='lowpass';filter.frequency.value=800;filter.Q.value=.8;motor.connect(filter);filter.connect(master)
      this.engine=ctx.createOscillator();this.engine.type='sawtooth';this.engine.frequency.value=50;this.engine.connect(motor);this.engine.start()
      const h=this.harmonic=ctx.createOscillator();h.type='triangle';h.frequency.value=76;h.detune.value=7;h.connect(motor);h.start()
      const buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),data=buffer.getChannelData(0)
      let seed=42;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*.65}
      const source=this.source=ctx.createBufferSource();source.buffer=buffer;source.loop=true
      const band=ctx.createBiquadFilter();band.type='bandpass';band.frequency.value=1700;band.Q.value=.8
      this.tires=ctx.createGain();this.tires.gain.value=0;source.connect(band);band.connect(this.tires);this.tires.connect(master);source.start()
    }
    if(this.context.state==='suspended')void this.context.resume().catch(()=>{})
  }
  private tone(frequency:number,duration=.12,delay=0){
    const ctx=this.context;if(!ctx||ctx.state!=='running'||!this.master)return
    const oscillator=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+delay
    oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,at);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.2,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+duration)
    oscillator.connect(gain);gain.connect(this.master);oscillator.start(at);oscillator.stop(at+duration+.02);oscillator.onended=()=>{gain.disconnect();oscillator.disconnect()}
  }
  tick(s:Race,enabled:boolean){
    const ctx=this.context;if(!ctx||ctx.state!=='running')return
    const car=s.cars[0],now=ctx.currentTime,playing=s.phase==='playing'&&enabled
    this.engine?.frequency.setTargetAtTime(48+car.speed*.62,now,.08);this.harmonic?.frequency.setTargetAtTime(72+car.speed*.93,now,.1)
    this.motor?.gain.setTargetAtTime(playing ? .035+car.speed*.0001 : 0,now,.06);this.tires?.gain.setTargetAtTime(playing&&car.drifting ? .08 : 0,now,.035)
    const count=Math.ceil(s.countdown/1000)
    if(enabled&&s.phase==='countdown'&&count!==this.count)this.tone(270,.09)
    if(enabled&&this.phase==='countdown'&&s.phase==='playing')this.tone(810,.32)
    if(enabled&&car.boosting>0&&!this.boosted){this.tone(440,.12);this.tone(880,.2,.08)}
    if(enabled&&car.laps>this.lap&&s.phase!=='finished'){this.tone(660,.15);this.tone(990,.18,.13)}
    if(enabled&&s.phase==='finished'&&this.phase!=='finished'){
      for(const [i,note] of [523,659,784,1047].entries())this.tone(note,.24,i*.12)
      this.timer=setTimeout(()=>this.pause(),900)
    }
    this.phase=s.phase;this.count=count;this.lap=car.laps;this.boosted=car.boosting>0
  }
  pause(){
    const ctx=this.context;if(!ctx)return
    this.motor?.gain.cancelScheduledValues(ctx.currentTime);this.motor?.gain.setValueAtTime(0,ctx.currentTime);this.tires?.gain.cancelScheduledValues(ctx.currentTime);this.tires?.gain.setValueAtTime(0,ctx.currentTime)
    if(ctx.state==='running')void ctx.suspend().catch(()=>{})
  }
  destroy(){if(this.timer)clearTimeout(this.timer);this.engine?.stop();this.harmonic?.stop();this.source?.stop();if(this.context)void this.context.close().catch(()=>{});this.context=null}
}
