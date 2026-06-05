"use client";

import { useState, useEffect, useRef } from 'react';
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
  const canAddBot = isHost && gameState.phase === 'waiting' && gameState.players.length < 6;
  const phaseColor = PHASE_COLORS[gameState.phase] || '#9ca3af';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(22,101,52,0.08) 0%, transparent 50%), linear-gradient(180deg, #06090e 0%, #080b12 50%, #050508 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2" style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-2 min-w-0">
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
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={copyRoomId} className="text-xs px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-150"
            style={{ background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`, color: copied ? '#4ade80' : '#9ca3af' }}>
            {copied ? '✓' : `# ${roomId}`}
          </button>
          {myPlayer && (
            <div className="text-xs px-2 sm:px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
              {myPlayer.chips >= 1000000 ? `${(myPlayer.chips / 1000000).toFixed(2)}M` : myPlayer.chips.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Table area */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 gap-2">
        {others.slice(0, 3).length > 0 && (
          <div className="flex justify-around items-end gap-4" style={{ width: '52%', minWidth: 260, maxWidth: 480 }}>
            {others.slice(0, 3).map((player: any) => (
              <PlayerSeat key={player.id} player={player} isMe={false} phase={gameState.phase} actionDeadline={player.isCurrentActor ? gameState.actionDeadline : null} />
            ))}
          </div>
        )}

        <div className="flex items-center w-full max-w-4xl gap-8">
          <div className="flex-1 flex justify-end">
            {others[3] && <PlayerSeat player={others[3]} isMe={false} phase={gameState.phase} actionDeadline={others[3].isCurrentActor ? gameState.actionDeadline : null} />}
          </div>
          <div className="poker-table flex-shrink-0 relative rounded-[50%]" style={{ width: '52%', maxWidth: 480, aspectRatio: '2/1', minHeight: '160px' }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map(i => <Card key={i} card={gameState.communityCards[i] || null} hidden={!gameState.communityCards[i]} large />)}
              </div>
              {gameState.pot > 0 && (
                <div className="px-4 py-1 rounded-full text-sm font-bold" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24', boxShadow: '0 0 20px rgba(251,191,36,0.2)' }}>
                  팟 {gameState.pot.toLocaleString()}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex justify-start">
            {others[4] && <PlayerSeat player={others[4]} isMe={false} phase={gameState.phase} actionDeadline={others[4].isCurrentActor ? gameState.actionDeadline : null} />}
          </div>
        </div>

        <div>
          <PlayerSeat player={myPlayer} isMe phase={gameState.phase} handStrength={gameState.myHandStrength} />
        </div>
      </div>

      {/* Showdown */}
      {gameState.phase === 'showdown' && gameState.winners.length > 0 && (
        <div className="mx-4 mb-2 rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(30,20,5,0.95), rgba(20,15,3,0.95))', border: '1px solid rgba(251,191,36,0.4)', boxShadow: '0 0 30px rgba(251,191,36,0.2)' }}>
          <div className="text-yellow-400 font-bold text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {gameState.winners.length === 1 ? '🏆 Winner' : '🏆 Split Pot'}
          </div>
          {gameState.winners.map((w: any) => (
            <div key={w.playerId} className="text-white mb-1">
              <span className="font-bold">{w.playerName}</span>
              {w.hand && <span className="mx-2 text-sm px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>{w.hand.name}</span>}
              <span className="text-green-400 font-bold">+{w.pot.toLocaleString()}</span>
            </div>
          ))}
          {isHost && (
            <button className="mt-4 px-8 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #166534, #14532d)', border: '1px solid rgba(74,222,128,0.3)', color: '#86efac', boxShadow: '0 4px 16px rgba(22,101,52,0.4)' }}
              onClick={() => socket.emit('next-round')}>다음 라운드</button>
          )}
        </div>
      )}

      {/* Waiting room */}
      {gameState.phase === 'waiting' && (
        <div className="mx-4 mb-2 rounded-2xl p-5" style={{ background: 'rgba(10,10,18,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-gray-500 text-xs text-center mb-3 tracking-widest uppercase">
            참가자 {gameState.players.length}명{gameState.players.length < 2 && ' · 최소 2명 필요'}
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {gameState.players.map((p: any) => (
              <span key={p.id} className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                style={{ background: p.id === playerId ? 'rgba(74,222,128,0.1)' : p.isBot ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${p.id === playerId ? 'rgba(74,222,128,0.3)' : p.isBot ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.1)'}`, color: p.id === playerId ? '#4ade80' : p.isBot ? '#a78bfa' : '#9ca3af' }}>
                {p.isBot && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.05em' }}>BOT</span>}
                {p.id === playerId ? `${p.name} (나)` : p.name}
              </span>
            ))}
          </div>
          {canAddBot && (
            <div className="flex justify-center mb-4">
              <button onClick={() => socket.emit('add-bot')} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}>+ 봇 추가</button>
            </div>
          )}
          {canStart ? (
            <div className="text-center">
              <div className="flex gap-4 justify-center mb-4">
                {([
                  { label: '스몰 블라인드', val: smallBlind, setter: (v: number) => { setSmallBlind(v); setBigBlind(v * 2); } },
                  { label: '빅 블라인드', val: bigBlind, setter: (v: number) => setBigBlind(v) },
                ] as { label: string; val: number; setter: (v: number) => void }[]).map(({ label, val, setter }) => (
                  <div key={label} className="text-center">
                    <label className="text-xs text-gray-500 block mb-1 tracking-wide">{label}</label>
                    <input type="number" className="w-28 px-3 py-2 rounded-xl text-center text-sm font-bold focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}
                      value={val} onChange={e => setter(Math.max(1, Number(e.target.value)))} />
                  </div>
                ))}
              </div>
              <button className="px-10 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
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

      {myPlayer && !['waiting', 'showdown'].includes(gameState.phase) && (
        <BettingControls gameState={gameState} playerId={playerId} />
      )}
    </div>
  );
}
