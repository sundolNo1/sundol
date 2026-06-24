"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 11) return "좋은 아침이에요";
  if (hour >= 11 && hour < 14) return "좋은 점심이에요";
  if (hour >= 14 && hour < 18) return "즐거운 오후에요";
  if (hour >= 18 && hour < 22) return "좋은 저녁이에요";
  return "좋은 밤이에요";
}

export default function HeaderGreeting() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const greeting = now ? getGreeting(now.getHours()) : "";
  const dateStr = now
    ? `${now.getMonth() + 1}월 ${now.getDate()}일 · ${DAYS[now.getDay()]}요일`
    : "";

  return (
    <div className="text-center pt-6 sm:pt-10 pb-1 fade-up" style={{ animationDelay: "0ms" }}>
      <a href="/" className="inline-flex flex-col items-center gap-2 sm:gap-3 group">
        {/* 캐릭터 + glow */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-2xl scale-[2.5] group-hover:bg-amber-400/45 transition-all duration-700" />
          <div className="absolute inset-0 rounded-full bg-amber-300/15 blur-3xl scale-[3.5] animate-pulse" />
          <Image
            src="/character.png"
            alt="sundol"
            width={64}
            height={64}
            priority
            className="relative z-10 object-contain floating w-12 h-12 sm:w-[68px] sm:h-[68px]
              drop-shadow-[0_0_18px_rgba(251,191,36,0.55)]
              group-hover:drop-shadow-[0_0_28px_rgba(251,191,36,0.85)]
              transition-[filter] duration-500"
          />
        </div>

        {/* SUNDOL 타이틀 */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-[0.3em] shimmer-text select-none">
          SUNDOL
        </h1>
      </a>

      {/* 날짜 + 인사말 */}
      <div className="mt-2 sm:mt-3 space-y-1">
        {dateStr && (
          <p className="text-white/35 text-[11px] sm:text-xs tracking-[0.2em]">{dateStr}</p>
        )}
        {greeting && (
          <p className="text-white/20 text-[10px] sm:text-[11px] tracking-[0.25em] uppercase">
            {greeting}
          </p>
        )}
      </div>
    </div>
  );
}
