let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

export function playChip() {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.frequency.setValueAtTime(900, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ac.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.08);
  } catch {}
}

export function playCard() {
  try {
    const ac = getCtx();
    const bufSize = Math.floor(ac.sampleRate * 0.06);
    const buffer = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
    }
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.4, ac.currentTime);
    source.connect(gain); gain.connect(ac.destination);
    source.start();
  } catch {}
}

export function playFold() {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain); gain.connect(ac.destination);
    osc.frequency.setValueAtTime(280, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ac.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.25);
  } catch {}
}

export function playRaise() {
  try {
    const ac = getCtx();
    [600, 800].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.value = freq;
      const t = ac.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t); osc.stop(t + 0.1);
    });
  } catch {}
}

export function playWin() {
  try {
    const ac = getCtx();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.value = freq;
      const t = ac.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.35);
    });
  } catch {}
}

export function playNewRound() {
  try {
    for (let i = 0; i < 4; i++) setTimeout(() => playCard(), i * 80);
  } catch {}
}
