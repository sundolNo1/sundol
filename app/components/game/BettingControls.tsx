"use client";

import { useState, useEffect } from 'react';
import { socket } from './socket';
import { playChip, playFold, playRaise } from './sounds';

const ACTION_TIMEOUT_SEC = 30;

export default function BettingControls({ gameState, playerId }: { gameState: any; playerId: string }) {
  const player = gameState.players.find((p: any) => p.id === playerId);
  const isMyTurn = gameState.currentActorId === playerId;
  const [raiseStr, setRaiseStr] = useState(String(gameState.minRaise));
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => { setRaiseStr(String(gameState.minRaise)); }, [gameState.minRaise, gameState.currentActorId]);

  useEffect(() => {
    if (!isMyTurn || !gameState.actionDeadline) { setTimeLeft(null); return; }
    const update = () => setTimeLeft(Math.max(0, Math.ceil((gameState.actionDeadline - Date.now()) / 1000)));
    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [isMyTurn, gameState.actionDeadline]);

  if (!isMyTurn || !['pre-flop', 'flop', 'turn', 'river'].includes(gameState.phase)) {
    return (
      <div className="h-16 flex items-center justify-center">
        {!['waiting', 'showdown'].includes(gameState.phase) && (
          <span className="text-gray-500 text-sm italic">다른 플레이어의 차례입니다...</span>
        )}
      </div>
    );
  }
  if (!player) return null;

  const callAmount = Math.min(gameState.currentBet - player.totalBet, player.chips);
  const canCheck = player.totalBet >= gameState.currentBet;
  const maxRaise = player.chips - (canCheck ? 0 : callAmount);
  const canRaise = maxRaise >= gameState.minRaise;
  const parsedRaise = Number(raiseStr) || gameState.minRaise;
  const clampedRaise = Math.max(gameState.minRaise, Math.min(maxRaise, parsedRaise));
  const sliderPct = canRaise && maxRaise > gameState.minRaise
    ? ((clampedRaise - gameState.minRaise) / (maxRaise - gameState.minRaise)) * 100 : 0;

  const act = (action: string, amount?: number) => socket.emit('player-action', { action, amount });
  const pot = gameState.pot || 1;
  const presets = canRaise ? [
    { label: '¼팟', value: Math.floor(pot / 4) },
    { label: '½팟', value: Math.floor(pot / 2) },
    { label: '팟', value: pot },
    { label: '올인', value: maxRaise },
  ].filter(p => p.value >= gameState.minRaise && p.value <= maxRaise) : [];

  return (
    <div className="border-t px-4 py-3" style={{ background: 'linear-gradient(to top, #050508, #0a0a12)', borderColor: 'rgba(255,255,255,0.07)' }}>
      {canRaise && (
        <div className="mb-3 max-w-lg mx-auto">
          {presets.length > 0 && (
            <div className="flex gap-2 mb-2 justify-center flex-wrap">
              {presets.map(p => (
                <button key={p.label} className="preset-btn px-3 py-1 rounded text-xs font-semibold" onClick={() => setRaiseStr(String(p.value))}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <input type="range" className="bet-slider flex-1" style={{ '--pct': `${sliderPct}%` } as any}
              min={gameState.minRaise} max={maxRaise} value={clampedRaise}
              onChange={e => setRaiseStr(e.target.value)} />
            <input type="text" inputMode="numeric"
              className="w-28 text-center text-sm font-bold rounded-lg px-2 py-1.5 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(251,191,36,0.3)', color: '#fcd34d' }}
              value={raiseStr} onChange={e => setRaiseStr(e.target.value.replace(/\D/g, ''))}
              onBlur={() => setRaiseStr(String(clampedRaise))} />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1 px-1">
            <span>최소 {gameState.minRaise?.toLocaleString()}</span>
            <span>올인 {maxRaise?.toLocaleString()}</span>
          </div>
        </div>
      )}

      {timeLeft !== null && (
        <div className="max-w-lg mx-auto mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">남은 시간</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: timeLeft <= 10 ? '#f87171' : '#fbbf24' }}>{timeLeft}초</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-[250ms]" style={{
              width: `${(timeLeft / ACTION_TIMEOUT_SEC) * 100}%`,
              background: timeLeft <= 10 ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #d97706, #fbbf24)',
            }} />
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-center max-w-lg mx-auto">
        <button className="flex-1 py-3 font-bold rounded-xl text-sm transition-all duration-150 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #991b1b, #7f1d1d)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', boxShadow: '0 4px 12px rgba(153,27,27,0.4)' }}
          onClick={() => { playFold(); act('fold'); }}>폴드</button>

        {canCheck ? (
          <button className="flex-1 py-3 font-bold rounded-xl text-sm transition-all duration-150 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)', border: '1px solid rgba(96,165,250,0.4)', color: '#bfdbfe', boxShadow: '0 4px 12px rgba(29,78,216,0.4)' }}
            onClick={() => { playChip(); act('check'); }}>체크</button>
        ) : (
          <button className="flex-1 py-3 font-bold rounded-xl text-sm transition-all duration-150 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)', border: '1px solid rgba(96,165,250,0.4)', color: '#bfdbfe', boxShadow: '0 4px 12px rgba(29,78,216,0.4)' }}
            onClick={() => { playChip(); act('call'); }}>콜 {callAmount.toLocaleString()}</button>
        )}

        {canRaise && (
          <button className="flex-1 py-3 font-bold rounded-xl text-sm transition-all duration-150 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #d97706, #92400e)', border: '1px solid rgba(251,191,36,0.5)', color: '#fef3c7', boxShadow: '0 4px 12px rgba(217,119,6,0.5)' }}
            onClick={() => { playRaise(); act('raise', clampedRaise); }}>레이즈 {clampedRaise.toLocaleString()}</button>
        )}
      </div>
    </div>
  );
}
