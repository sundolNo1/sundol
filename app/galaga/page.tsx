"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const CW = 400, CH = 600;
const FORM_OSC  = 25;
const ENTRY_SPD = 1.3;

type EType  = "bee"|"butterfly"|"boss";
type EState = "waiting"|"entering"|"formation"|"diving"|"dead";
type GS     = "idle"|"entering"|"playing"|"stageclear"|"over";

function fpos(row: number, col: number): [number,number] {
  if (row === 0) { const sx=(CW-8*36)/2+18; return [sx+col*36, 75]; }
  const sx=(CW-10*34)/2+17; return [sx+col*34, 75+row*36];
}
function rowType(r: number): EType { return r===0?"boss":r<=2?"butterfly":"bee"; }

/* ══════════════════════════════════════════════════════════
   AUDIO  (Web Audio API — lazy init, SSR-safe)
══════════════════════════════════════════════════════════ */
let _actx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_actx) _actx = new AudioContext();
    if (_actx.state === "suspended") _actx.resume();
    return _actx;
  } catch { return null; }
}

function tone(freq: number, dur: number, type: OscillatorType = "square", vol = 0.1, freqEnd?: number) {
  const ctx = ac(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd !== undefined)
    o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.start(); o.stop(ctx.currentTime + dur);
}

function noiseBurst(centerFreq: number, dur: number, vol = 0.15) {
  const ctx = ac(); if (!ctx) return;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), g = ctx.createGain();
  flt.type = "bandpass"; flt.frequency.value = centerFreq; flt.Q.value = 0.8;
  src.buffer = buf;
  src.connect(flt); flt.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  src.start(); src.stop(ctx.currentTime + dur);
}

const sfx = {
  fire:       () => tone(820, 0.07, "square", 0.07, 260),
  hit:        () => noiseBurst(480, 0.09, 0.09),
  explSmall:  () => { noiseBurst(240, 0.17, 0.18); tone(150, 0.17, "sawtooth", 0.06, 35); },
  explBig:    () => { noiseBurst(85,  0.38, 0.26); tone(75,  0.38, "sawtooth", 0.09, 18); },
  playerDie:  () => { noiseBurst(130, 0.55, 0.28); tone(210, 0.45, "sawtooth", 0.09, 25); },
  beam:       () => { tone(85, 0.7, "sine", 0.12, 130); tone(170, 0.35, "sine", 0.05, 55); },
  stageClear: () => {
    const ctx = ac(); if (!ctx) return;
    [[523,0],[659,0.13],[784,0.26],[1047,0.40]].forEach(([f,t]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "square"; o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime + t);
      g.gain.setValueAtTime(0.08, ctx.currentTime + t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.18);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2);
    });
  },
};

/* ══════════════════════════════════════════════════════════
   HI-SCORE
══════════════════════════════════════════════════════════ */
const HI_KEY = "galaga_hi";
function loadHi(): number {
  if (typeof localStorage === "undefined") return 0;
  return parseInt(localStorage.getItem(HI_KEY) || "0", 10) || 0;
}
function saveHi(score: number): boolean {
  if (typeof localStorage === "undefined") return false;
  const hi = loadHi();
  if (score > hi) { localStorage.setItem(HI_KEY, String(score)); return true; }
  return false;
}

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface Enemy {
  id: number; type: EType; row: number; col: number;
  x: number; y: number; fx: number; fy: number;
  state: EState; hp: number;
  ep: [number,number][]; et: number;
  dvx: number; dvy: number; dphase: number; dtimer: number;
  beam: boolean; beamLen: number; beamW: number; beamTimer: number;
  anim: number;
}
interface Bullet { x:number; y:number; vx:number; vy:number; fromE:boolean; }
interface Expl   { x:number; y:number; r:number; maxR:number; life:number; color:string; }
interface Star   { x:number; y:number; v:number; sz:number; }

interface G {
  enemies: Enemy[]; bullets: Bullet[]; expls: Expl[]; stars: Star[];
  px: number; py: number; pInv: number;
  pBeam: boolean; pBeamT: number; pBeamSrc: number;
  pdouble: boolean;
  lives: number; score: number; hiScore: number;
  stage: number; gs: GS; stageT: number; stageBonus: number;
  fosc: number; foscDir: number; foscSpd: number;
  entryGroups: Enemy[][]; entryBusy: boolean; entryGroupTimer: number; curGroup: Enemy[];
  diveTimer: number; fireCD: number; eFireT: number;
  diveSpd: number; eBulletSpd: number; eFireBase: number;
  keys: Set<string>;
}

/* ══════════════════════════════════════════════════════════
   BEZIER
══════════════════════════════════════════════════════════ */
function bez(p: [number,number][], t: number): [number,number] {
  const [a,b,c,d] = p; const u=1-t;
  return [u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],
          u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]];
}
function entryPath(fx:number,fy:number,right:boolean): [number,number][] {
  return right
    ? [[CW+70,-50],[CW+50,CH*0.6],[fx+120,fy-100],[fx,fy]]
    : [[-70,  -50],[-50,  CH*0.6],[fx-120,fy-100],[fx,fy]];
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
function makeEnemies(): Enemy[] {
  let id=0; const arr:Enemy[]=[];
  for(let c=0;c<8;c++){
    const [fx,fy]=fpos(0,c); const right=c>=4;
    const ep=entryPath(fx,fy,right); const [sx,sy]=ep[0];
    arr.push({id:id++,type:"boss",row:0,col:c,x:sx,y:sy,fx,fy,
      state:"waiting",hp:2,ep,et:0,dvx:0,dvy:0,dphase:0,dtimer:0,
      beam:false,beamLen:0,beamW:0,beamTimer:0,anim:0});
  }
  for(let row=1;row<=4;row++) for(let c=0;c<10;c++){
    const [fx,fy]=fpos(row,c); const right=c>=5;
    const ep=entryPath(fx,fy,right); const [sx,sy]=ep[0];
    arr.push({id:id++,type:rowType(row),row,col:c,x:sx,y:sy,fx,fy,
      state:"waiting",hp:1,ep,et:0,dvx:0,dvy:0,dphase:0,dtimer:0,
      beam:false,beamLen:0,beamW:0,beamTimer:0,anim:0});
  }
  return arr;
}

function makeEntryGroups(es:Enemy[]): Enemy[][] {
  const g:Enemy[][]=[];
  for(const row of [4,3,2,1,0]){
    const half=row===0?4:5;
    const right=es.filter(e=>e.row===row&&e.col>=half);
    const left =es.filter(e=>e.row===row&&e.col<half);
    if(right.length) g.push(right);
    if(left.length)  g.push(left);
  }
  return g;
}

function makeStars():Star[]{
  return Array.from({length:80},()=>({
    x:Math.random()*CW, y:Math.random()*CH,
    v:20+Math.random()*50, sz:0.4+Math.random()*1.6}));
}

function newGame(stage=1, score=0, lives=3, hiScore=0): G {
  const enemies = makeEnemies();
  const s = stage;
  return {
    enemies, bullets:[], expls:[], stars:makeStars(),
    px:CW/2, py:CH-55, pInv:0,
    pBeam:false, pBeamT:0, pBeamSrc:-1, pdouble:false,
    lives, score, hiScore: Math.max(hiScore, score),
    stage:s, gs:"entering", stageT:0, stageBonus:0,
    fosc:0, foscDir:1, foscSpd: 28 + s*7,
    entryGroups: makeEntryGroups(enemies),
    entryBusy:false, entryGroupTimer:0.5, curGroup:[],
    diveTimer:4, fireCD:0, eFireT:1.5,
    diveSpd:     230 + s*12,
    eBulletSpd:  185 + s*9,
    eFireBase:   Math.max(0.30, 0.75 - s*0.04),
    keys: new Set(),
  };
}

/* ══════════════════════════════════════════════════════════
   DRAW
══════════════════════════════════════════════════════════ */
function drawBg(ctx:CanvasRenderingContext2D, stars:Star[]){
  ctx.fillStyle="#01020a"; ctx.fillRect(0,0,CW,CH);
  for(const s of stars){
    ctx.fillStyle=`rgba(255,255,255,${0.25+s.sz*0.25})`;
    ctx.beginPath(); ctx.arc(s.x,s.y,s.sz,0,Math.PI*2); ctx.fill();
  }
}

function drawShip(ctx:CanvasRenderingContext2D, x:number, y:number, alpha=1){
  ctx.save(); ctx.globalAlpha=alpha; ctx.translate(x,y);
  ctx.fillStyle="#5577cc";
  ctx.beginPath(); ctx.moveTo(-14,8); ctx.lineTo(-22,16); ctx.lineTo(-7,6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(14,8);  ctx.lineTo(22,16);  ctx.lineTo(7,6);  ctx.closePath(); ctx.fill();
  ctx.fillStyle="#aac0ff";
  ctx.beginPath(); ctx.moveTo(0,-20); ctx.lineTo(-9,9); ctx.lineTo(0,13); ctx.lineTo(9,9); ctx.closePath(); ctx.fill();
  ctx.fillStyle="#ddeeff"; ctx.fillRect(-2,-18,4,24);
  ctx.fillStyle=Math.random()>0.35?"#ff8822":"#ffcc44";
  ctx.beginPath(); ctx.ellipse(0,14,4,7,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx:CanvasRenderingContext2D, g:G){
  if(g.pInv>0 && Math.floor(g.pInv*14)%2===0) return;
  drawShip(ctx, g.px, g.py);
  if(g.pdouble) drawShip(ctx, g.px-38, g.py, 0.75);
}

function drawBee(ctx:CanvasRenderingContext2D, e:Enemy){
  ctx.save(); ctx.translate(e.x,e.y);
  const wf=Math.sin(e.anim*13)*3;
  ctx.fillStyle="rgba(180,220,255,0.6)";
  ctx.beginPath(); ctx.ellipse(-12,-2+wf,9,5,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(12,-2+wf,9,5,0.3,0,Math.PI*2);  ctx.fill();
  ctx.fillStyle="#e8d520";
  ctx.beginPath(); ctx.ellipse(0,0,6,9,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#ff2000";
  ctx.beginPath(); ctx.arc(-3,-5,2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3,-5,2,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawButterfly(ctx:CanvasRenderingContext2D, e:Enemy){
  ctx.save(); ctx.translate(e.x,e.y);
  const wf=Math.sin(e.anim*11)*4;
  ctx.fillStyle="#3355ee";
  ctx.beginPath(); ctx.ellipse(-11,-5+wf,10,8,-0.35,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(11,-5+wf,10,8,0.35,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#ee3333";
  ctx.beginPath(); ctx.ellipse(-9,5-wf*0.4,7,5,0.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9,5-wf*0.4,7,5,-0.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#eeeeff";
  ctx.beginPath(); ctx.ellipse(0,0,3,9,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawBoss(ctx:CanvasRenderingContext2D, e:Enemy){
  ctx.save(); ctx.translate(e.x,e.y);
  const wf=Math.sin(e.anim*7)*2;
  ctx.fillStyle="rgba(50,200,80,0.45)";
  ctx.beginPath(); ctx.ellipse(-25,1+wf,11,7,-0.15,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(25,1+wf,11,7,0.15,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#33bb44";
  ctx.beginPath();
  ctx.moveTo(0,-15); ctx.lineTo(-17,-5); ctx.lineTo(-19,9);
  ctx.lineTo(-11,15); ctx.lineTo(11,15); ctx.lineTo(19,9); ctx.lineTo(17,-5);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle="#ffaa00";
  ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(-8,5); ctx.lineTo(8,5); ctx.closePath(); ctx.fill();
  ctx.fillStyle="#ff0000";
  ctx.beginPath(); ctx.arc(-6,-1,3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(6,-1,3,0,Math.PI*2); ctx.fill();
  if(e.hp===1){ ctx.strokeStyle="#ff6600"; ctx.lineWidth=1.5; ctx.strokeRect(-18,-15,36,30); }
  ctx.restore();

  if(e.beam&&e.beamLen>0){
    ctx.save();
    const bx=e.x, by=e.y+14, blen=e.beamLen, bw=e.beamW;
    const gr=ctx.createLinearGradient(bx,by,bx,by+blen);
    gr.addColorStop(0,"rgba(160,80,255,0.75)");
    gr.addColorStop(0.5,"rgba(120,60,220,0.4)");
    gr.addColorStop(1,"rgba(100,40,200,0)");
    ctx.fillStyle=gr;
    ctx.beginPath();
    ctx.moveTo(bx-bw/2,by); ctx.lineTo(bx+bw/2,by);
    ctx.lineTo(bx+bw*2,by+blen); ctx.lineTo(bx-bw*2,by+blen);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function drawEnemy(ctx:CanvasRenderingContext2D, e:Enemy){
  if(e.state==="dead"||e.state==="waiting") return;
  if(e.type==="bee")            drawBee(ctx,e);
  else if(e.type==="butterfly") drawButterfly(ctx,e);
  else                          drawBoss(ctx,e);
}

function drawBullet(ctx:CanvasRenderingContext2D, b:Bullet){
  if(b.fromE){
    ctx.fillStyle="#ff6600";
    ctx.beginPath(); ctx.ellipse(b.x,b.y,3,7,0,0,Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle="#ffffff"; ctx.fillRect(b.x-2,b.y-7,4,14);
    ctx.fillStyle="#88ccff"; ctx.fillRect(b.x-1,b.y-5,2,10);
  }
}

function drawExpl(ctx:CanvasRenderingContext2D, ex:Expl){
  ctx.save();
  ctx.globalAlpha=ex.life;
  ctx.strokeStyle=ex.color; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(ex.x,ex.y,ex.r,0,Math.PI*2); ctx.stroke();
  ctx.globalAlpha=ex.life*0.4;
  ctx.strokeStyle="#ffffff"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(ex.x,ex.y,ex.r*0.5,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}

function drawHUD(ctx:CanvasRenderingContext2D, g:G){
  // 현재 점수 (좌)
  ctx.fillStyle="#ffffff"; ctx.font="bold 16px monospace";
  ctx.textAlign="left"; ctx.fillText(String(g.score).padStart(7,"0"), 8, 24);

  // 하이스코어 (중앙)
  ctx.textAlign="center";
  ctx.fillStyle="#ff7777"; ctx.font="bold 8px monospace";
  ctx.fillText("HI-SCORE", CW/2, 13);
  ctx.fillStyle="#ffbbbb"; ctx.font="bold 15px monospace";
  ctx.fillText(String(g.hiScore).padStart(7,"0"), CW/2, 26);

  // 스테이지 + 목숨 (우)
  ctx.fillStyle="#555555"; ctx.font="9px monospace";
  ctx.textAlign="right";
  ctx.fillText(`STAGE ${g.stage}`, CW-8, 13);
  for(let i=0;i<g.lives;i++){
    ctx.save(); ctx.translate(CW-14-i*22, 26); ctx.scale(0.46,0.46);
    ctx.fillStyle="#aac0ff";
    ctx.beginPath(); ctx.moveTo(0,-20); ctx.lineTo(-9,9); ctx.lineTo(0,13); ctx.lineTo(9,9); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle="rgba(255,255,255,0.12)"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,36); ctx.lineTo(CW,36); ctx.stroke();

  if(g.gs==="stageclear"){
    ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillRect(0,0,CW,CH);
    ctx.fillStyle="#ffdd44"; ctx.font="bold 34px monospace"; ctx.textAlign="center";
    ctx.fillText("STAGE CLEAR!", CW/2, CH/2-30);
    ctx.fillStyle="rgba(255,255,255,0.45)"; ctx.font="15px monospace";
    ctx.fillText(`STAGE ${g.stage} COMPLETE`, CW/2, CH/2+8);
    if(g.stageBonus>0){
      ctx.fillStyle="#ffdd44"; ctx.font="bold 17px monospace";
      ctx.fillText(`BONUS  +${g.stageBonus.toLocaleString()}`, CW/2, CH/2+36);
    }
  }
}

function drawBeamCapture(ctx:CanvasRenderingContext2D, g:G){
  if(!g.pBeam) return;
  ctx.save();
  ctx.strokeStyle=`rgba(160,80,255,${0.5+Math.sin(Date.now()/80)*0.3})`;
  ctx.lineWidth=2; ctx.setLineDash([5,3]);
  ctx.beginPath(); ctx.arc(g.px,g.py,20+Math.sin(Date.now()/100)*5,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}

/* ══════════════════════════════════════════════════════════
   UPDATE
══════════════════════════════════════════════════════════ */
function updStars(s:Star[], dt:number){
  for(const st of s){ st.y+=st.v*dt; if(st.y>CH){st.y=0;st.x=Math.random()*CW;} }
}

function updEntry(g:G, dt:number){
  for(const e of g.curGroup){
    if(e.state!=="entering") continue;
    e.et=Math.min(1,e.et+ENTRY_SPD*dt);
    const [nx,ny]=bez(e.ep,e.et); e.x=nx; e.y=ny;
    e.anim+=dt;
    if(e.et>=1){ e.state="formation"; e.x=e.fx; e.y=e.fy; }
  }
  const groupDone=g.curGroup.every(e=>e.state!=="entering");
  if(groupDone) g.entryBusy=false;

  if(!g.entryBusy&&g.entryGroups.length>0){
    g.entryGroupTimer-=dt;
    if(g.entryGroupTimer<=0){
      g.curGroup=g.entryGroups.shift()!;
      g.entryBusy=true;
      g.entryGroupTimer=0.25;
      for(const e of g.curGroup){ e.et=0; e.state="entering"; const[sx,sy]=e.ep[0]; e.x=sx; e.y=sy; }
    }
  }

  if(g.entryGroups.length===0&&!g.entryBusy){
    const allIn=g.enemies.every(e=>e.state==="formation"||e.state==="dead");
    if(allIn){ g.gs="playing"; g.diveTimer=3; }
  }
}

function updFormation(g:G, dt:number){
  g.fosc+=g.foscSpd*g.foscDir*dt;
  if(g.fosc>FORM_OSC){g.fosc=FORM_OSC;g.foscDir=-1;}
  if(g.fosc<-FORM_OSC){g.fosc=-FORM_OSC;g.foscDir=1;}
  for(const e of g.enemies){
    if(e.state==="formation"){ e.x=e.fx+g.fosc; e.anim+=dt; }
  }
}

function spawnDive(g:G){
  const cands=g.enemies.filter(e=>e.state==="formation");
  if(!cands.length) return;
  const bosses=cands.filter(e=>e.type==="boss");
  const doBoss=bosses.length>0&&Math.random()<0.3;
  const targets:Enemy[]=[];
  if(doBoss){
    const boss=bosses[Math.floor(Math.random()*bosses.length)];
    targets.push(boss);
    targets.push(...cands.filter(e=>e!==boss).slice(0,2));
  } else {
    const cnt=Math.random()<0.35?2:1;
    targets.push(...cands.sort(()=>Math.random()-0.5).slice(0,cnt));
  }
  for(const e of targets){
    e.state="diving"; e.dphase=0; e.dtimer=0;
    const dx=g.px-e.x, dy=g.py-e.y, len=Math.sqrt(dx*dx+dy*dy)||1;
    e.dvx=(dx/len)*g.diveSpd; e.dvy=(dy/len)*g.diveSpd;
    if(e.type==="boss"){ e.beam=true; e.beamLen=0; e.beamW=18; e.beamTimer=0; sfx.beam(); }
  }
}

function updDiving(g:G, dt:number){
  for(const e of g.enemies){
    if(e.state!=="diving") continue;
    e.anim+=dt; e.dtimer+=dt;

    if(e.beam){
      e.beamTimer+=dt;
      e.beamLen=Math.min(CH, e.beamLen+280*dt);
      e.beamW=18+e.beamLen*0.08;
      if(e.beamTimer>1.2) e.beam=false;

      if(!g.pBeam&&e.beam&&g.pInv<=0){
        const bx=e.x, by=e.y+14, blen=e.beamLen, bw=e.beamW*(1+1.8*(e.beamLen/CH));
        if(g.py>=by&&g.py<=by+blen&&g.px>=bx-bw/2&&g.px<=bx+bw/2){
          g.pBeam=true; g.pBeamT=0; g.pBeamSrc=e.id;
        }
      }
    }

    if(e.dphase===0){
      e.x+=e.dvx*dt; e.y+=e.dvy*dt;
      if(e.y>g.py+60){ e.dphase=1; e.dvx=(Math.random()-0.5)*120; e.dvy=g.diveSpd*0.75; }
    } else if(e.dphase===1){
      e.x+=e.dvx*dt; e.y+=e.dvy*dt;
      if(e.y>CH+40){ e.x=e.fx+g.fosc; e.y=-40; e.dphase=2; }
    } else {
      const tx=e.fx+g.fosc, ty=e.fy;
      const dx=tx-e.x, dy=ty-e.y, dist=Math.sqrt(dx*dx+dy*dy)||1;
      if(dist<10){ e.state="formation"; e.x=tx; e.y=ty; e.beam=false; }
      else { const spd=g.diveSpd*0.75; e.x+=(dx/dist)*spd*dt; e.y+=(dy/dist)*spd*dt; }
    }
  }

  if(g.pBeam){
    g.pBeamT+=dt;
    const src=g.enemies.find(e=>e.id===g.pBeamSrc);
    if(!src||src.state==="dead"||!src.beam){ g.pBeam=false; }
    else if(g.pBeamT>1.6){
      g.pBeam=false; g.lives--;
      g.pInv=3;
      if(g.lives<=0) g.gs="over";
    }
  }
}

function updEnemyFire(g:G, dt:number){
  g.eFireT-=dt;
  if(g.eFireT>0) return;
  g.eFireT=g.eFireBase+Math.random()*0.8;
  const cands=g.enemies.filter(e=>e.state==="diving"||e.state==="formation");
  if(!cands.length) return;
  const e=cands[Math.floor(Math.random()*cands.length)];
  const angle=Math.atan2(g.py-e.y, g.px-e.x);
  g.bullets.push({x:e.x,y:e.y+12,vx:Math.cos(angle)*g.eBulletSpd,vy:Math.sin(angle)*g.eBulletSpd,fromE:true});
}

function updBullets(g:G, dt:number){
  for(const b of g.bullets){ b.x+=b.vx*dt; b.y+=b.vy*dt; }
  g.bullets=g.bullets.filter(b=>b.y>-30&&b.y<CH+30&&b.x>-30&&b.x<CW+30);

  // 플레이어 탄 → 적
  for(let bi=g.bullets.length-1;bi>=0;bi--){
    const b=g.bullets[bi]; if(b.fromE) continue;
    for(const e of g.enemies){
      if(e.state==="dead"||e.state==="waiting") continue;
      const r=e.type==="boss"?16:12;
      if(Math.abs(b.x-e.x)<r&&Math.abs(b.y-e.y)<r){
        const wasDiving=e.state==="diving";
        e.hp--;
        if(e.hp<=0){
          e.state="dead"; e.beam=false;
          const base=e.type==="bee"?100:e.type==="butterfly"?160:400;
          g.score+=wasDiving?base*2:base;
          if(g.score>g.hiScore) g.hiScore=g.score;
          const c=e.type==="boss"?"#ffaa00":e.type==="butterfly"?"#4466ff":"#ffdd22";
          g.expls.push({x:e.x,y:e.y,r:4,maxR:e.type==="boss"?38:24,life:1,color:c});
          e.type==="boss" ? sfx.explBig() : sfx.explSmall();
        } else {
          g.expls.push({x:e.x,y:e.y,r:3,maxR:14,life:1,color:"#ff8800"});
          sfx.hit();
        }
        g.bullets.splice(bi,1); break;
      }
    }
  }

  // 적 탄 → 플레이어
  if(g.pInv<=0&&!g.pBeam){
    for(let bi=g.bullets.length-1;bi>=0;bi--){
      const b=g.bullets[bi]; if(!b.fromE) continue;
      if(Math.abs(b.x-g.px)<14&&Math.abs(b.y-g.py)<13){
        g.bullets.splice(bi,1);
        g.lives--; g.pInv=2.5;
        g.expls.push({x:g.px,y:g.py,r:4,maxR:32,life:1,color:"#aabbff"});
        sfx.playerDie();
        if(g.lives<=0) g.gs="over";
        break;
      }
    }
  }

  // 다이브 적 → 플레이어 충돌
  if(g.pInv<=0){
    for(const e of g.enemies){
      if(e.state!=="diving") continue;
      if(Math.abs(e.x-g.px)<18&&Math.abs(e.y-g.py)<18){
        const c=e.type==="boss"?"#ffaa00":e.type==="butterfly"?"#4466ff":"#ffdd22";
        g.expls.push({x:e.x,y:e.y,r:4,maxR:30,life:1,color:c});
        e.state="dead"; e.beam=false;
        g.lives--; g.pInv=2.5;
        g.expls.push({x:g.px,y:g.py,r:4,maxR:32,life:1,color:"#aabbff"});
        sfx.playerDie();
        if(g.lives<=0) g.gs="over";
        break;
      }
    }
  }
}

function updExpls(ex:Expl[], dt:number):Expl[]{
  for(const e of ex){ e.r=Math.min(e.maxR,e.r+e.maxR*3*dt); e.life-=dt*2; }
  return ex.filter(e=>e.life>0);
}

function playerFire(g:G){
  if(g.fireCD>0) return;
  g.fireCD=0.22;
  g.bullets.push({x:g.px,y:g.py-18,vx:0,vy:-500,fromE:false});
  if(g.pdouble) g.bullets.push({x:g.px-38,y:g.py-18,vx:0,vy:-500,fromE:false});
  sfx.fire();
}

function update(g:G, dt:number){
  if(g.gs==="over") return;

  if(g.gs==="stageclear"){
    updStars(g.stars,dt);
    g.stageT-=dt; return;
  }

  const spd=210;
  if(g.keys.has("ArrowLeft")||g.keys.has("a"))  g.px=Math.max(18,g.px-spd*dt);
  if(g.keys.has("ArrowRight")||g.keys.has("d")) g.px=Math.min(CW-18,g.px+spd*dt);
  if(g.keys.has(" ")||g.keys.has("z")) playerFire(g);
  if(g.fireCD>0) g.fireCD-=dt;
  if(g.pInv>0)   g.pInv-=dt;

  updStars(g.stars,dt);

  if(g.gs==="entering"){ updEntry(g,dt); return; }

  updFormation(g,dt);
  g.diveTimer-=dt;
  if(g.diveTimer<=0){
    g.diveTimer=1.5+Math.random()*2;
    if(g.enemies.some(e=>e.state==="formation")) spawnDive(g);
  }
  updDiving(g,dt);
  updEnemyFire(g,dt);
  updBullets(g,dt);
  g.expls=updExpls(g.expls,dt);

  if(g.enemies.every(e=>e.state==="dead")){
    const bonus=500*g.stage;
    g.score+=bonus;
    if(g.score>g.hiScore) g.hiScore=g.score;
    g.stageBonus=bonus;
    g.gs="stageclear"; g.stageT=2.5;
    sfx.stageClear();
  }
}

function drawFrame(canvas:HTMLCanvasElement, g:G){
  const ctx=canvas.getContext("2d")!;
  drawBg(ctx,g.stars);
  drawHUD(ctx,g);
  for(const e of g.enemies) drawEnemy(ctx,e);
  for(const b of g.bullets) drawBullet(ctx,b);
  for(const ex of g.expls)  drawExpl(ctx,ex);
  drawPlayer(ctx,g);
  drawBeamCapture(ctx,g);
}

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function GalagaPage(){
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gRef      = useRef<G|null>(null);
  const rafRef    = useRef<number>(0);
  const lastT     = useRef<number>(0);
  const loopRef   = useRef<(t:number)=>void>(null!);
  const [ui, setUi]       = useState<{gs:"idle"|"playing"|"over"; score:number; isNew?:boolean}>({gs:"idle",score:0});
  const [hiScore, setHiScore] = useState(0);

  useEffect(() => { setHiScore(loadHi()); }, []);

  loopRef.current = (t:number) => {
    const dt = Math.min((t-lastT.current)/1000, 0.05);
    lastT.current = t;
    const g = gRef.current, canvas = canvasRef.current;
    if(!g||!canvas) return;

    if(g.gs==="stageclear"&&g.stageT<=0){
      gRef.current = newGame(g.stage+1, g.score, g.lives, g.hiScore);
    }

    update(gRef.current!, dt);
    drawFrame(canvas, gRef.current!);

    if(gRef.current!.gs==="over"){
      const finalScore = gRef.current!.score;
      const isNew = saveHi(finalScore);
      setHiScore(loadHi());
      setUi({gs:"over", score:finalScore, isNew});
      return;
    }
    rafRef.current = requestAnimationFrame(loopRef.current);
  };

  const startGame = useCallback(() => {
    if(rafRef.current) cancelAnimationFrame(rafRef.current);
    const hi = loadHi();
    gRef.current = newGame(1, 0, 3, hi);
    setUi({gs:"playing", score:0});
    lastT.current = performance.now();
    rafRef.current = requestAnimationFrame(loopRef.current);
  }, []);

  useEffect(() => {
    const down = (e:KeyboardEvent) => {
      if(!gRef.current) return;
      gRef.current.keys.add(e.key);
      if(e.key===" ") e.preventDefault();
    };
    const up = (e:KeyboardEvent) => { if(gRef.current) gRef.current.keys.delete(e.key); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => () => { if(rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const touchKey = (key:string, on:boolean) => {
    if(gRef.current){ on ? gRef.current.keys.add(key) : gRef.current.keys.delete(key); }
  };

  const showing = ui.gs==="idle" || ui.gs==="over";
  const hiStr   = String(hiScore).padStart(7,"0");

  return (
    <main className="min-h-screen bg-[#01020a] flex flex-col items-center p-3 sm:p-5">
      <div className="w-full max-w-[420px] flex items-center gap-4 mb-4 pt-2">
        <Link href="/games" className="text-white/25 hover:text-amber-300/70 transition-colors text-sm">← 게임 목록</Link>
        <div className="w-px h-4 bg-white/10"/>
        <h1 className="text-lg font-semibold text-[#f0ead6]">갤러그</h1>
      </div>

      <div className="relative w-full" style={{maxWidth:CW}}>
        <canvas ref={canvasRef} width={CW} height={CH}
          className="w-full rounded-xl border border-white/[0.08]"
          style={{display:"block", imageRendering:"pixelated"}}
        />

        {showing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
            style={{background:"rgba(1,2,10,0.92)", backdropFilter:"blur(4px)"}}>

            {/* 하이스코어 공통 표시 */}
            <div className="absolute top-5 text-center">
              <p className="text-[#ff7777] text-[9px] font-bold tracking-widest">HI-SCORE</p>
              <p className="text-[#ffbbbb] font-bold text-lg tabular-nums tracking-wider">{hiStr}</p>
            </div>

            {ui.gs==="idle" ? (
              <>
                <p className="text-[#f0ead6] font-bold text-3xl tracking-[0.25em] mb-1">GALAGA</p>
                <p className="text-white/25 text-xs tracking-widest mb-6">1981 · NAMCO</p>
                <div className="text-white/30 text-[11px] mb-2 text-center space-y-1">
                  <p>← → 이동 &nbsp; <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/50">SPACE</kbd> / Z 발사</p>
                  <p className="text-amber-400/50">보스 트랙터 빔에 닿으면 기체가 납치됩니다!</p>
                </div>
                <div className="flex gap-4 text-[10px] text-white/20 mb-7 mt-1">
                  <span>🐝 벌 = 100/200pts</span>
                  <span>🦋 나비 = 160/320pts</span>
                  <span>👾 보스 = 400/800pts</span>
                </div>
                <button onClick={startGame}
                  className="px-10 py-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold tracking-widest hover:bg-amber-500/30 transition-all">
                  INSERT COIN
                </button>
              </>
            ) : (
              <>
                <p className="text-red-400 font-bold text-3xl tracking-widest mb-3">GAME OVER</p>
                {ui.isNew && (
                  <p className="text-yellow-300 font-bold text-sm tracking-widest mb-1 animate-pulse">
                    ★ NEW RECORD ★
                  </p>
                )}
                <p className="text-white/40 text-xs tracking-widest">SCORE</p>
                <p className="text-amber-300 font-bold text-4xl tabular-nums mb-6">
                  {ui.score.toLocaleString()}
                </p>
                <button onClick={startGame}
                  className="px-10 py-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold tracking-widest hover:bg-amber-500/30 transition-all">
                  PLAY AGAIN
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 모바일 컨트롤 */}
      <div className="mt-3 flex gap-2 w-full" style={{maxWidth:CW}}>
        <button
          onPointerDown={()=>touchKey("ArrowLeft",true)}
          onPointerUp={()=>touchKey("ArrowLeft",false)}
          onPointerLeave={()=>touchKey("ArrowLeft",false)}
          className="flex-1 h-16 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/60 text-3xl select-none active:bg-white/[0.12]">
          ←
        </button>
        <button
          onPointerDown={()=>touchKey(" ",true)}
          onPointerUp={()=>touchKey(" ",false)}
          onPointerLeave={()=>touchKey(" ",false)}
          className="flex-[1.5] h-16 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 font-bold tracking-widest select-none active:bg-red-500/25">
          FIRE
        </button>
        <button
          onPointerDown={()=>touchKey("ArrowRight",true)}
          onPointerUp={()=>touchKey("ArrowRight",false)}
          onPointerLeave={()=>touchKey("ArrowRight",false)}
          className="flex-1 h-16 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/60 text-3xl select-none active:bg-white/[0.12]">
          →
        </button>
      </div>
    </main>
  );
}
