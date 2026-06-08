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
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 text-center border border-white/[0.07]">
      <div className="flex items-baseline justify-center">
        <span className="text-7xl font-thin tracking-[0.12em] text-[#f0ead6]">{hours}</span>
        <span className="text-5xl font-thin text-amber-400/50 animate-pulse mx-2 mb-1">:</span>
        <span className="text-7xl font-thin tracking-[0.12em] text-[#f0ead6]">{minutes}</span>
        <span className="text-2xl font-thin text-white/20 ml-3 mb-1">:{seconds}</span>
      </div>
      <div className="mt-4 text-white/30 text-xs tracking-widest uppercase">{dateStr}</div>
    </div>
  );
}
