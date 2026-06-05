"use client";

import { useState } from 'react';
import { socket } from './socket';
import Link from 'next/link';

export default function Lobby({ error, onClearError }: { error: string | null; onClearError: () => void }) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');

  const handleCreate = () => { if (name.trim()) socket.emit('create-room', { name: name.trim() }); };
  const handleJoin = () => { if (name.trim() && joinCode.trim()) socket.emit('join-room', { name: name.trim(), roomId: joinCode.trim() }); };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(120,40,200,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(200,160,0,0.08) 0%, transparent 40%), linear-gradient(135deg, #050508 0%, #0a0a14 50%, #060609 100%)' }}>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {(['♠', '♥', '♦', '♣'] as string[]).map((s, i) => (
          <div key={i} className="absolute text-white select-none"
            style={{ fontSize: `${80 + i * 20}px`, opacity: 0.02 + i * 0.01, top: `${10 + i * 20}%`, left: `${i % 2 === 0 ? 5 + i * 5 : 70 - i * 5}%`, transform: `rotate(${-15 + i * 10}deg)`, color: i % 2 === 0 ? '#fff' : '#dc2626' }}>
            {s}
          </div>
        ))}
      </div>

      {/* 포털로 돌아가기 */}
      <Link href="/games" className="absolute top-4 left-4 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
        ← 게임 목록
      </Link>

      <div className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.95), rgba(12,12,20,0.98))', border: '1px solid rgba(255,215,0,0.15)', boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ height: 2, background: 'linear-gradient(to right, transparent, #ffd700, #b8860b, #ffd700, transparent)' }} />

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center gap-3 mb-3">
              {(['♠', '♥', '♦', '♣'] as string[]).map((s, i) => (
                <span key={i} className="text-3xl" style={{ color: i % 2 === 0 ? '#e5e7eb' : '#dc2626', textShadow: '0 0 20px currentColor' }}>{s}</span>
              ))}
            </div>
            <h1 className="text-3xl font-bold tracking-wide" style={{ fontFamily: "'Playfair Display', serif", background: 'linear-gradient(135deg, #fcd34d, #f59e0b, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Texas Hold'em
            </h1>
            <p className="text-gray-500 text-sm mt-1 tracking-widest uppercase">Premium Poker</p>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 mb-4 flex justify-between items-center text-sm"
              style={{ background: 'rgba(127,29,29,0.5)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              <span>{error}</span>
              <button onClick={onClearError} className="ml-2 opacity-70 hover:opacity-100">✕</button>
            </div>
          )}

          <div className="mb-5">
            <label className="text-xs font-semibold tracking-widest uppercase text-gray-500 block mb-2">닉네임</label>
            <input className="w-full px-4 py-3 rounded-xl text-white text-sm font-medium focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', caretColor: '#fbbf24' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(251,191,36,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.1)'; }}
              onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              placeholder="이름을 입력하세요" value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())} maxLength={12} />
          </div>

          <div className="flex mb-5 rounded-xl p-1" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['create', 'join'] as const).map((key) => (
              <button key={key} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={tab === key ? { background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(217,119,6,0.15))', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', boxShadow: '0 0 12px rgba(251,191,36,0.15)' } : { color: '#6b7280', border: '1px solid transparent' }}
                onClick={() => setTab(key)}>
                {key === 'create' ? '방 만들기' : '방 입장'}
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <button className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-150 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #166534, #14532d)', border: '1px solid rgba(74,222,128,0.3)', color: '#86efac', boxShadow: '0 4px 20px rgba(22,101,52,0.4)' }}
              onClick={handleCreate}>방 만들기</button>
          ) : (
            <div>
              <input className="w-full px-4 py-3 rounded-xl text-white text-center text-lg font-bold tracking-[0.3em] focus:outline-none mb-3 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', caretColor: '#fbbf24' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(251,191,36,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.1)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                placeholder="000000" value={joinCode}
                onChange={e => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleJoin()} inputMode="numeric" maxLength={6} />
              <button className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-150 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)', border: '1px solid rgba(96,165,250,0.3)', color: '#bfdbfe', boxShadow: '0 4px 20px rgba(29,78,216,0.4)' }}
                onClick={handleJoin}>입장하기</button>
            </div>
          )}
          <p className="text-center text-gray-600 text-xs mt-5 tracking-wide">시작 칩 1,000,000 · 최대 6인</p>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(255,215,0,0.2), transparent)' }} />
      </div>
    </div>
  );
}
