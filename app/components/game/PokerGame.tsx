"use client";

import { useState, useEffect } from 'react';
import { socket } from './socket';
import Lobby from './Lobby';
import GameTable from './GameTable';

export default function PokerGame() {
  const [gameState, setGameState] = useState<any>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socket.on('connect', () => setPlayerId(socket.id ?? null));
    socket.on('room-created', ({ roomId }: { roomId: string }) => { setRoomId(roomId); setError(null); });
    socket.on('room-joined', ({ roomId }: { roomId: string }) => { setRoomId(roomId); setError(null); });
    socket.on('game-state', (state: any) => { setGameState(state); setPlayerId(socket.id ?? null); });
    socket.on('error', (msg: string) => setError(msg));
    if (socket.connected) setPlayerId(socket.id ?? null);

    return () => {
      socket.off('connect');
      socket.off('room-created');
      socket.off('room-joined');
      socket.off('game-state');
      socket.off('error');
    };
  }, []);

  if (!roomId || !gameState) {
    return <Lobby error={error} onClearError={() => setError(null)} />;
  }

  return <GameTable gameState={gameState} playerId={playerId!} roomId={roomId} />;
}
