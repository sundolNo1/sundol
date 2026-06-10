"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ══ Config ═══════════════════════════════════════════════════
const T   = 22;    // tile px
const WW  = 280;   // world width (tiles)
const WH  = 110;   // world height (tiles)
const GV  = 0.42;  // gravity per frame
const JMP = -11;   // jump velocity
const SPD = 3.2;   // horizontal speed px/frame
const RCH = 5.5;   // mining reach (tiles)
const PW  = 17;    // player width px
const PH  = 40;    // player height px

// ══ Block IDs ════════════════════════════════════════════════
const AIR=0,GRASS=1,DIRT=2,STONE=3,COAL=4,IRON=5,GOLD=6,BEDROCK=7,LOG=8,LEAVES=9;
type Bid = number;

interface BlkDef { n:string; c:string; c2?:string; hard:number; e:string; place?:true }
const BDEFS: Record<Bid,BlkDef> = {
  [AIR]:    {n:"공기",    c:"",        hard:0,        e:""},
  [GRASS]:  {n:"잔디",    c:"#4a9940", c2:"#6b4226",  hard:.5,       e:"🌿"},
  [DIRT]:   {n:"흙",      c:"#7a5230", hard:.5,        e:"🟫",place:true},
  [STONE]:  {n:"돌",      c:"#888",    hard:1.5,       e:"🪨",place:true},
  [COAL]:   {n:"석탄광석",c:"#454545", hard:2.5,       e:"◼"},
  [IRON]:   {n:"철광석",  c:"#b07860", hard:3,         e:"⬜"},
  [GOLD]:   {n:"금광석",  c:"#d4a520", hard:3,         e:"⭐"},
  [BEDROCK]:{n:"기반암",  c:"#222",    hard:Infinity,  e:"🧱"},
  [LOG]:    {n:"나무",    c:"#7a5230", c2:"#5a3a1a",   hard:1,  e:"🪵",place:true},
  [LEAVES]: {n:"나뭇잎",  c:"#3a8e28", hard:.2,        e:"🍃"},
};
const DROPS: Partial<Record<Bid,Bid>> = { [GRASS]:DIRT, [LEAVES]:AIR };

// ══ World gen ════════════════════════════════════════════════
function genWorld() {
  const tiles = new Uint8Array(WW * WH);
  const s = Math.random() * 999;
  const heights: number[] = Array.from({length:WW}, (_,x) =>
    Math.round(48 + Math.sin(x*.07+s)*8 + Math.sin(x*.03+s*1.3)*5 + Math.sin(x*.15+s*.5)*2)
  );
  for (let y=0; y<WH; y++) for (let x=0; x<WW; x++) {
    const d = y - heights[x];
    let b: Bid;
    if (y >= WH-2)            b = BEDROCK;
    else if (d === 0)          b = GRASS;
    else if (d > 0 && d <= 4)  b = DIRT;
    else if (d > 4) {
      const r = Math.random();
      if      (d > 30 && r < .008)  b = GOLD;
      else if (d > 15 && r < .022)  b = IRON;
      else if (r < .055)            b = COAL;
      else                          b = STONE;
    } else b = AIR;
    tiles[y*WW+x] = b;
  }
  // Trees
  let tx = 8;
  while (tx < WW-8) {
    const hh = heights[tx], th = 4+Math.floor(Math.random()*3);
    if (hh > 5 && hh < WH-20) {
      for (let i=1; i<=th; i++) { if (hh-i>=0) tiles[(hh-i)*WW+tx]=LOG; }
      for (let ly=-2; ly<=0; ly++) for (let lx=-2; lx<=2; lx++) {
        if (Math.abs(lx)+Math.abs(ly)<4) {
          const fy=hh-th+ly, fx=tx+lx;
          if (fy>=0&&fy<WH&&fx>=0&&fx<WW&&tiles[fy*WW+fx]===AIR)
            tiles[fy*WW+fx]=LEAVES;
        }
      }
    }
    tx += 8 + Math.floor(Math.random()*8);
  }
  const spX=Math.floor(WW/2), spY=heights[Math.floor(WW/2)]-2;
  return { tiles, heights, spX, spY };
}

// ══ Helpers ══════════════════════════════════════════════════
const getAt = (w:Uint8Array, x:number, y:number): Bid =>
  x<0||x>=WW||y<0||y>=WH ? BEDROCK : w[y*WW+x];
const setAt = (w:Uint8Array, x:number, y:number, b:Bid) => {
  if (x>=0&&x<WW&&y>=0&&y<WH) w[y*WW+x]=b;
};
const isSolid = (b:Bid) => b!==AIR && b!==LEAVES;

// ══ Physics ══════════════════════════════════════════════════
function moveP(w:Uint8Array, px:number, py:number, vx:number, vy:number) {
  let og = false;
  // X
  px += vx;
  const ty1=Math.floor(py/T), ty2=Math.floor((py+PH-1)/T);
  if (vx>0) { const tx=Math.floor((px+PW)/T); if(isSolid(getAt(w,tx,ty1))||isSolid(getAt(w,tx,ty2))){px=tx*T-PW;vx=0;} }
  else if (vx<0) { const tx=Math.floor(px/T); if(isSolid(getAt(w,tx,ty1))||isSolid(getAt(w,tx,ty2))){px=(tx+1)*T;vx=0;} }
  // Y
  py += vy;
  const tx1=Math.floor(px/T), tx2=Math.floor((px+PW-1)/T);
  if (vy>0) { const ty=Math.floor((py+PH)/T); if(isSolid(getAt(w,tx1,ty))||isSolid(getAt(w,tx2,ty))){py=ty*T-PH;vy=0;og=true;} }
  else if (vy<0) { const ty=Math.floor(py/T); if(isSolid(getAt(w,tx1,ty))||isSolid(getAt(w,tx2,ty))){py=(ty+1)*T;vy=0;} }
  return { px, py, vx, vy, og };
}

// ══ Block draw ═══════════════════════════════════════════════
function drawBlk(ctx: CanvasRenderingContext2D, bx:number, by:number, b:Bid, bAbove:Bid) {
  const d = BDEFS[b]; if (!d?.c) return;
  const px=bx*T, py=by*T;
  if (b===GRASS) {
    ctx.fillStyle="#4a9940"; ctx.fillRect(px,py,T,5);
    ctx.fillStyle="#6b4226"; ctx.fillRect(px,py+5,T,T-5);
  } else if (b===LOG) {
    ctx.fillStyle="#7a5230"; ctx.fillRect(px,py,T,T);
    ctx.strokeStyle="#4a2e0a"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(px+T/2,py+T/2,T/3.5,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle="#5a3a1a";
    ctx.beginPath(); ctx.arc(px+T/2,py+T/2,T/7,0,Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle=d.c; ctx.fillRect(px,py,T,T);
  }
  // Bevel
  ctx.fillStyle="rgba(255,255,255,.07)"; ctx.fillRect(px,py,T,2); ctx.fillRect(px,py,2,T);
  ctx.fillStyle="rgba(0,0,0,.2)";        ctx.fillRect(px,py+T-2,T,2); ctx.fillRect(px+T-2,py,2,T);
  // Ore veins
  if (b===COAL) { ctx.fillStyle="#1a1a1a"; ctx.fillRect(px+4,py+4,5,5); ctx.fillRect(px+T-9,py+T-9,5,5); }
  if (b===IRON) { ctx.fillStyle="#e0a878"; ctx.fillRect(px+4,py+4,4,4); ctx.fillRect(px+T-8,py+8,4,4); ctx.fillRect(px+8,py+T-8,4,4); }
  if (b===GOLD) { ctx.fillStyle="#ffe060"; ctx.fillRect(px+4,py+4,5,5); ctx.fillRect(px+T-9,py+T-9,5,5); ctx.fillRect(px+T/2-2,py+4,4,4); }
  if (b===LEAVES) { ctx.fillStyle="rgba(40,110,30,.35)"; ctx.fillRect(px,py,T,T); }
}

// ══ Game state type ══════════════════════════════════════════
interface Gs {
  tiles: Uint8Array;
  heights: number[];
  px:number; py:number; vx:number; vy:number; og:boolean; fr:boolean;
  camX:number; camY:number;
  inv: Record<Bid,number>;
  sel: Bid;
  mt: {tx:number;ty:number;prog:number} | null;
  tick: number;
  cw:number; ch:number;
}

// ══ Component ════════════════════════════════════════════════
export default function MinerPage() {
  const cvs  = useRef<HTMLCanvasElement>(null);
  const gs   = useRef<Gs>({} as Gs);
  const keys = useRef(new Set<string>());
  const mouse = useRef({x:0, y:0, l:false});
  const placeQ = useRef(false);
  const mkeys  = useRef({l:false, r:false, j:false});
  const raf    = useRef(0);

  const [ui, setUi] = useState<{
    inv: Record<Bid,number>; sel: Bid; hover: string;
  }>({ inv:{}, sel:0, hover:"" });
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    const cv = cvs.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;

    const resize = () => {
      const w = cv.clientWidth||800, h = cv.clientHeight||500;
      cv.width=w; cv.height=h;
      gs.current.cw=w; gs.current.ch=h;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(cv);

    const { tiles, heights, spX, spY } = genWorld();
    const g = gs.current;
    g.tiles=tiles; g.heights=heights; g.px=spX*T; g.py=spY*T;
    g.vx=0; g.vy=0; g.og=false; g.fr=true;
    g.camX=g.px-g.cw/2; g.camY=g.py-g.ch/2;
    g.inv={}; g.sel=0; g.mt=null; g.tick=6000;

    // ── Input ────────────────────────────────────────────────
    const kd = (e:KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
      if (e.key>="1"&&e.key<="9") {
        const placeables = Object.keys(g.inv).filter(id=>g.inv[+id]>0&&BDEFS[+id]?.place);
        const pick = placeables[+e.key-1];
        if (pick) { g.sel=+pick; }
      }
      if ([" ","arrowleft","arrowright","arrowup","arrowdown"].includes(e.key.toLowerCase()))
        e.preventDefault();
    };
    const ku = (e:KeyboardEvent) => keys.current.delete(e.key.toLowerCase());

    const mm = (e:MouseEvent) => {
      const r=cv.getBoundingClientRect();
      mouse.current.x=(e.clientX-r.left)*(cv.width/r.width);
      mouse.current.y=(e.clientY-r.top)*(cv.height/r.height);
    };
    const md = (e:MouseEvent) => {
      if (e.button===0) mouse.current.l=true;
      if (e.button===2) { placeQ.current=true; e.preventDefault(); }
    };
    const mu = (e:MouseEvent) => {
      if (e.button===0) { mouse.current.l=false; g.mt=null; }
    };
    const ctx2 = (e:Event) => e.preventDefault();

    cv.addEventListener("mousemove",mm);
    cv.addEventListener("mousedown",md);
    cv.addEventListener("mouseup",mu);
    cv.addEventListener("contextmenu",ctx2);
    window.addEventListener("keydown",kd);
    window.addEventListener("keyup",ku);

    // Touch
    const tm = (e:TouchEvent) => {
      const r=cv.getBoundingClientRect(), t=e.touches[0];
      mouse.current.x=(t.clientX-r.left)*(cv.width/r.width);
      mouse.current.y=(t.clientY-r.top)*(cv.height/r.height);
      e.preventDefault();
    };
    const ts = (e:TouchEvent) => { mouse.current.l=true; tm(e); };
    const te = () => { mouse.current.l=false; g.mt=null; };
    cv.addEventListener("touchstart",ts,{passive:false});
    cv.addEventListener("touchmove",tm,{passive:false});
    cv.addEventListener("touchend",te);

    // ── Game loop ─────────────────────────────────────────────
    let uiTimer=0;
    let prevX=false; // edge-trigger for X key
    function loop() {
      const g2=gs.current;
      const K=keys.current, M=mouse.current, MK=mkeys.current;
      g2.tick=(g2.tick+1)%24000;

      // Move (blocked until game started)
      const ml=(startedRef.current)&&(K.has("a")||K.has("arrowleft")||MK.l);
      const mr=(startedRef.current)&&(K.has("d")||K.has("arrowright")||MK.r);
      const mj=(startedRef.current)&&(K.has("w")||K.has(" ")||K.has("arrowup")||MK.j);
      if (ml) { g2.vx=-SPD; g2.fr=false; }
      else if (mr) { g2.vx=SPD; g2.fr=true; }
      else g2.vx*=.72;
      if (mj&&g2.og) { g2.vy=JMP; g2.og=false; }
      g2.vy=Math.min(g2.vy+GV, 18);

      const res=moveP(g2.tiles,g2.px,g2.py,g2.vx,g2.vy);
      g2.px=res.px; g2.py=res.py; g2.vx=res.vx; g2.vy=res.vy; g2.og=res.og;
      g2.px=Math.max(0,Math.min(g2.px,WW*T-PW));
      // Respawn if fell out
      if (g2.py>WH*T+200) { g2.px=Math.floor(WW/2)*T; g2.py=20*T; g2.vy=0; }

      // Camera (smooth follow)
      g2.camX+=(g2.px+PW/2-g2.cw/2-g2.camX)*.12;
      g2.camY+=(g2.py+PH/2-g2.ch/2-g2.camY)*.12;
      g2.camX=Math.max(0,Math.min(g2.camX,WW*T-g2.cw));
      g2.camY=Math.max(0,Math.min(g2.camY,WH*T-g2.ch));

      // Mouse → world tile
      const wx=M.x+g2.camX, wy=M.y+g2.camY;
      const mtx=Math.floor(wx/T), mty=Math.floor(wy/T);
      const pcx=(g2.px+PW/2)/T, pcy=(g2.py+PH/2)/T;
      const inR=Math.hypot(mtx-pcx,mty-pcy)<=RCH&&mtx>=0&&mty>=0&&mtx<WW&&mty<WH;

      // Keyboard mine target (Z key): scan in front of player symmetrically
      const kMine=startedRef.current&&K.has("z");
      let kmtx=mtx, kmty=mty, kInR=inR;
      if (kMine) {
        const dir=g2.fr?1:-1;
        const plCx=Math.floor((g2.px+PW/2)/T);
        const plTileY=Math.floor((g2.py+PH/2)/T);
        let found=false;
        for (let dist=1; dist<=3&&!found; dist++) {
          for (let dy=-1; dy<=1&&!found; dy++) {
            const tx2=plCx+dir*dist;
            const ty2=plTileY+dy;
            const bid2=getAt(g2.tiles,tx2,ty2);
            if (bid2!==AIR&&bid2!==BEDROCK) { kmtx=tx2; kmty=ty2; kInR=true; found=true; }
          }
        }
        if (!found) { kmtx=plCx; kmty=plTileY+1; kInR=true; }
      }

      const mineActive=startedRef.current&&(M.l&&inR||kMine);
      const finalMtx=kMine?kmtx:mtx, finalMty=kMine?kmty:mty, finalInR=kMine?kInR:inR;

      // Mine (left hold or Z key, blocked until started)
      if (mineActive) {
        const bid=g2.tiles[finalMty*WW+finalMtx];
        if (bid!==AIR&&bid!==BEDROCK) {
          if (!g2.mt||g2.mt.tx!==finalMtx||g2.mt.ty!==finalMty) g2.mt={tx:finalMtx,ty:finalMty,prog:0};
          g2.mt.prog+=1/(60*(BDEFS[bid]?.hard??2));
          if (g2.mt.prog>=1) {
            const dropId=DROPS[bid]!==undefined?DROPS[bid]!:bid;
            if (dropId!==AIR) g2.inv[dropId]=(g2.inv[dropId]??0)+1;
            g2.tiles[finalMty*WW+finalMtx]=AIR;
            g2.mt=null;
            if (!g2.sel||(g2.inv[g2.sel]??0)===0) {
              const first=Object.keys(g2.inv).find(id=>g2.inv[+id]>0&&BDEFS[+id]?.place);
              if (first) g2.sel=+first;
            }
          }
        } else g2.mt=null;
      } else if (!M.l&&!kMine) g2.mt=null;

      // Place (X key edge-triggered: in front of player / right click: under mouse)
      const xDown=K.has("c");
      const kPlace=startedRef.current&&xDown&&!prevX;
      prevX=xDown;
      if (startedRef.current&&(placeQ.current||kPlace)&&g2.sel&&(g2.inv[g2.sel]??0)>0&&BDEFS[g2.sel]?.place) {
        let ptx=mtx, pty=mty;
        if (kPlace) {
          // Place just outside player boundary (right: beyond right edge, left: beyond left edge)
          ptx = g2.fr
            ? Math.floor((g2.px+PW-1)/T)+1
            : Math.floor(g2.px/T)-1;
          pty = Math.floor((g2.py+PH*0.6)/T);
        }
        const cur=getAt(g2.tiles,ptx,pty);
        if (cur===AIR&&ptx>=0&&ptx<WW&&pty>=0&&pty<WH) {
          const px1=Math.floor(g2.px/T), px2=Math.floor((g2.px+PW-1)/T);
          const py1=Math.floor(g2.py/T), py2=Math.floor((g2.py+PH-1)/T);
          if (!(ptx>=px1&&ptx<=px2&&pty>=py1&&pty<=py2)) {
            setAt(g2.tiles,ptx,pty,g2.sel);
            g2.inv[g2.sel]!--;
          }
        }
      }
      placeQ.current=false;

      // ── Render ───────────────────────────────────────────────
      const {cw,ch,camX,camY}=g2;
      const tn=g2.tick/24000;
      const isDay=tn>.2&&tn<.8;

      // Sky (with dawn/dusk transition)
      const sg=ctx.createLinearGradient(0,0,0,ch);
      if (tn>=.25&&tn<=.75) {           // day
        sg.addColorStop(0,"#1a6abf"); sg.addColorStop(1,"#4aabdf");
      } else if (tn>.75&&tn<.85) {       // dusk
        const t2=(tn-.75)/.1;
        sg.addColorStop(0,`rgb(${Math.round(26+t2*(10-26))},${Math.round(106+t2*(12-106))},${Math.round(191+t2*(26-191))})`);
        sg.addColorStop(.5,"#e07030"); sg.addColorStop(1,"#1a1a40");
      } else if (tn>.15&&tn<.25) {       // dawn
        const t2=(tn-.15)/.1;
        sg.addColorStop(0,`rgb(${Math.round(10+t2*(26-10))},${Math.round(12+t2*(106-12))},${Math.round(26+t2*(191-26))})`);
        sg.addColorStop(.5,"#e06020"); sg.addColorStop(1,"#1a1a40");
      } else {                           // night
        sg.addColorStop(0,"#050c1a"); sg.addColorStop(1,"#0a1530");
      }
      ctx.fillStyle=sg; ctx.fillRect(0,0,cw,ch);

      // Stars (night)
      if (!isDay) {
        ctx.fillStyle="rgba(255,255,255,.5)";
        for (let i=0;i<80;i++) {
          ctx.fillRect((Math.sin(i*7.3+1)*.5+.5)*cw,(Math.sin(i*11.7+3)*.5+.5)*ch*.45,1.5,1.5);
        }
      }
      // Sun / Moon
      const sa=tn*Math.PI*2-Math.PI/2;
      const sx=cw/2+Math.cos(sa)*cw*.4, sy=ch*.38+Math.sin(sa)*ch*.32;
      ctx.fillStyle=isDay?"#ffe06a":"#d0d8e8";
      ctx.beginPath(); ctx.arc(sx,sy,isDay?16:12,0,Math.PI*2); ctx.fill();

      // Tiles (only visible)
      const txS=Math.max(0,Math.floor(camX/T)-1);
      const txE=Math.min(WW,Math.ceil((camX+cw)/T)+1);
      const tyS=Math.max(0,Math.floor(camY/T)-1);
      const tyE=Math.min(WH,Math.ceil((camY+ch)/T)+1);

      ctx.save(); ctx.translate(-camX,-camY);
      for (let ty2=tyS;ty2<tyE;ty2++) for (let tx2=txS;tx2<txE;tx2++) {
        const bid=g2.tiles[ty2*WW+tx2];
        if (bid===AIR) continue;
        drawBlk(ctx,tx2,ty2,bid,ty2>0?g2.tiles[(ty2-1)*WW+tx2]:AIR);
      }

      // Mine progress bar
      if (g2.mt) {
        const {tx:mx,ty:my,prog}=g2.mt;
        ctx.fillStyle=`rgba(0,0,0,${prog*.6})`; ctx.fillRect(mx*T,my*T,T,T);
        ctx.fillStyle="#333";   ctx.fillRect(mx*T,my*T-7,T,4);
        ctx.fillStyle="#4caf50"; ctx.fillRect(mx*T,my*T-7,T*prog,4);
      }
      // Underground darkness (depth-based)
      const camCX=Math.max(0,Math.min(WW-1,Math.floor((camX+cw/2)/T)));
      const surface=g2.heights[camCX]??48;
      const depth=(camY+ch/2)/T - surface;
      if (depth>3) {
        const alpha=Math.min(.8,(depth-3)/28*.8);
        ctx.fillStyle=`rgba(0,0,10,${alpha})`; ctx.fillRect(0,0,cw,ch);
      }

      // Hover outline (Z키 사용 시 타겟 블록 강조)
      const hlTx=kMine?kmtx:mtx, hlTy=kMine?kmty:mty, hlInR=kMine?kInR:inR;
      if (hlInR) {
        ctx.strokeStyle=kMine?"rgba(255,220,60,.7)":"rgba(255,255,255,.45)";
        ctx.lineWidth=1.5;
        ctx.strokeRect(hlTx*T+.75,hlTy*T+.75,T-1.5,T-1.5);
      }

      // Player
      const px2=g2.px, py2=g2.py;
      ctx.fillStyle="#3a7bd5"; ctx.fillRect(px2,py2+PH*.35,PW,PH*.48); // shirt
      ctx.fillStyle="#f4b66a"; ctx.fillRect(px2+PW*.1,py2,PW*.8,PH*.38); // head
      ctx.fillStyle="#333";    // eye
      if (g2.fr) ctx.fillRect(px2+PW*.55,py2+PH*.1,PW*.15,PH*.1);
      else       ctx.fillRect(px2+PW*.28,py2+PH*.1,PW*.15,PH*.1);
      ctx.fillStyle="#1a3a9a";  // pants
      ctx.fillRect(px2,py2+PH*.82,PW*.4,PH*.18);
      ctx.fillRect(px2+PW*.6,py2+PH*.82,PW*.4,PH*.18);
      ctx.fillStyle="#3a7bd5";  // arms
      ctx.fillRect(px2-PW*.15,py2+PH*.36,PW*.18,PH*.34);
      ctx.fillRect(px2+PW,    py2+PH*.36,PW*.18,PH*.34);

      ctx.restore();

      // Auto-select first placeable if nothing selected
      if ((!g2.sel||(g2.inv[g2.sel]??0)===0)) {
        const first=Object.keys(g2.inv).find(id=>g2.inv[+id]>0&&BDEFS[+id]?.place);
        if (first) g2.sel=+first;
      }

      // UI update (every 8 frames)
      if (++uiTimer>=8) {
        uiTimer=0;
        const hovId=inR?getAt(g2.tiles,mtx,mty):0;
        setUi({ inv:{...g2.inv}, sel:g2.sel, hover:hovId&&hovId!==AIR?(BDEFS[hovId]?.n??""):"" });
      }

      raf.current=requestAnimationFrame(loop);
    }
    raf.current=requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      cv.removeEventListener("mousemove",mm);
      cv.removeEventListener("mousedown",md);
      cv.removeEventListener("mouseup",mu);
      cv.removeEventListener("contextmenu",ctx2);
      cv.removeEventListener("touchstart",ts);
      cv.removeEventListener("touchmove",tm);
      cv.removeEventListener("touchend",te);
      window.removeEventListener("keydown",kd);
      window.removeEventListener("keyup",ku);
    };
  }, []);

  const invItems = Object.entries(ui.inv).filter(([,c])=>c>0).sort(([a],[b])=>+a-+b);
  const mk = mkeys;

  return (
    <div className="h-screen bg-[#06090f] flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-black/40 border-b border-white/[0.05] flex-shrink-0 z-10">
        <Link href="/games" className="text-white/30 hover:text-amber-300/70 transition-colors text-xs">← 게임 목록</Link>
        <div className="w-px h-3 bg-white/10"/>
        <span className="text-white/50 text-xs">⛏️ 마이너</span>
        {ui.hover && <><div className="w-px h-3 bg-white/10"/><span className="text-amber-300/60 text-xs">{ui.hover}</span></>}
        <span className="ml-auto text-white/20 text-[10px] hidden sm:block">{started ? "←/→ 이동 · 스페이스 점프 · Z 채굴 · C 설치" : ""}</span>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={cvs} className="w-full h-full block touch-none"/>

        {/* Start screen overlay */}
        {!started && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { setStarted(true); startedRef.current=true; }}
          >
            <div className="bg-[#06090f]/90 border border-white/[0.1] rounded-2xl px-8 py-8 text-center max-w-xs w-full mx-4 shadow-2xl">
              <div className="text-4xl mb-3">⛏️</div>
              <h2 className="text-[#f0ead6] text-2xl font-bold tracking-widest mb-6">마이너</h2>

              {/* Desktop controls */}
              <div className="hidden sm:block mb-6 space-y-2 text-left">
                <div className="flex justify-between items-center py-1.5 border-b border-white/[0.05]">
                  <span className="text-white/40 text-xs">이동</span>
                  <span className="text-amber-200/80 text-xs font-mono">← / →</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/[0.05]">
                  <span className="text-white/40 text-xs">점프</span>
                  <span className="text-amber-200/80 text-xs font-mono">스페이스 / ↑</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/[0.05]">
                  <span className="text-white/40 text-xs">채굴</span>
                  <span className="text-amber-200/80 text-xs font-mono">Z (꾹) / 좌클릭</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/40 text-xs">블록 설치</span>
                  <span className="text-amber-200/80 text-xs font-mono">C / 우클릭</span>
                </div>
              </div>

              {/* Mobile controls */}
              <div className="sm:hidden mb-6 space-y-2 text-left">
                <div className="flex justify-between items-center py-1.5 border-b border-white/[0.05]">
                  <span className="text-white/40 text-xs">이동</span>
                  <span className="text-amber-200/80 text-xs">◀ ▶ 버튼</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/[0.05]">
                  <span className="text-white/40 text-xs">점프</span>
                  <span className="text-amber-200/80 text-xs">점프 버튼</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/[0.05]">
                  <span className="text-white/40 text-xs">채굴</span>
                  <span className="text-amber-200/80 text-xs">화면 터치 (꾹)</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/40 text-xs">블록 설치</span>
                  <span className="text-amber-200/80 text-xs">설치 버튼</span>
                </div>
              </div>

              <div className="bg-amber-400/15 border border-amber-400/30 rounded-xl px-4 py-3 text-amber-200/80 text-sm font-medium cursor-pointer hover:bg-amber-400/25 transition-colors">
                클릭하여 시작
              </div>
            </div>
          </div>
        )}

        {/* Mobile D-pad */}
        <div className="absolute bottom-3 left-3 flex gap-2 sm:hidden z-20">
          <button
            onPointerDown={()=>mk.current.l=true}
            onPointerUp={()=>mk.current.l=false}
            onPointerLeave={()=>mk.current.l=false}
            className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white text-2xl active:bg-white/25 flex items-center justify-center"
          >◀</button>
          <button
            onPointerDown={()=>mk.current.r=true}
            onPointerUp={()=>mk.current.r=false}
            onPointerLeave={()=>mk.current.r=false}
            className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white text-2xl active:bg-white/25 flex items-center justify-center"
          >▶</button>
        </div>
        <div className="absolute bottom-3 right-3 flex flex-col gap-2 sm:hidden z-20">
          <button
            onPointerDown={()=>mk.current.j=true}
            onPointerUp={()=>mk.current.j=false}
            onPointerLeave={()=>mk.current.j=false}
            className="w-16 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 text-sm font-bold active:bg-amber-400/40 flex items-center justify-center"
          >점프</button>
          <button
            onPointerDown={()=>{ placeQ.current=true; }}
            className="w-16 h-12 rounded-2xl bg-indigo-400/20 border border-indigo-400/30 text-indigo-300 text-sm font-bold active:bg-indigo-400/40 flex items-center justify-center"
          >설치</button>
        </div>
      </div>

      {/* Inventory bar */}
      <div className="flex-shrink-0 bg-black/50 border-t border-white/[0.05] px-3 py-2 z-10">
        <div className="flex items-center gap-2 max-w-3xl mx-auto flex-wrap min-h-[36px]">
          <span className="text-white/25 text-[10px] uppercase tracking-widest flex-shrink-0">인벤토리</span>
          {invItems.length===0
            ? <span className="text-white/15 text-xs">블록을 채굴하세요 ⛏️</span>
            : invItems.map(([id,cnt]) => {
                const bid=+id, d=BDEFS[bid]; if (!d) return null;
                const isSel=ui.sel===bid&&!!d.place;
                return (
                  <button key={id}
                    onClick={()=>{ if(d.place){gs.current.sel=bid;setUi(u=>({...u,sel:bid}));} }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-all ${
                      isSel ? "bg-amber-400/20 border-amber-400/50 text-amber-200"
                            : "bg-white/[0.04] border-white/[0.07] text-white/50 hover:bg-white/[0.08]"
                    }`}
                  >
                    <span>{d.e||"▪"}</span>
                    <span>{d.n}</span>
                    <span className="text-white/35">×{cnt}</span>
                  </button>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}
