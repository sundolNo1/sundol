"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Search } from "lucide-react";

const WORLD_CITIES = [
  { name: "서울",      tz: "Asia/Seoul",          flag: "🇰🇷" },
  { name: "도쿄",      tz: "Asia/Tokyo",          flag: "🇯🇵" },
  { name: "베이징",    tz: "Asia/Shanghai",        flag: "🇨🇳" },
  { name: "싱가포르",  tz: "Asia/Singapore",       flag: "🇸🇬" },
  { name: "두바이",    tz: "Asia/Dubai",           flag: "🇦🇪" },
  { name: "파리",      tz: "Europe/Paris",         flag: "🇫🇷" },
  { name: "런던",      tz: "Europe/London",        flag: "🇬🇧" },
  { name: "뉴욕",      tz: "America/New_York",     flag: "🇺🇸" },
  { name: "LA",        tz: "America/Los_Angeles",  flag: "🇺🇸" },
  { name: "시드니",    tz: "Australia/Sydney",     flag: "🇦🇺" },
  { name: "상파울루",  tz: "America/Sao_Paulo",    flag: "🇧🇷" },
  { name: "모스크바",  tz: "Europe/Moscow",        flag: "🇷🇺" },
];

function getCityTime(tz: string, now: Date, hour12: boolean) {
  const raw = now.toLocaleTimeString("ko-KR", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12 });
  return raw;
}
function getCityDate(tz: string, now: Date) {
  return now.toLocaleDateString("ko-KR", { timeZone: tz, month: "short", day: "numeric", weekday: "short" });
}

function MiniCalendar({ today }: { today: Date }) {
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors">‹</button>
        <span className="text-sm font-semibold text-white/70">
          {viewYear}년 {viewMonth + 1}월
        </span>
        <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div key={d} className="text-[10px] font-semibold py-1" style={{ color: i === 0 ? "#f87171" : i === 6 ? "#60a5fa" : "#6b7280" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {cells.map((d, i) => (
          <div key={i} className={`text-xs py-1.5 rounded-lg transition-colors ${
            d === null ? "" :
            isToday(d) ? "bg-amber-400/20 text-amber-300 font-bold ring-1 ring-amber-400/40" :
            i % 7 === 0 ? "text-red-400/70 hover:bg-white/[0.05]" :
            i % 7 === 6 ? "text-blue-400/70 hover:bg-white/[0.05]" :
            "text-white/50 hover:bg-white/[0.05]"
          }`}>
            {d ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function WorldClock({ now, hour12 }: { now: Date; hour12: boolean }) {
  const [query, setQuery] = useState("");
  const filtered = WORLD_CITIES.filter(c => c.name.includes(query));

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="도시 검색..."
          className="w-full pl-8 pr-3 py-2 rounded-xl text-sm text-white/70 placeholder-white/20 focus:outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        />
      </div>
      <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
        {filtered.map(city => (
          <div key={city.tz} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-base">{city.flag}</span>
              <span className="text-xs text-white/60">{city.name}</span>
              <span className="text-[10px] text-white/25">{getCityDate(city.tz, now)}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums" style={{ color: "#fcd34d" }}>
              {getCityTime(city.tz, now, hour12)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const HOUR12_KEY = "clock_hour12";

export default function ClockWidget() {
  const [time, setTime] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"calendar" | "world">("calendar");
  const [hour12, setHour12] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHour12(localStorage.getItem(HOUR12_KEY) === "true");
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onKey = useCallback((e: KeyboardEvent) => { if (e.key === "Escape") setShowModal(false); }, []);
  useEffect(() => {
    if (showModal) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showModal, onKey]);

  const toggleHour12 = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHour12(prev => {
      const next = !prev;
      localStorage.setItem(HOUR12_KEY, String(next));
      return next;
    });
  };

  const pad = (n: number) => String(n).padStart(2, "0");
  const rawHours = time.getHours();
  const displayHours = hour12 ? (rawHours % 12 || 12) : rawHours;
  const ampm = hour12 ? (rawHours < 12 ? "AM" : "PM") : null;
  const hours = pad(displayHours);
  const minutes = pad(time.getMinutes());
  const seconds = pad(time.getSeconds());
  const dateStr = time.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="w-full relative overflow-hidden bg-white/[0.05] backdrop-blur-2xl rounded-2xl p-4 sm:p-6 md:p-8 text-center border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.25)] hover:border-amber-400/30 hover:bg-white/[0.07] hover:shadow-[0_0_40px_rgba(251,191,36,0.12)] transition-all cursor-pointer select-none"
      >
        <div style={{ height: 2, background: "linear-gradient(to right, transparent, rgba(251,191,36,0.7), rgba(245,158,11,0.5), transparent)" }} className="absolute top-0 inset-x-0 pointer-events-none" />

        <div className="flex items-baseline justify-center">
          <span className="text-3xl sm:text-5xl md:text-7xl font-thin tracking-[0.12em] text-[#f0ead6]">{hours}</span>
          <span className="text-2xl sm:text-4xl md:text-5xl font-thin text-amber-400/50 animate-pulse mx-1 sm:mx-1.5 mb-1">:</span>
          <span className="text-3xl sm:text-5xl md:text-7xl font-thin tracking-[0.12em] text-[#f0ead6]">{minutes}</span>
          <span className="text-base sm:text-xl md:text-2xl font-thin text-white/20 ml-1.5 sm:ml-2 mb-1">:{seconds}</span>
          {ampm && (
            <span className="text-xs sm:text-sm font-medium text-white/35 ml-2 self-end mb-1.5">{ampm}</span>
          )}
        </div>
        <div className="mt-2 sm:mt-4 text-white/30 text-[10px] sm:text-xs tracking-widest uppercase">{dateStr}</div>

        {/* 12h / 24h 토글 */}
        {mounted && (
          <button
            onClick={toggleHour12}
            className="absolute bottom-3 right-3 text-[10px] tabular-nums font-semibold px-1.5 py-0.5 rounded-md transition-all hover:scale-105"
            style={hour12
              ? { color: "#fbbf24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }
              : { color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {hour12 ? "12h" : "24h"}
          </button>
        )}
      </div>

      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(14,14,22,0.98), rgba(8,8,16,0.99))", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>
            <div style={{ height: 2, background: "linear-gradient(to right, transparent, #ffd700, #b8860b, #ffd700, transparent)" }} />

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {(["calendar", "world"] as const).map(key => (
                    <button key={key} onClick={() => setTab(key)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                      style={tab === key
                        ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }
                        : { color: "#6b7280", border: "1px solid transparent" }}>
                      {key === "calendar" ? "📅 달력" : "🌍 세계시간"}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowModal(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {tab === "calendar" ? <MiniCalendar today={time} /> : <WorldClock now={time} hour12={hour12} />}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
