"use client";

import { useState, useEffect } from 'react';
import Card from './Card';

const ACTION_TIMEOUT_SEC = 30;

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #7c3aed, #4f46e5)',
  'linear-gradient(135deg, #dc2626, #9f1239)',
  'linear-gradient(135deg, #0891b2, #0e7490)',
  'linear-gradient(135deg, #d97706, #b45309)',
  'linear-gradient(135deg, #059669, #047857)',
  'linear-gradient(135deg, #db2777, #be185d)',
];

function getGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

const HAND_COLORS = [
  { bg: 'rgba(107,114,128,0.2)', border: 'rgba(107,114,128,0.4)', text: '#9ca3af' },
  { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd' },
  { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', text: '#a5b4fc' },
  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', text: '#6ee7b7' },
  { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.4)', text: '#5eead4' },
  { bg: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.4)', text: '#7dd3fc' },
  { bg: 'rgba(139,92,246,0.2)', border: 'rgba(139,92,246,0.5)', text: '#c4b5fd' },
  { bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.5)', text: '#fcd34d' },
  { bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.5)', text: '#fca5a5' },
  { bg: 'rgba(251,191,36,0.25)', border: 'rgba(251,191,36,0.7)', text: '#fbbf24' },
];

const SUITS: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

function MiniCard({ card, hidden }: { card: any; hidden: boolean }) {
  if (!card || hidden || card.hidden) {
    return (
      <div style={{
        width: 30, height: 42, borderRadius: 5, flexShrink: 0,
        background: 'linear-gradient(135deg, #1a0533 0%, #2d0a5e 50%, #1a0533 100%)',
        border: '1.5px solid #7c3aed',
        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: 'rgba(167,139,250,0.5)', fontSize: 14 }}>♦</span>
      </div>
    );
  }
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  return (
    <div style={{
      width: 30, height: 42, borderRadius: 5, flexShrink: 0,
      background: '#fffdf8', border: '1px solid rgba(0,0,0,0.1)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      justifyContent: 'space-between', padding: '2px 3px',
      color: isRed ? '#dc2626' : '#111827', fontWeight: 800, fontSize: 9,
    }}>
      <div style={{ lineHeight: 1 }}>{card.value}<br /><span>{SUITS[card.suit]}</span></div>
      <div style={{ lineHeight: 1, transform: 'rotate(180deg)', alignSelf: 'flex-end' }}>{card.value}<br /><span>{SUITS[card.suit]}</span></div>
    </div>
  );
}

interface Player {
  id: string; name: string; chips: number; totalBet: number;
  folded: boolean; allIn: boolean; isBot: boolean; isDealer: boolean;
  isCurrentActor: boolean; hand: any[];
}
interface HandStrength { rank: number; name: string; }

export default function PlayerSeat({ player, isMe, phase, actionDeadline, handStrength }: {
  player?: Player; isMe?: boolean; phase: string;
  actionDeadline?: number | null; handStrength?: HandStrength | null;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!actionDeadline) { setTimeLeft(null); return; }
    const update = () => setTimeLeft(Math.max(0, Math.ceil((actionDeadline - Date.now()) / 1000)));
    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [actionDeadline]);

  if (!player) return isMe ? null : <div style={{ width: 88, height: 100 }} />;

  const isActive = player.isCurrentActor;
  const showdown = phase === 'showdown';

  // ── Bottom bar (me) ──────────────────────────────────────────────
  if (isMe) {
    return (
      <div className="flex items-center gap-3 px-4 py-2">
        {/* My hole cards — hidden during waiting, greyed when folded */}
        <div className="flex gap-1.5 flex-shrink-0"
          style={{ opacity: player.folded ? 0.3 : 1, filter: player.folded ? 'grayscale(0.7)' : 'none', transition: 'opacity 0.3s, filter 0.3s' }}>
          {player.hand?.length > 0 && phase !== 'waiting' ? (
            player.hand.map((card: any, i: number) => <Card key={i} card={card} hidden={false} />)
          ) : (
            <>
              <div style={{ width: 52, height: 74, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
              <div style={{ width: 52, height: 74, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </>
          )}
        </div>

        {/* My info */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {player.isDealer && <span className="dealer-btn">D</span>}
            <span className="font-bold text-sm" style={{ color: '#4ade80' }}>
              {player.name} <span className="font-normal text-xs text-gray-500">(나)</span>
            </span>
            {isActive && (
              <span className="px-1.5 py-0.5 rounded-full font-bold"
                style={{ fontSize: 9, background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)' }}>
                내 차례
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ color: '#fbbf24', fontSize: 11 }}>⬤</span>
            {player.allIn ? (
              <span className="text-red-400 font-bold text-sm">ALL IN</span>
            ) : (
              <span className="font-semibold text-sm" style={{ color: '#fcd34d' }}>
                {player.chips >= 1000000 ? `${(player.chips / 1000000).toFixed(2)}M` : player.chips >= 1000 ? `${(player.chips / 1000).toFixed(0)}K` : player.chips.toLocaleString()}
              </span>
            )}
            {handStrength && !player.folded && (
              <span className="px-2 py-0.5 rounded-full font-bold" style={{
                fontSize: 10,
                background: HAND_COLORS[handStrength.rank]?.bg,
                border: `1px solid ${HAND_COLORS[handStrength.rank]?.border}`,
                color: HAND_COLORS[handStrength.rank]?.text,
              }}>
                {handStrength.name}
              </span>
            )}
            {player.folded && <span className="text-gray-500 font-bold text-xs tracking-wider">FOLDED</span>}
          </div>
          {player.totalBet > 0 && !['waiting', 'showdown'].includes(phase) && (
            <div className="chip-badge text-yellow-300" style={{ fontSize: 10, display: 'inline-block', padding: '2px 8px' }}>
              베팅 {player.totalBet >= 1000 ? `${(player.totalBet / 1000).toFixed(0)}K` : player.totalBet.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Opponent seat (around the table) ────────────────────────────
  const RING = 76;
  const R = 33;
  const AVA = 50;

  return (
    <div className="flex flex-col items-center" style={{ gap: 4, opacity: player.folded ? 0.45 : 1, filter: player.folded ? 'grayscale(0.6)' : 'none', transition: 'opacity 0.3s, filter 0.3s', transform: isActive ? 'scale(1.06)' : 'scale(1)', transformOrigin: 'bottom center' }}>

      {/* Avatar + timer ring */}
      <div className="relative flex items-center justify-center" style={{ width: RING, height: RING }}>
        {/* Glow when active */}
        {isActive && (
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: '0 0 18px rgba(251,191,36,0.65), 0 0 36px rgba(251,191,36,0.3)' }} />
        )}

        {/* Timer SVG */}
        {timeLeft !== null && (
          <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} className="absolute inset-0 pointer-events-none"
            style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle cx={RING / 2} cy={RING / 2} r={R} fill="none"
              stroke={timeLeft <= 10 ? '#ef4444' : '#fbbf24'} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * R}`}
              strokeDashoffset={`${2 * Math.PI * R * (1 - timeLeft / ACTION_TIMEOUT_SEC)}`}
              style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.3s', filter: `drop-shadow(0 0 4px ${timeLeft <= 10 ? '#ef4444' : '#fbbf24'})` }}
            />
          </svg>
        )}

        {/* Avatar circle */}
        <div className="relative flex items-center justify-center rounded-full font-bold"
          style={{
            width: AVA, height: AVA,
            background: getGradient(player.name),
            border: isActive ? '2px solid #fbbf24' : '2px solid rgba(255,255,255,0.15)',
            boxShadow: isActive ? '0 0 10px rgba(251,191,36,0.5)' : '0 4px 12px rgba(0,0,0,0.6)',
            fontSize: 18, color: 'white',
          }}>
          {player.name.slice(0, 1).toUpperCase()}

          {/* Dealer badge */}
          {player.isDealer && (
            <div className="dealer-btn absolute" style={{ width: 17, height: 17, fontSize: 7, top: -2, right: -2 }}>D</div>
          )}

          {/* Folded overlay */}
          {player.folded && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.55)', fontSize: 9, color: '#6b7280', fontWeight: 700 }}>
              FOLD
            </div>
          )}
        </div>
      </div>

      {/* Name + chips info tag */}
      <div className="text-center px-2 py-1 rounded-lg"
        style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 78, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div className="flex items-center justify-center gap-1">
          {player.isBot && (
            <span style={{ fontSize: 7, fontWeight: 800, color: '#a78bfa', background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 2, padding: '0 2px' }}>BOT</span>
          )}
          <span className="text-white font-semibold truncate" style={{ fontSize: 11, maxWidth: 68 }}>{player.name}</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          {player.allIn ? (
            <span style={{ fontSize: 10, fontWeight: 800, color: '#f87171', letterSpacing: '0.04em' }}>ALL IN</span>
          ) : (
            <>
              <span style={{ color: '#fbbf24', fontSize: 9 }}>⬤</span>
              <span style={{ color: '#fcd34d', fontSize: 11, fontWeight: 600 }}>
                {player.chips >= 1000000 ? `${(player.chips / 1000000).toFixed(1)}M` : player.chips >= 1000 ? `${(player.chips / 1000).toFixed(0)}K` : player.chips.toLocaleString()}
              </span>
            </>
          )}
        </div>
        {player.totalBet > 0 && !['waiting', 'showdown'].includes(phase) && (
          <div className="mt-0.5" style={{ fontSize: 9, color: '#86efac', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '1px 6px' }}>
            베팅 {player.totalBet >= 1000000 ? `${(player.totalBet / 1000000).toFixed(1)}M` : player.totalBet >= 1000 ? `${(player.totalBet / 1000).toFixed(0)}K` : player.totalBet.toLocaleString()}
          </div>
        )}
      </div>

      {/* Mini hole cards */}
      {player.hand?.length > 0 && phase !== 'waiting' && (
        <div className="flex gap-1">
          {player.hand.map((card: any, i: number) => (
            <MiniCard key={i} card={card} hidden={!showdown && !!card?.hidden} />
          ))}
        </div>
      )}
    </div>
  );
}
