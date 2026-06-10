"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { socket } from './socket';
import Card from './Card';
import PlayerSeat from './PlayerSeat';
import BettingControls from './BettingControls';
import { playCard, playNewRound, playWin } from './sounds';

const PHASE_LABELS: Record<string, string> = {
  waiting: '대기', 'pre-flop': 'Pre-Flop', flop: 'Flop', turn: 'Turn', river: 'River', showdown: 'Showdown',
};
const PHASE_COLORS: Record<string, string> = {
  waiting: '#6b7280', 'pre-flop': '#60a5fa', flop: '#34d399', turn: '#f59e0b', river: '#f87171', showdown: '#fbbf24',
};

// 5인 테이블 고정 좌석 (나=하단 중앙, 상대 최대 4명)
// 중앙(50%) 없음 — TL → TR → L → R 순서로 채움
type SeatPos = { top: string; left?: string; right?: string; transform: string; zIndex: number };
const ALL_SEATS: SeatPos[] = [
  { top: '3%', left: '22%',  transform: 'translateX(-50%)', zIndex: 2 }, // 0: 상단 좌
  { top: '3%', left: '78%',  transform: 'translateX(-50%)', zIndex: 2 }, // 1: 상단 우
  { top: '44%', left: '1%',  transform: 'translateY(-50%)', zIndex: 2 }, // 2: 왼쪽
  { top: '44%', right: '1%', transform: 'translateY(-50%)', zIndex: 2 }, // 3: 오른쪽
];
// 인원수별 사용할 슬롯 인덱스
const SEAT_ORDER = [[], [0], [0, 1], [0, 1, 2], [0, 1, 2, 3]];

export default function GameTable({ gameState, playerId, roomId }: { gameState: any; playerId: string; roomId: string }) {
  const [copied, setCopied] = useState(false);
  const [smallBlind, setSmallBlind] = useState(1000);
  const [bigBlind, setBigBlind] = useState(2000);
  const prevPhase = useRef(gameState.phase);
  const prevCommunity = useRef(gameState.communityCards.length);
  const prevWinners = useRef(gameState.winners.length);

  useEffect(() => {
    const phase = gameState.phase;
    const commLen = gameState.communityCards.length;
    if (prevPhase.current === 'waiting' && phase === 'pre-flop') playNewRound();
    else if (commLen > prevCommunity.current) {
      const newCards = commLen - prevCommunity.current;
      for (let i = 0; i < newCards; i++) setTimeout(() => playCard(), i * 120);
    }
    if (gameState.winners.length > prevWinners.current) playWin();
    prevPhase.current = phase;
    prevCommunity.current = commLen;
    prevWinners.current = gameState.winners.length;
  }, [gameState.phase, gameState.communityCards.length, gameState.winners.length]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const myPlayer = gameState.players.find((p: any) => p.id === playerId);
  const others = gameState.players.filter((p: any) => p.id !== playerId);
  const isHost = gameState.hostId === playerId;
  const canStart = isHost && gameState.phase === 'waiting' && gameState.players.length >= 2;
  const canAddBot = isHost && gameState.phase === 'waiting' && gameState.players.length < 5;
  const phaseColor = PHASE_COLORS[gameState.phase] || '#9ca3af';
  const slotIndices = SEAT_ORDER[Math.min(others.length, 4)];

  const fmtPot = (v: number) =>
    v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toLocaleString();

  return (
    <div className="min-h-screen flex flex-col select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(22,101,52,0.06) 0%, transparent 50%), linear-gradient(180deg, #06090e 0%, #080b12 50%, #050508 100%)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.55)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/games" className="text-gray-500 hover:text-gray-300 transition-colors mr-0.5" style={{ fontSize: 13 }}>←</Link>
          <span className="font-bold tracking-wide whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
            style={{ fontFamily: "'Playfair Display', serif", background: 'linear-gradient(135deg, #fcd34d, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            ♠ Hold'em
          </span>
          <span className="hidden sm:inline flex-shrink-0" style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span className="font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
            style={{ color: phaseColor, background: `${phaseColor}18`, border: `1px solid ${phaseColor}40`, fontSize: 11 }}>
            {PHASE_LABELS[gameState.phase]}
          </span>
        </div>
        <button onClick={copyRoomId} className="text-xs px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-150 flex-shrink-0"
          style={{ background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`, color: copied ? '#4ade80' : '#9ca3af' }}>
          {copied ? '✓ 복사됨' : `# ${roomId}`}
        </button>
      </div>

      {/* ── Game area (flex col: table zone + panels) ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Table zone — relative, takes remaining space */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: 260 }}>

          {/* Opponent seats — absolute around the table */}
          {others.map((player: any, idx: number) => (
            <div key={player.id} className="absolute"
              style={ALL_SEATS[slotIndices[idx]] ?? ALL_SEATS[0]}>
              <PlayerSeat
                player={player}
                isMe={false}
                phase={gameState.phase}
                actionDeadline={player.isCurrentActor ? gameState.actionDeadline : null}
              />
            </div>
          ))}

          {/* Poker table — centered */}
          <div className="poker-table absolute"
            style={{
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(260px, 56%, 480px)',
              aspectRatio: '2 / 1',
              zIndex: 1,
            }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map(i => {
                  const card = gameState.communityCards[i];
                  return card
                    ? <Card key={i} card={card} hidden={false} large />
                    : <div key={i} className="rounded-lg" style={{ width: 'clamp(44px,12vw,66px)', height: 'clamp(62px,17vw,92px)', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.07)' }} />;
                })}
              </div>
              {gameState.pot > 0 && (
                <div className="px-4 py-1.5 rounded-full font-bold"
                  style={{ background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24', boxShadow: '0 0 20px rgba(251,191,36,0.2)', fontSize: 13 }}>
                  팟 {fmtPot(gameState.pot)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Showdown panel — natural flow, never overlaps table ── */}
        {gameState.phase === 'showdown' && gameState.winners.length > 0 && (
          <div className="mx-3 mb-2 rounded-2xl p-4 text-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(30,20,5,0.97), rgba(20,15,3,0.97))', border: '1px solid rgba(251,191,36,0.4)', boxShadow: '0 0 30px rgba(251,191,36,0.2)' }}>
            <div className="text-yellow-400 font-bold text-base mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              {gameState.winners.length === 1 ? '🏆 Winner' : '🏆 Split Pot'}
            </div>
            {gameState.winners.map((w: any) => (
              <div key={w.playerId} className="text-white mb-1 text-sm">
                <span className="font-bold">{w.playerName}</span>
                {w.hand && (
                  <span className="mx-2 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                    {w.hand.name}
                  </span>
                )}
                <span className="text-green-400 font-bold"> +{fmtPot(w.pot)}</span>
              </div>
            ))}
            {isHost && (
              <button className="mt-3 px-8 py-2 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #166534, #14532d)', border: '1px solid rgba(74,222,128,0.3)', color: '#86efac', boxShadow: '0 4px 16px rgba(22,101,52,0.4)' }}
                onClick={() => socket.emit('next-round')}>다음 라운드</button>
            )}
          </div>
        )}

        {/* ── Waiting room panel — natural flow ── */}
        {gameState.phase === 'waiting' && (
          <div className="mx-3 mb-2 rounded-2xl p-4 flex-shrink-0"
            style={{ background: 'rgba(8,10,18,0.95)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
            <p className="text-gray-500 text-xs text-center mb-2 tracking-widest uppercase">
              참가자 {gameState.players.length}명{gameState.players.length < 2 && ' · 최소 2명 필요'}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center mb-3">
              {gameState.players.map((p: any) => (
                <span key={p.id} className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                  style={{
                    background: p.id === playerId ? 'rgba(74,222,128,0.1)' : p.isBot ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${p.id === playerId ? 'rgba(74,222,128,0.3)' : p.isBot ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.1)'}`,
                    color: p.id === playerId ? '#4ade80' : p.isBot ? '#a78bfa' : '#9ca3af',
                  }}>
                  {p.isBot && <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.05em' }}>BOT</span>}
                  {p.id === playerId ? `${p.name} (나)` : p.name}
                </span>
              ))}
            </div>
            {canAddBot && (
              <div className="flex justify-center mb-3">
                <button onClick={() => socket.emit('add-bot')} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}>
                  + 봇 추가
                </button>
              </div>
            )}
            {canStart ? (
              <div className="text-center">
                <div className="flex gap-3 justify-center mb-3 flex-wrap">
                  {([
                    { label: '스몰 블라인드', val: smallBlind, setter: (v: number) => { setSmallBlind(v); setBigBlind(v * 2); } },
                    { label: '빅 블라인드', val: bigBlind, setter: (v: number) => setBigBlind(v) },
                  ] as { label: string; val: number; setter: (v: number) => void }[]).map(({ label, val, setter }) => (
                    <div key={label} className="text-center">
                      <label className="text-xs text-gray-500 block mb-1 tracking-wide">{label}</label>
                      <input type="number" className="w-24 px-2 py-1.5 rounded-xl text-center text-sm font-bold focus:outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}
                        value={val} onChange={e => setter(Math.max(1, Number(e.target.value)))} />
                    </div>
                  ))}
                </div>
                <button className="px-10 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #166534, #14532d)', border: '1px solid rgba(74,222,128,0.3)', color: '#86efac', boxShadow: '0 4px 20px rgba(22,101,52,0.4)' }}
                  onClick={() => socket.emit('start-game', { smallBlind, bigBlind })}>게임 시작</button>
              </div>
            ) : (
              <p className="text-gray-600 text-sm text-center">
                {isHost ? '다른 플레이어를 기다리는 중...' : '방장이 게임을 시작하면 시작됩니다'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom bar — my player + betting controls ── */}
      <div className="flex-shrink-0" style={{ background: 'rgba(4,5,10,0.96)', borderTop: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}>
        {myPlayer && (
          <PlayerSeat
            player={myPlayer}
            isMe
            phase={gameState.phase}
            handStrength={gameState.myHandStrength}
            actionDeadline={myPlayer.isCurrentActor ? gameState.actionDeadline : null}
          />
        )}
        {myPlayer && !['waiting', 'showdown'].includes(gameState.phase) && (
          <BettingControls gameState={gameState} playerId={playerId} />
        )}
      </div>
    </div>
  );
}
