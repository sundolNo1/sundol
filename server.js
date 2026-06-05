const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const GameRoom = require('./lib/game/GameRoom');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const rooms = new Map();

function genRoomId() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const io = new Server(server);

  function broadcastState(room) {
    for (const player of room.players) {
      const sock = io.sockets.sockets.get(player.id);
      if (sock) sock.emit('game-state', room.getState(player.id));
    }
  }

  io.on('connection', (socket) => {
    let currentRoomId = null;

    socket.on('create-room', ({ name }) => {
      const roomId = genRoomId();
      const room = new GameRoom(roomId, () => broadcastState(room));
      rooms.set(roomId, room);
      const res = room.addPlayer(socket.id, name);
      if (res.error) { socket.emit('error', res.error); return; }
      currentRoomId = roomId;
      socket.join(roomId);
      socket.emit('room-created', { roomId });
      broadcastState(room);
    });

    socket.on('join-room', ({ roomId, name }) => {
      const room = rooms.get(roomId.trim());
      if (!room) { socket.emit('error', '방을 찾을 수 없습니다'); return; }
      const res = room.addPlayer(socket.id, name);
      if (res.error) { socket.emit('error', res.error); return; }
      currentRoomId = roomId.trim();
      socket.join(currentRoomId);
      socket.emit('room-joined', { roomId: currentRoomId });
      broadcastState(room);
    });

    socket.on('start-game', ({ smallBlind, bigBlind } = {}) => {
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const res = room.startGame(smallBlind, bigBlind);
      if (res.error) { socket.emit('error', res.error); return; }
      broadcastState(room);
    });

    socket.on('player-action', ({ action, amount }) => {
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const res = room.playerAction(socket.id, action, amount || 0);
      if (res.error) { socket.emit('error', res.error); return; }
      broadcastState(room);
    });

    socket.on('add-bot', () => {
      const room = rooms.get(currentRoomId);
      if (!room) return;
      if (room._hostId() !== socket.id) { socket.emit('error', '방장만 봇을 추가할 수 있습니다'); return; }
      const res = room.addBot();
      if (res.error) { socket.emit('error', res.error); return; }
      broadcastState(room);
    });

    socket.on('next-round', () => {
      const room = rooms.get(currentRoomId);
      if (!room || room.phase !== 'showdown') return;
      room.nextRound();
      broadcastState(room);
    });

    socket.on('disconnect', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      room.removePlayer(socket.id);
      if (room.players.length === 0) {
        rooms.delete(currentRoomId);
      } else {
        broadcastState(room);
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> sundol 포털 실행 중: http://localhost:${PORT}`);
  });
});
