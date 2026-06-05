"use client";

import { useState, useEffect } from 'react';
import Card from './Card';

const ACTION_TIMEOUT_SEC = 30;

const AVATAR_COLORS = [
  'linear-gradient(135deg, #7c3aed, #4f46e5)',
  'linear-gradient(135deg, #dc2626, #9f1239)',
  'linear-gradient(135deg, #0891b2, #0e7490)',
  'linear-gradient(135deg, #d97706, #b45309)',
  'linear-gradient(135deg, #059669, #047857)',
  'linear-gradient(135deg, #db2777, #be185d)',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function ChipCount({ chips }: { chips: number }) {
  if (chips === 0) return <span className="text-red-400 text-xs font-bold">올인</span>;
  if (chips >= 1000000) return <span className="text-yellow-300 text-xs">{(chips / 1000000).toFixed(1)}M</span>;
  if (chips >= 1000) return <span className="text-yellow-300 text-xs">{(chips / 1000).toFixed(0)}K</span>;
  return <span className="text-yellow-300 text-xs">{chips.toLocaleString()}</span>;
}

const HAND_COLORS = [
  { bg: 'rgba(107,114,128,0.2)',  border: 'rgba(107,114,128,0.4)',  text: '#9ca3af' },
  { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)',  text: '#93c5fd' },
  { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)',  text: '#a5b4fc' },
  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)',  text: '#6ee7b7' },
  { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.4)',  text: '#5eead4' },
  { bg: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.4)',  text: '#7dd3fc' },
  { bg: 'rgba(139,92,246,0.2)',  border: 'rgba(139,92,246,0.5)',  text: '#c4b5fd' },
  { bg: 'rgba(245,158,11,0.2)',  border: 'rgba(245,158,11,0.5)',  text: '#fcd34d' },
  { bg: 'rgba(239,68,68,0.2)',   border: 'rgba(239,68,68,0.5)',   text: '#fca5a5' },
  { bg: 'rgba(251,191,36,0.25)', border: 'rgba(251,191,36,0.7)',  text: '#fbbf24' },
];

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

  if (!player) return <div className="w-28 h-24" />;

  const isActive = player.isCurrentActor;
  const showdown = phase === 'showdown';
  const seatClass = player.folded
    ? 'player-seat player-seat-folded player-seat-other'
    : isActive ? 'player-seat player-seat-active'
    : isMe ? 'player-seat player-seat-me'
    : 'player-seat player-seat-other';

  return (
    <div className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'scale-105' : ''}`}>
      <div className="flex gap-1.5">
        {player.hand && player.hand.length > 0 ? (
          player.hand.map((card: any, i: number) => (
            <Card key={i} card={card} hidden={!isMe && !showdown && card?.hidden} />
          ))
        ) : (
          <>
            <div className="w-[52px] h-[74px] rounded-lg bg-gray-800 opacity-20 border border-gray-700" />
            <div className="w-[52px] h-[74px] rounded-lg bg-gray-800 opacity-20 border border-gray-700" />
          </>
        )}
      </div>

      <div className={seatClass}>
        <div className="flex items-center gap-2 justify-center">
          <div className="relative" style={{ width: 36, height: 36, flexShrink: 0 }}>
            {timeLeft !== null && (
              <svg width="60" height="60" viewBox="0 0 60 60"
                style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)', pointerEvents: 'none' }}>
                <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle cx="30" cy="30" r="26" fill="none"
                  stroke={timeLeft <= 10 ? '#ef4444' : '#fbbf24'} strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - timeLeft / ACTION_TIMEOUT_SEC)}`}
                  style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.3s', filter: `drop-shadow(0 0 5px ${timeLeft <= 10 ? '#ef4444' : '#fbbf24'})` }}
                />
              </svg>
            )}
            <div className="player-avatar" style={{ background: getAvatarColor(player.name) }}>
              {player.name.slice(0, 1).toUpperCase()}
            </div>
          </div>

          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5">
              {player.isDealer && <span className="dealer-btn">D</span>}
              {player.isBot && (
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.06em', color: '#a78bfa', background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 3, padding: '1px 3px' }}>BOT</span>
              )}
              <span className="font-bold text-xs truncate max-w-[70px] leading-tight">
                {player.name}{isMe ? <span className="text-green-400 ml-1">(나)</span> : ''}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-yellow-500 text-xs">⬤</span>
              {player.allIn ? <span className="text-red-400 text-xs font-bold">ALL IN</span> : <ChipCount chips={player.chips} />}
            </div>
          </div>
        </div>

        {player.totalBet > 0 && !['waiting', 'showdown'].includes(phase) && (
          <div className="chip-badge text-yellow-300 mt-1.5 text-center">베팅 {player.totalBet.toLocaleString()}</div>
        )}

        {isMe && handStrength && !player.folded && (
          <div className="mt-1.5 px-2 py-0.5 rounded-full text-center font-bold" style={{
            fontSize: 10,
            background: HAND_COLORS[handStrength.rank]?.bg,
            border: `1px solid ${HAND_COLORS[handStrength.rank]?.border}`,
            color: HAND_COLORS[handStrength.rank]?.text,
            letterSpacing: '0.03em',
          }}>
            {handStrength.name}
          </div>
        )}
      </div>
    </div>
  );
}
