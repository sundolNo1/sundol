"use client";

import { useEffect, useState } from "react";

export default function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const hours = pad(time.getHours());
  const minutes = pad(time.getMinutes());
  const seconds = pad(time.getSeconds());

  const dateStr = time.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 text-center border border-slate-700/50">
      <div className="text-5xl font-mono font-bold tracking-widest text-white">
        {hours}
        <span className="animate-pulse text-blue-400">:</span>
        {minutes}
        <span className="text-slate-400 text-3xl">:{seconds}</span>
      </div>
      <div className="mt-2 text-slate-400 text-sm">{dateStr}</div>
    </div>
  );
}
