"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

/* ── 상수 & 타입 ─────────────────────────────────────────── */
const W = 10, H = 20;
type PT = "I"|"O"|"T"|"S"|"Z"|"J"|"L";
type Cell = string|null;
type Board = Cell[][];
type GS = "idle"|"playing"|"paused"|"over";

const PD: Record<PT, { color: string; shapes: number[][][] }> = {
  I:{ color:"#00d4e8", shapes:[
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ]},
  O:{ color:"#ffd700", shapes:[[[1,1],[1,1]]] },
  T:{ color:"#c040f0", shapes:[
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ]},
  S:{ color:"#40d040", shapes:[
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ]},
  Z:{ color:"#f04040", shapes:[
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ]},
  J:{ color:"#4060f0", shapes:[
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ]},
  L:{ color:"#f08020", shapes:[
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ]},
};

const ALL: PT[] = ["I","O","T","S","Z","J","L"];
const LINE_PTS = [0, 100, 300, 500, 800];

function dropSpeed(lv: number) { return Math.max(50, 900 - (lv - 1) * 80); }
function emptyBoard(): Board { return Array.from({ length: H }, () => Array(W).fill(null)); }
function shapeOf(t: PT, r: number) { const s = PD[t].shapes; return s[r % s.length]; }
function colorOf(t: PT) { return PD[t].color; }
function spawnX(t: PT) { return Math.floor((W - shapeOf(t, 0)[0].length) / 2); }

function valid(b: Board, t: PT, r: number, x: number, y: number): boolean {
  const s = shapeOf(t, r);
  for (let row = 0; row < s.length; row++)
    for (let col = 0; col < s[row].length; col++) {
      if (!s[row][col]) continue;
      const nr = y + row, nc = x + col;
      if (nc < 0 || nc >= W || nr >= H) return false;
      if (nr >= 0 && b[nr][nc]) return false;
    }
  return true;
}

function lockPiece(b: Board, t: PT, r: number, x: number, y: number): Board {
  const n = b.map(row => [...row]);
  const s = shapeOf(t, r);
  const c = colorOf(t);
  for (let row = 0; row < s.length; row++)
    for (let col = 0; col < s[row].length; col++)
      if (s[row][col]) { const nr = y+row, nc = x+col; if (nr >= 0 && nr < H) n[nr][nc] = c; }
  return n;
}

function clearLines(b: Board): { board: Board; count: number } {
  const kept = b.filter(row => row.some(c => !c));
  const count = H - kept.length;
  const pad: Board = Array.from({ length: count }, () => Array(W).fill(null));
  return { board: [...pad, ...kept], count };
}

function ghostY(b: Board, t: PT, r: number, x: number, y: number): number {
  let gy = y;
  while (valid(b, t, r, x, gy + 1)) gy++;
  return gy;
}

const KICKS_NORMAL: [number,number][] = [[0,0],[1,0],[-1,0],[0,-1],[1,-1],[-1,-1],[2,0],[-2,0]];
const KICKS_I: [number,number][]      = [[0,0],[2,0],[-2,0],[1,0],[-1,0],[0,-1],[0,1]];

function tryRotate(b: Board, t: PT, r: number, x: number, y: number, d: 1|-1): { r: number; x: number }|null {
  const nr = (r + d + PD[t].shapes.length) % PD[t].shapes.length;
  const kicks = t === "I" ? KICKS_I : KICKS_NORMAL;
  for (const [kx] of kicks) {
    if (valid(b, t, nr, x + kx, y)) return { r: nr, x: x + kx };
  }
  return null;
}

function makeBag(): PT[] {
  const b = [...ALL];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/* ── 게임 상태 인터페이스 ────────────────────────────────── */
interface G {
  board: Board; t: PT; r: number; px: number; py: number;
  queue: PT[]; held: PT|null; canHold: boolean;
  score: number; lines: number; level: number; combo: number; gs: GS;
}

function initG(): G {
  const q = [...makeBag(), ...makeBag()];
  const t = q.shift()!;
  return { board: emptyBoard(), t, r: 0, px: spawnX(t), py: -1,
    queue: q, held: null, canHold: true, score: 0, lines: 0, level: 1, combo: 0, gs: "playing" };
}

/* ── 미니 피스 프리뷰 컴포넌트 ──────────────────────────── */
function MiniPiece({ type, size = 18 }: { type: PT; size?: number }) {
  const s = shapeOf(type, 0);
  const c = colorOf(type);
  const rows = s.length, cols = s[0].length;
  return (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols}, ${size}px)`, gap:1 }}>
      {s.flatMap((row, ri) =>
        row.map((cell, ci) => (
          <div key={`${ri}-${ci}`}
            style={{
              width: size, height: size,
              background: cell ? c : "transparent",
              borderRadius: cell ? 3 : 0,
              boxShadow: cell ? `0 0 6px ${c}55, inset 0 1px 0 rgba(255,255,255,0.25)` : "none",
            }} />
        ))
      )}
    </div>
  );
}

/* ── 메인 컴포넌트 ───────────────────────────────────────── */
export default function TetrisPage() {
  const gRef  = useRef<G|null>(null);
  const dropR = useRef<ReturnType<typeof setTimeout>|null>(null);
  const [, setTick] = useState(0);
  const redraw = useCallback(() => setTick(n => n + 1), []);

  /* ── 드롭 루프 ── */
  const scheduleDrop = useCallback(() => {
    if (dropR.current) clearTimeout(dropR.current);
    const g = gRef.current;
    if (!g || g.gs !== "playing") return;
    dropR.current = setTimeout(doGravity, dropSpeed(g.level));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doGravity = useCallback(() => {
    const g = gRef.current;
    if (!g || g.gs !== "playing") return;
    if (valid(g.board, g.t, g.r, g.px, g.py + 1)) {
      g.py++;
      redraw();
      scheduleDrop();
    } else {
      doLock();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLock = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    const newBoard = lockPiece(g.board, g.t, g.r, g.px, g.py);
    const { board, count } = clearLines(newBoard);
    g.board = board;
    if (count > 0) { g.combo++; g.score += LINE_PTS[count] * g.level + 50 * g.combo; }
    else { g.combo = 0; }
    g.lines += count;
    g.level  = Math.floor(g.lines / 10) + 1;
    g.canHold = true;

    let queue = [...g.queue];
    if (queue.length < 5) queue = [...queue, ...makeBag()];
    const next = queue.shift()!;
    g.queue = queue; g.t = next; g.r = 0;
    g.px = spawnX(next); g.py = -1;

    if (!valid(g.board, g.t, g.r, g.px, g.py)) {
      g.gs = "over";
      if (dropR.current) clearTimeout(dropR.current);
      redraw(); return;
    }
    redraw();
    scheduleDrop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 조작 함수 ── */
  const startGame = useCallback(() => {
    if (dropR.current) clearTimeout(dropR.current);
    gRef.current = initG();
    redraw();
    scheduleDrop();
  }, [redraw, scheduleDrop]);

  const moveLeft = useCallback(() => {
    const g = gRef.current; if (!g || g.gs !== "playing") return;
    if (valid(g.board, g.t, g.r, g.px - 1, g.py)) { g.px--; redraw(); }
  }, [redraw]);

  const moveRight = useCallback(() => {
    const g = gRef.current; if (!g || g.gs !== "playing") return;
    if (valid(g.board, g.t, g.r, g.px + 1, g.py)) { g.px++; redraw(); }
  }, [redraw]);

  const rotateCW = useCallback(() => {
    const g = gRef.current; if (!g || g.gs !== "playing") return;
    const res = tryRotate(g.board, g.t, g.r, g.px, g.py, 1);
    if (res) { g.r = res.r; g.px = res.x; redraw(); }
  }, [redraw]);

  const rotateCCW = useCallback(() => {
    const g = gRef.current; if (!g || g.gs !== "playing") return;
    const res = tryRotate(g.board, g.t, g.r, g.px, g.py, -1);
    if (res) { g.r = res.r; g.px = res.x; redraw(); }
  }, [redraw]);

  const softDrop = useCallback(() => {
    const g = gRef.current; if (!g || g.gs !== "playing") return;
    if (valid(g.board, g.t, g.r, g.px, g.py + 1)) {
      g.py++; g.score += 1; redraw(); scheduleDrop();
    }
  }, [redraw, scheduleDrop]);

  const hardDrop = useCallback(() => {
    const g = gRef.current; if (!g || g.gs !== "playing") return;
    const gy = ghostY(g.board, g.t, g.r, g.px, g.py);
    g.score += 2 * Math.max(0, gy - g.py);
    g.py = gy; redraw();
    if (dropR.current) clearTimeout(dropR.current);
    doLock();
  }, [redraw, doLock]);

  const holdPiece = useCallback(() => {
    const g = gRef.current; if (!g || g.gs !== "playing" || !g.canHold) return;
    const prev = g.held;
    g.held = g.t; g.canHold = false;
    let queue = [...g.queue];
    if (queue.length < 5) queue = [...queue, ...makeBag()];
    g.t = prev ?? queue.shift()!;
    if (!prev) g.queue = queue;
    g.r = 0; g.px = spawnX(g.t); g.py = -1;
    redraw(); scheduleDrop();
  }, [redraw, scheduleDrop]);

  const togglePause = useCallback(() => {
    const g = gRef.current; if (!g) return;
    if (g.gs === "playing") {
      g.gs = "paused";
      if (dropR.current) clearTimeout(dropR.current);
    } else if (g.gs === "paused") {
      g.gs = "playing"; scheduleDrop();
    }
    redraw();
  }, [redraw, scheduleDrop]);

  /* ── 키보드 ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = gRef.current;
      if (!g) return;
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        e.preventDefault();
        if (g.gs === "playing" || g.gs === "paused") togglePause();
        return;
      }
      if (g.gs !== "playing") return;
      switch (e.key) {
        case "ArrowLeft":  e.preventDefault(); moveLeft();   break;
        case "ArrowRight": e.preventDefault(); moveRight();  break;
        case "ArrowUp":    e.preventDefault(); rotateCW();   break;
        case "ArrowDown":  e.preventDefault(); softDrop();   break;
        case " ":          e.preventDefault(); hardDrop();   break;
        case "z": case "Z": e.preventDefault(); rotateCCW(); break;
        case "x": case "X": e.preventDefault(); rotateCW();  break;
        case "c": case "C": case "Shift": e.preventDefault(); holdPiece(); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moveLeft, moveRight, rotateCW, rotateCCW, softDrop, hardDrop, holdPiece, togglePause]);

  /* ── 렌더링 데이터 ── */
  const g = gRef.current;

  const display: (Cell | "ghost")[][] = g
    ? (() => {
        const d: Cell[][] = g.board.map(row => [...row]);
        const gy = ghostY(g.board, g.t, g.r, g.px, g.py);
        const s  = shapeOf(g.t, g.r);
        for (let row = 0; row < s.length; row++)
          for (let col = 0; col < s[row].length; col++)
            if (s[row][col]) {
              const nr = gy + row, nc = g.px + col;
              if (nr >= 0 && nr < H && nc >= 0 && nc < W && !d[nr][nc])
                (d[nr][nc] as unknown as string) = `ghost:${colorOf(g.t)}`;
            }
        for (let row = 0; row < s.length; row++)
          for (let col = 0; col < s[row].length; col++)
            if (s[row][col]) {
              const nr = g.py + row, nc = g.px + col;
              if (nr >= 0 && nr < H && nc >= 0 && nc < W) d[nr][nc] = colorOf(g.t);
            }
        return d;
      })()
    : emptyBoard();

  const CELL_PX = 28;

  /* ── JSX ── */
  return (
    <main className="min-h-screen bg-[#06090f] flex flex-col items-center justify-start p-3 sm:p-6 relative overflow-x-hidden">
      {/* 배경 오브 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-cyan-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[110px]" />
      </div>

      {/* 헤더 */}
      <div className="relative w-full max-w-2xl flex items-center gap-4 mb-5 pt-2">
        <Link href="/games" className="text-white/25 hover:text-amber-300/70 transition-colors text-sm tracking-wide">
          ← 게임 목록
        </Link>
        <div className="w-px h-4 bg-white/10" />
        <h1 className="text-lg font-semibold text-[#f0ead6] tracking-wide">테트리스</h1>
      </div>

      {/* 게임 영역 */}
      <div className="relative flex items-start gap-3 sm:gap-4">

        {/* 왼쪽 패널 */}
        <div className="flex flex-col gap-3 w-[80px] sm:w-[90px]">
          {/* HOLD */}
          <div className="bg-white/[0.04] rounded-xl p-2 border border-white/[0.07]">
            <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2 text-center">HOLD</p>
            <div className="flex items-center justify-center h-10">
              {g?.held
                ? <div className={g.canHold ? "" : "opacity-40"}><MiniPiece type={g.held} size={14} /></div>
                : <span className="text-white/10 text-xs">—</span>}
            </div>
          </div>

          {/* 스코어 */}
          <div className="bg-white/[0.04] rounded-xl p-2 border border-white/[0.07] space-y-2">
            {[
              { label: "SCORE", value: g?.score.toLocaleString() ?? "0" },
              { label: "LEVEL", value: String(g?.level ?? 1) },
              { label: "LINES", value: String(g?.lines ?? 0) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] text-white/25 uppercase tracking-widest">{label}</p>
                <p className="text-white/80 font-semibold text-sm tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 보드 */}
        <div className="relative">
          <div
            className="relative rounded-xl overflow-hidden border border-white/[0.08]"
            style={{
              width: W * CELL_PX,
              height: H * CELL_PX,
              background: "rgba(4,6,12,0.95)",
              boxShadow: "0 0 40px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* 격자 선 */}
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
              backgroundSize: `${CELL_PX}px ${CELL_PX}px`,
            }} />

            {/* 셀 */}
            {display.map((row, ri) =>
              row.map((cell, ci) => {
                const isGhost = typeof cell === "string" && cell.startsWith("ghost:");
                const gc = isGhost ? cell.slice(6) : null;
                const color = isGhost ? null : cell;
                return (
                  <div
                    key={`${ri}-${ci}`}
                    style={{
                      position: "absolute",
                      left: ci * CELL_PX + 1,
                      top:  ri * CELL_PX + 1,
                      width: CELL_PX - 2,
                      height: CELL_PX - 2,
                      borderRadius: 3,
                      background: color
                        ? `linear-gradient(135deg, ${color}ee, ${color}aa)`
                        : isGhost
                          ? `${gc}22`
                          : "transparent",
                      border: isGhost ? `1px dashed ${gc}55` : color ? `1px solid rgba(255,255,255,0.15)` : "none",
                      boxShadow: color ? `0 0 8px ${color}44, inset 0 1px 0 rgba(255,255,255,0.2)` : "none",
                    }}
                  />
                );
              })
            )}

            {/* 오버레이: 시작 / 일시정지 / 게임오버 */}
            {(!g || g.gs === "idle" || g.gs === "over" || g.gs === "paused") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: "rgba(4,6,12,0.88)", backdropFilter: "blur(4px)" }}>
                {!g || g.gs === "idle" ? (
                  <>
                    <div className="text-5xl mb-3">🟦</div>
                    <p className="text-[#f0ead6] font-semibold text-lg mb-1">TETRIS</p>
                    <p className="text-white/30 text-xs mb-5">고전 테트리스 게임</p>
                    <button onClick={startGame}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-semibold text-sm hover:bg-cyan-500/30 transition-all">
                      시작
                    </button>
                  </>
                ) : g.gs === "over" ? (
                  <>
                    <p className="text-red-400 font-bold text-xl mb-1">GAME OVER</p>
                    <p className="text-white/50 text-sm mb-1">점수 <span className="text-amber-300 font-bold">{g.score.toLocaleString()}</span></p>
                    <p className="text-white/30 text-xs mb-5">{g.lines}줄 · Lv.{g.level}</p>
                    <button onClick={startGame}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-semibold text-sm hover:bg-cyan-500/30 transition-all">
                      다시 시작
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-white/70 font-bold text-xl mb-4">일시정지</p>
                    <button onClick={togglePause}
                      className="px-6 py-2.5 rounded-xl bg-white/[0.08] border border-white/[0.15] text-white/70 font-semibold text-sm hover:bg-white/[0.12] transition-all">
                      계속하기
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 패널 */}
        <div className="flex flex-col gap-3 w-[80px] sm:w-[90px]">
          {/* NEXT */}
          <div className="bg-white/[0.04] rounded-xl p-2 border border-white/[0.07]">
            <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2 text-center">NEXT</p>
            <div className="flex flex-col gap-3 items-center">
              {(g?.queue.slice(0, 3) ?? []).map((t, i) => (
                <div key={i} className={i === 0 ? "" : "opacity-50"}>
                  <MiniPiece type={t} size={i === 0 ? 15 : 12} />
                </div>
              ))}
            </div>
          </div>

          {/* 조작키 */}
          <div className="bg-white/[0.04] rounded-xl p-2 border border-white/[0.07]">
            <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2">조작</p>
            <div className="space-y-0.5 text-[9px] text-white/30">
              {[["←→","이동"],["↑/X","회전"],["↓","소프트"],["스페이스","하드"],["C","홀드"],["P","일시정지"]].map(([k,v])=>(
                <div key={k} className="flex justify-between gap-1">
                  <span className="text-white/50 font-mono">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 조작 버튼 */}
      {g && g.gs === "playing" && (
        <div className="mt-4 flex flex-col gap-2 sm:hidden w-full max-w-[320px]">
          {/* 상단: 홀드 + 회전 */}
          <div className="flex justify-between gap-2">
            <button onPointerDown={holdPiece}
              className="flex-1 h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/50 text-xs font-semibold active:bg-white/[0.12]">
              홀드 (C)
            </button>
            <button onPointerDown={rotateCCW}
              className="flex-1 h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/50 text-lg active:bg-white/[0.12]">
              ↺
            </button>
            <button onPointerDown={rotateCW}
              className="flex-1 h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/50 text-lg active:bg-white/[0.12]">
              ↻
            </button>
          </div>
          {/* 중단: 이동 + 소프트드롭 */}
          <div className="flex gap-2">
            <button onPointerDown={moveLeft}
              className="flex-1 h-14 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/60 text-2xl active:bg-white/[0.12]">
              ←
            </button>
            <button onPointerDown={softDrop}
              className="flex-1 h-14 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/60 text-2xl active:bg-white/[0.12]">
              ↓
            </button>
            <button onPointerDown={moveRight}
              className="flex-1 h-14 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/60 text-2xl active:bg-white/[0.12]">
              →
            </button>
          </div>
          {/* 하단: 하드드롭 + 일시정지 */}
          <div className="flex gap-2">
            <button onPointerDown={hardDrop}
              className="flex-[2] h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-sm font-bold active:bg-cyan-500/25">
              하드 드롭 ⬇
            </button>
            <button onPointerDown={togglePause}
              className="flex-1 h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/40 text-xs active:bg-white/[0.12]">
              일시정지
            </button>
          </div>
        </div>
      )}

      {/* 게임오버/일시정지 시 모바일 버튼 */}
      {g && (g.gs === "paused") && (
        <div className="mt-4 sm:hidden">
          <button onClick={togglePause}
            className="px-8 py-3 rounded-xl bg-white/[0.08] border border-white/[0.15] text-white/70 font-semibold text-sm">
            계속하기
          </button>
        </div>
      )}
    </main>
  );
}
