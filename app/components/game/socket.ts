import { io } from 'socket.io-client';

// Vercel 배포 시 NEXT_PUBLIC_WS_URL=https://sundol.onrender.com 로 설정
const socket = io(process.env.NEXT_PUBLIC_WS_URL || '');
export { socket };
