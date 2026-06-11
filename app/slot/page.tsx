"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

// ── Symbols ─────────────────────────────────────────────────
const SYMBOLS = [
  { id: 0, emoji: "🍒", weight: 32, pay3: 20,   pay2: 2 },
  { id: 1, emoji: "🍋", weight: 26, pay3: 30,   pay2: 0 },
  { id: 2, emoji: "🍊", weight: 20, pay3: 40,   pay2: 0 },
  { id: 3, emoji: "🍇", weight: 12, pay3: 80,   pay2: 0 },
  { id: 4, emoji: "🔔", weight: 6,  pay3: 200,  pay2: 0 },
  { id: 5, emoji: "💰", weight: 3,  pay3: 500,  pay2: 0 },
  { id: 6, emoji: "7️⃣", weight: 1,  pay3: 2000, pay2: 0 },
] as const;

type SymId = 0|1|2|3|4|5|6;
type Row3  = [SymId, SymId, SymId];  // [top, center, bottom]

// ── 5 Win lines  (cells: [reelIdx, rowIdx]) ─────────────────
const WIN_LINES = [
  { id: 0, name: "상단 ━",  color: "#38bdf8", cells: [[0,0],[1,0],[2,0]] }, // top    sky
  { id: 1, name: "중단 ━",  color: "#fbbf24", cells: [[0,1],[1,1],[2,1]] }, // mid    amber
  { id: 2, name: "하단 ━",  color: "#4ade80", cells: [[0,2],[1,2],[2,2]] }, // bot    green
  { id: 3, name: "↘ 대각",  color: "#c084fc", cells: [[0,0],[1,1],[2,2]] }, // diag ↘ purple
  { id: 4, name: "↗ 대각",  color: "#fb7185", cells: [[0,2],[1,1],[2,0]] }, // diag ↗ rose
] as const;

// SVG cell centers — reels: 80px wide, 8px gap → total 256×240
const CELL_X = [40, 128, 216]; // reel 0,1,2 center X
const CELL_Y = [40, 120, 200]; // row  0,1,2 center Y

// ── Helpers ──────────────────────────────────────────────────
function pickSym(): SymId {
  const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SYMBOLS) { r -= s.weight; if (r <= 0) return s.id as SymId; }
  return 0;
}
function randRow(): Row3 { return [pickSym(), pickSym(), pickSym()]; }

interface LineResult { lineId: number; win: number; }

function evalAllLines(rows: Row3[], bet: number): LineResult[] {
  return WIN_LINES.flatMap(line => {
    const syms = line.cells.map(([ri, row]) => rows[ri][row]) as [SymId, SymId, SymId];
    const [s0, s1, s2] = syms;
    let win = 0;
    if (s0 === s1 && s1 === s2) {
      win = SYMBOLS[s0].pay3 * bet;
    } else {
      const cherries = syms.filter(s => s === 0).length;
      if (cherries >= 2)       win = SYMBOLS[0].pay2 * bet;
      else if (s0 === 0)       win = 1 * bet;
    }
    return win > 0 ? [{ lineId: line.id, win }] : [];
  });
}

// ── Speed presets ────────────────────────────────────────────
const SPEEDS = [
  { id: 0, label: "느림", iv: 90,  stops: [1400,2600,3800] as [number,number,number], pause:1200, winPause:2000 },
  { id: 1, label: "보통", iv: 55,  stops: [950, 1800,2700] as [number,number,number], pause: 700, winPause:1400 },
  { id: 2, label: "빠름", iv: 30,  stops: [500,  900,1300] as [number,number,number], pause: 350, winPause: 700 },
  { id: 3, label: "터보", iv: 12,  stops: [220,  400, 580] as [number,number,number], pause: 120, winPause: 350 },
] as const;

const BET_OPTS = [1, 5, 10, 50, 100];

// ── Component ────────────────────────────────────────────────
export default function SlotPage() {
  const [rows, setRows]           = useState<Row3[]>([[0,0,0],[1,1,1],[2,2,2]]);
  const [spinning, setSpinning]   = useState([false, false, false]);
  const [credits, setCredits]     = useState(200);
  const [bet, setBet]             = useState(10);
  const [winAmt, setWinAmt]       = useState(0);
  const [winResults, setWinResults] = useState<LineResult[]>([]);
  const [msg, setMsg]             = useState("행운을 빌어요! 🎰");
  const [winFlash, setWinFlash]   = useState(false);
  const [autoSpin, setAutoSpin]   = useState(false);
  const [autoCount, setAutoCount] = useState(0);
  const [speed, setSpeed]         = useState(1);

  const autoRef    = useRef(false);
  const creditsRef = useRef(200);
  const betRef     = useRef(10);
  const speedRef   = useRef(1);
  const isSpinRef  = useRef(false);
  const ivRefs     = useRef<ReturnType<typeof setInterval>[]>([]);
  const tmRefs     = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { creditsRef.current = credits; }, [credits]);
  useEffect(() => { betRef.current = bet; }, [bet]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // winning cell lookup: "ri-si" → line color
  const winCellColor = useCallback((ri: number, si: number): string | null => {
    for (const wr of winResults) {
      const line = WIN_LINES[wr.lineId];
      if (line.cells.some(([r, s]) => r === ri && s === si)) return line.color;
    }
    return null;
  }, [winResults]);

  // ── Core spin ─────────────────────────────────────────────
  const handleSpin = useCallback(() => {
    if (isSpinRef.current) return;
    if (creditsRef.current < betRef.current) {
      setMsg("크레딧이 부족해요!");
      autoRef.current = false;
      setAutoSpin(false);
      return;
    }

    const currentBet = betRef.current;
    isSpinRef.current = true;

    setCredits(c => { const n = c - currentBet; creditsRef.current = n; return n; });
    setWinAmt(0);
    setWinFlash(false);
    setWinResults([]);
    setMsg("");

    const results: Row3[] = [randRow(), randRow(), randRow()];
    setSpinning([true, true, true]);

    ivRefs.current.forEach(clearInterval);
    tmRefs.current.forEach(clearTimeout);
    ivRefs.current = [];
    tmRefs.current = [];

    const spd = SPEEDS[speedRef.current];

    [0, 1, 2].forEach(ri => {
      const iv = setInterval(() => {
        setRows(prev => { const n = [...prev] as Row3[]; n[ri] = randRow(); return n; });
      }, spd.iv);
      ivRefs.current[ri] = iv;
    });

    spd.stops.forEach((delay, ri) => {
      const t = setTimeout(() => {
        clearInterval(ivRefs.current[ri]);
        setRows(prev => { const n = [...prev] as Row3[]; n[ri] = results[ri]; return n; });
        setSpinning(prev => { const n = [...prev]; n[ri] = false; return n; });

        if (ri === 2) {
          isSpinRef.current = false;
          const t2 = setTimeout(() => {
            const wins = evalAllLines(results, currentBet);
            const totalWin = wins.reduce((s, w) => s + w.win, 0);

            setWinResults(wins);
            setWinAmt(totalWin);

            if (totalWin > 0) {
              setCredits(c => { const n = c + totalWin; creditsRef.current = n; return n; });
              setWinFlash(true);
              const maxWin = Math.max(...wins.map(w => w.win));
              if (maxWin >= 500 * currentBet)      setMsg("🎉 JACKPOT!!!");
              else if (maxWin >= 100 * currentBet) setMsg("🔥 BIG WIN!");
              else if (maxWin >= 20 * currentBet)  setMsg("✨ WIN!");
              else if (wins.length >= 2)            setMsg(`✨ ${wins.length}라인 동시 당첨!`);
              else                                  setMsg("👍 당첨!");
            } else {
              setMsg("아쉽네요...");
            }

            if (autoRef.current) {
              if (creditsRef.current >= betRef.current) {
                setAutoCount(c => c + 1);
                const { pause, winPause } = SPEEDS[speedRef.current];
                tmRefs.current.push(setTimeout(handleSpin, totalWin >= 20 * currentBet ? winPause : pause));
              } else {
                autoRef.current = false;
                setAutoSpin(false);
                setMsg("크레딧 부족 — 오토스핀 종료");
              }
            }
          }, 120);
          tmRefs.current.push(t2);
        }
      }, delay);
      tmRefs.current.push(t);
    });
  }, []);

  // ── Auto toggle ───────────────────────────────────────────
  const toggleAuto = useCallback(() => {
    const next = !autoRef.current;
    autoRef.current = next;
    setAutoSpin(next);
    if (next) {
      setAutoCount(0);
      if (!isSpinRef.current) handleSpin();
    } else {
      tmRefs.current.forEach(clearTimeout);
      tmRefs.current = [];
    }
  }, [handleSpin]);

  const handleRecharge = () => {
    setCredits(c => { const n = c + 200; creditsRef.current = n; return n; });
    setMsg("크레딧 200 충전 🎰");
    setWinAmt(0);
    setWinFlash(false);
    setWinResults([]);
  };

  const isAny = spinning.some(Boolean);
  const broke = credits < bet && !isAny;

  return (
    <main className="min-h-screen bg-[#06090f] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-amber-500/[0.05] rounded-full blur-[130px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-red-600/[0.06] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[320px]">
        <Link href="/games" className="inline-flex items-center gap-2 text-white/30 hover:text-amber-300/70 transition-colors text-sm mb-5">
          ← 게임 목록
        </Link>

        {/* Title */}
        <div className="text-center mb-4">
          <p className="text-[11px] tracking-[0.35em] text-white/20 uppercase mb-1">5 paylines</p>
          <h1 className="text-3xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-red-400 to-amber-200">
            CHERRY MASTER
          </h1>
        </div>

        {/* Credit / Win */}
        <div className="flex justify-between mb-4 px-0.5">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-white/20 uppercase">Credit</p>
            <p className="text-amber-300 text-2xl font-bold tabular-nums">{credits.toLocaleString()}</p>
          </div>
          {autoSpin && (
            <div className="text-center">
              <p className="text-[10px] tracking-[0.25em] text-emerald-400/50 uppercase">Auto</p>
              <p className="text-emerald-400 text-2xl font-bold tabular-nums">{autoCount}</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] tracking-[0.25em] text-white/20 uppercase">Win</p>
            <p className={`text-2xl font-bold tabular-nums transition-colors duration-300 ${winAmt > 0 ? "text-green-400" : "text-white/15"}`}>
              {winAmt.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Machine body */}
        <div className={`bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 border shadow-[0_8px_64px_rgba(0,0,0,0.7)] transition-all duration-300 ${
          winFlash ? "border-amber-400/40 shadow-[0_0_60px_rgba(251,191,36,0.15)]"
          : autoSpin ? "border-emerald-500/20"
          : "border-white/[0.07]"
        }`}>

          {/* Status */}
          <div className="h-7 flex items-center justify-center mb-3">
            <span className={`text-sm font-semibold tracking-wide ${
              msg.includes("WIN") || msg.includes("JACKPOT") || msg.includes("당첨")
                ? "text-amber-300 animate-pulse"
                : autoSpin && !msg ? "text-emerald-400/60"
                : "text-white/25"
            }`}>
              {autoSpin && !isAny && !msg ? "⟳ 자동 스핀 중..." : msg}
            </span>
          </div>

          {/* ── Reels + SVG overlay ── */}
          <div className="relative mx-auto mb-1" style={{ width: 256, height: 240 }}>
            {/* Reels */}
            <div className="absolute inset-0 flex gap-2">
              {[0, 1, 2].map(ri => (
                <div
                  key={ri}
                  className="relative w-[80px] h-[240px] bg-black/60 rounded-2xl overflow-hidden border border-white/[0.07]"
                >
                  <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/85 to-transparent z-10 pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/85 to-transparent z-10 pointer-events-none" />

                  <div className={`flex flex-col transition-[filter] duration-75 ${spinning[ri] ? "blur-[1.5px]" : ""}`}>
                    {rows[ri].map((sid, si) => {
                      const cc = !spinning[ri] ? winCellColor(ri, si) : null;
                      return (
                        <div
                          key={si}
                          className={`w-[80px] h-[80px] flex items-center justify-center select-none transition-all duration-200 ${
                            si === 1 ? "text-[38px] opacity-100" : "text-[30px] opacity-40"
                          }`}
                          style={cc ? { backgroundColor: `${cc}18`, boxShadow: `inset 0 0 18px ${cc}25` } : {}}
                        >
                          {SYMBOLS[sid].emoji}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* SVG win-line overlay */}
            <svg
              className="absolute inset-0 pointer-events-none z-20"
              width="256" height="240" viewBox="0 0 256 240"
            >
              {WIN_LINES.map(line => {
                const isWin = winResults.some(w => w.lineId === line.id);
                const pts = line.cells.map(([ri, row]) => `${CELL_X[ri]},${CELL_Y[row]}`).join(" ");
                return (
                  <polyline
                    key={line.id}
                    points={pts}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={isWin ? 2.5 : 1}
                    strokeOpacity={isWin ? 0.85 : 0.12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={isWin ? undefined : "4 6"}
                  />
                );
              })}
              {/* Winning cell circles */}
              {!isAny && winResults.flatMap(wr =>
                WIN_LINES[wr.lineId].cells.map(([ri, row]) => (
                  <circle
                    key={`${wr.lineId}-${ri}-${row}`}
                    cx={CELL_X[ri]} cy={CELL_Y[row]} r={28}
                    fill="none"
                    stroke={WIN_LINES[wr.lineId].color}
                    strokeWidth={1.5}
                    strokeOpacity={0.5}
                  />
                ))
              )}
            </svg>
          </div>

          {/* Win line breakdown chips */}
          <div className="min-h-[24px] flex flex-wrap gap-1 justify-center mb-3">
            {winResults.map(wr => {
              const line = WIN_LINES[wr.lineId];
              return (
                <span
                  key={wr.lineId}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: line.color, background: `${line.color}18`, border: `1px solid ${line.color}40` }}
                >
                  {line.name} +{wr.win.toLocaleString()}
                </span>
              );
            })}
          </div>

          {/* Speed */}
          <div className="flex gap-1.5 justify-center mb-2">
            {SPEEDS.map(s => (
              <button
                key={s.id}
                onClick={() => { setSpeed(s.id); speedRef.current = s.id; }}
                disabled={isAny}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 border ${
                  speed === s.id
                    ? "bg-sky-400/15 border-sky-400/35 text-sky-300"
                    : "bg-white/[0.03] border-white/[0.06] text-white/25 hover:text-white/50 hover:bg-white/[0.05]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Bet */}
          <div className="flex gap-1.5 justify-center mb-3">
            {BET_OPTS.map(b => (
              <button
                key={b}
                onClick={() => setBet(b)}
                disabled={isAny || autoSpin}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-30 border ${
                  bet === b
                    ? "bg-amber-400/15 border-amber-400/35 text-amber-300"
                    : "bg-white/[0.03] border-white/[0.06] text-white/30 hover:text-white/60 hover:bg-white/[0.06]"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Spin + Auto */}
          <div className="flex gap-2">
            <button
              onClick={handleSpin}
              disabled={isAny || credits < bet || autoSpin}
              className="flex-1 py-[14px] rounded-2xl font-black text-xl tracking-[0.25em] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                bg-gradient-to-b from-amber-400 to-orange-600 text-black
                hover:from-amber-300 hover:to-orange-500 active:scale-[0.97]
                shadow-[0_4px_28px_rgba(251,191,36,0.35)]"
            >
              {isAny && !autoSpin ? "▷ ▷ ▷" : "SPIN"}
            </button>
            <button
              onClick={toggleAuto}
              disabled={credits < bet && !autoSpin}
              className={`w-[72px] py-[14px] rounded-2xl font-black text-sm tracking-wider transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed border ${
                autoSpin
                  ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.2)] animate-pulse"
                  : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.07]"
              }`}
            >
              {autoSpin ? "STOP" : "AUTO"}
            </button>
          </div>
        </div>

        {/* Recharge */}
        {broke && (
          <button
            onClick={handleRecharge}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white/40 border border-white/[0.07] hover:text-amber-300/70 hover:border-amber-400/20 transition-all"
          >
            크레딧 부족 — 무료 충전 (+200)
          </button>
        )}

        {/* Payout + payline guide */}
        <div className="mt-5 bg-white/[0.02] rounded-2xl p-4 border border-white/[0.05]">
          {/* Payline visual guide */}
          <p className="text-white/15 text-[9px] uppercase tracking-[0.35em] text-center mb-2">페이라인</p>
          <div className="flex justify-center gap-3 mb-4">
            {WIN_LINES.map(line => (
              <div key={line.id} className="flex flex-col items-center gap-1">
                <svg width="36" height="36" viewBox="0 0 36 36">
                  {line.cells.map(([ri, row], i) => {
                    // mini 3x3 grid cell centers: 6px each, 3px gap
                    const mx = ri * 12 + 6;
                    const my = row * 12 + 6;
                    return (
                      <rect key={i} x={mx-4} y={my-4} width={8} height={8}
                        rx={2} fill={line.color} fillOpacity={0.7} />
                    );
                  })}
                  <polyline
                    points={line.cells.map(([ri, row]) => `${ri*12+6},${row*12+6}`).join(" ")}
                    fill="none" stroke={line.color} strokeWidth={1.5} strokeOpacity={0.5}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[9px]" style={{ color: line.color, opacity: 0.6 }}>{line.name}</span>
              </div>
            ))}
          </div>

          {/* Payout table */}
          <p className="text-white/15 text-[9px] uppercase tracking-[0.35em] text-center mb-2">배당표 (BET × N)</p>
          <div className="space-y-1.5">
            {SYMBOLS.map(sym => (
              <div key={sym.id} className="flex items-center justify-between">
                <span className="text-[22px] tracking-tight leading-none">{sym.emoji}{sym.emoji}{sym.emoji}</span>
                <span className="text-amber-300/50 text-xs font-mono">× {sym.pay3.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-white/[0.05] pt-2 flex items-center justify-between">
              <span className="text-[22px] leading-none">🍒🍒<span className="text-white/15">—</span></span>
              <span className="text-amber-300/50 text-xs font-mono">× 2</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
