"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

// ── Symbols ─────────────────────────────────────────────────
const SYMBOLS = [
  { id: 0, emoji: "🍒", name: "체리",  weight: 32, pay3: 20,   pay2: 2 },
  { id: 1, emoji: "🍋", name: "레몬",  weight: 26, pay3: 30,   pay2: 0 },
  { id: 2, emoji: "🍊", name: "오렌지", weight: 20, pay3: 40,   pay2: 0 },
  { id: 3, emoji: "🍇", name: "포도",  weight: 12, pay3: 80,   pay2: 0 },
  { id: 4, emoji: "🔔", name: "벨",    weight: 6,  pay3: 200,  pay2: 0 },
  { id: 5, emoji: "💰", name: "BAR",   weight: 3,  pay3: 500,  pay2: 0 },
  { id: 6, emoji: "7️⃣", name: "777",  weight: 1,  pay3: 2000, pay2: 0 },
] as const;

type SymId = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Row3  = [SymId, SymId, SymId];

function pickSym(): SymId {
  const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r <= 0) return s.id as SymId;
  }
  return 0;
}

function randRow(): Row3 {
  return [pickSym(), pickSym(), pickSym()];
}

const BET_OPTS = [1, 5, 10, 50, 100];

// ── Component ───────────────────────────────────────────────
export default function SlotPage() {
  const [rows, setRows]         = useState<Row3[]>([[0,0,0],[1,1,1],[2,2,2]]);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [credits, setCredits]   = useState(200);
  const [bet, setBet]           = useState(10);
  const [winAmt, setWinAmt]     = useState(0);
  const [msg, setMsg]           = useState("행운을 빌어요! 🎰");
  const [winFlash, setWinFlash] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [autoCount, setAutoCount] = useState(0); // spins done in auto mode

  // Refs — keep latest values accessible inside async callbacks
  const autoRef      = useRef(false);
  const creditsRef   = useRef(200);
  const betRef       = useRef(10);
  const isSpinRef    = useRef(false); // true while any reel is spinning
  const ivRefs       = useRef<ReturnType<typeof setInterval>[]>([]);
  const tmRefs       = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { creditsRef.current = credits; }, [credits]);
  useEffect(() => { betRef.current = bet; }, [bet]);

  // ── Core spin (reads from refs to avoid stale closures) ──
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
    setMsg("");

    const results: Row3[] = [randRow(), randRow(), randRow()];
    setSpinning([true, true, true]);

    ivRefs.current.forEach(clearInterval);
    tmRefs.current.forEach(clearTimeout);
    ivRefs.current = [];
    tmRefs.current = [];

    // Rapid-cycle intervals per reel
    [0, 1, 2].forEach(ri => {
      const iv = setInterval(() => {
        setRows(prev => { const n = [...prev] as Row3[]; n[ri] = randRow(); return n; });
      }, 55);
      ivRefs.current[ri] = iv;
    });

    // Sequential reel stops
    const stops = [950, 1800, 2700];
    stops.forEach((delay, ri) => {
      const t = setTimeout(() => {
        clearInterval(ivRefs.current[ri]);
        setRows(prev => { const n = [...prev] as Row3[]; n[ri] = results[ri]; return n; });
        setSpinning(prev => { const n = [...prev]; n[ri] = false; return n; });

        if (ri === 2) {
          isSpinRef.current = false;

          const t2 = setTimeout(() => {
            // Evaluate center row
            const [s0, s1, s2] = results.map(r => r[1]) as [SymId, SymId, SymId];
            let win = 0;
            if (s0 === s1 && s1 === s2) {
              win = SYMBOLS[s0].pay3 * currentBet;
            } else {
              const ch = [s0, s1, s2].filter(s => s === 0).length;
              if (ch >= 2)      win = SYMBOLS[0].pay2 * currentBet;
              else if (s0 === 0) win = 1 * currentBet;
            }

            setWinAmt(win);
            if (win > 0) {
              setCredits(c => { const n = c + win; creditsRef.current = n; return n; });
              setWinFlash(true);
              if (win >= 500 * currentBet)      setMsg("🎉 JACKPOT!!!");
              else if (win >= 100 * currentBet) setMsg("🔥 BIG WIN!");
              else if (win >= 20 * currentBet)  setMsg("✨ WIN!");
              else                              setMsg("👍 당첨!");
            } else {
              setMsg("아쉽네요...");
            }

            // Auto-spin continuation
            if (autoRef.current) {
              if (creditsRef.current >= betRef.current) {
                setAutoCount(c => c + 1);
                // Pause longer on wins so the user can see the result
                const pause = win >= 20 * currentBet ? 1400 : 700;
                tmRefs.current.push(setTimeout(handleSpin, pause));
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
  }, []); // stable — all state accessed via refs

  // ── Auto-spin toggle ──────────────────────────────────────
  const toggleAuto = useCallback(() => {
    const next = !autoRef.current;
    autoRef.current = next;
    setAutoSpin(next);
    if (next) {
      setAutoCount(0);
      if (!isSpinRef.current) handleSpin();
    } else {
      // Cancel any pending auto-spin timeout (intervals already cleared between spins)
      tmRefs.current.forEach(clearTimeout);
      tmRefs.current = [];
    }
  }, [handleSpin]);

  const handleRecharge = () => {
    setCredits(c => { const n = c + 200; creditsRef.current = n; return n; });
    setMsg("크레딧 200 충전 🎰");
    setWinAmt(0);
    setWinFlash(false);
  };

  const isAny  = spinning.some(Boolean);
  const broke  = credits < bet && !isAny;

  return (
    <main className="min-h-screen bg-[#06090f] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-amber-500/[0.05] rounded-full blur-[130px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-red-600/[0.06] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[320px]">
        {/* Back */}
        <Link href="/games" className="inline-flex items-center gap-2 text-white/30 hover:text-amber-300/70 transition-colors text-sm mb-5">
          ← 게임 목록
        </Link>

        {/* Title */}
        <div className="text-center mb-5">
          <p className="text-[11px] tracking-[0.35em] text-white/20 uppercase mb-1">classic slot</p>
          <h1 className="text-3xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-red-400 to-amber-200">
            CHERRY MASTER
          </h1>
        </div>

        {/* Credit / Win bar */}
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
        <div className={`bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 backdrop-blur-xl rounded-3xl p-5 border shadow-[0_8px_64px_rgba(0,0,0,0.7)] transition-all duration-300 ${winFlash ? "border-amber-400/40 shadow-[0_0_60px_rgba(251,191,36,0.15)]" : autoSpin ? "border-emerald-500/20" : "border-white/[0.07]"}`}>

          {/* Status message */}
          <div className="h-7 flex items-center justify-center mb-3">
            <span className={`text-sm font-semibold tracking-wide ${
              msg.includes("WIN") || msg.includes("JACKPOT") || msg.includes("당첨")
                ? "text-amber-300 animate-pulse"
                : autoSpin && !msg.includes("부족")
                  ? "text-emerald-400/60"
                  : "text-white/25"
            }`}>
              {autoSpin && !isAny && !msg ? "⟳ 자동 스핀 중..." : msg}
            </span>
          </div>

          {/* Reels */}
          <div className="flex gap-2 justify-center mb-3">
            {[0, 1, 2].map(ri => (
              <div
                key={ri}
                className={`relative w-[80px] h-[240px] bg-black/60 rounded-2xl overflow-hidden border transition-all duration-300 ${
                  winFlash && !spinning[ri] ? "border-amber-400/30" : "border-white/[0.07]"
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/85 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/85 to-transparent z-10 pointer-events-none" />
                <div className={`absolute inset-x-0 top-[80px] h-[80px] border-y z-10 pointer-events-none transition-all duration-300 ${
                  winFlash ? "border-amber-400/40 bg-amber-400/[0.06]" : "border-amber-400/[0.12] bg-transparent"
                }`} />
                <div className={`flex flex-col transition-[filter] duration-75 ${spinning[ri] ? "blur-[1.5px]" : ""}`}>
                  {rows[ri].map((sid, si) => (
                    <div
                      key={si}
                      className={`w-[80px] h-[80px] flex items-center justify-center select-none transition-opacity duration-100 ${
                        si === 1 ? "text-[38px] opacity-100" : "text-[30px] opacity-40"
                      }`}
                    >
                      {SYMBOLS[sid].emoji}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-white/10 text-[9px] tracking-[0.5em] uppercase mb-4">WIN LINE</p>

          {/* Bet presets */}
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

          {/* Spin + Auto buttons */}
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

        {/* Payout table */}
        <div className="mt-5 bg-white/[0.02] rounded-2xl p-4 border border-white/[0.05]">
          <p className="text-white/15 text-[9px] uppercase tracking-[0.35em] text-center mb-3">배당표 (BET × N)</p>
          <div className="space-y-1.5">
            {SYMBOLS.map(sym => (
              <div key={sym.id} className="flex items-center justify-between">
                <span className="text-[22px] tracking-tight leading-none">
                  {sym.emoji}{sym.emoji}{sym.emoji}
                </span>
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
