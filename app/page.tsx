import Link from "next/link";
import SearchBar from "./components/SearchBar";
import WidgetsGrid from "./components/WidgetsGrid";
import TodoWidget from "./components/TodoWidget";
import HeaderGreeting from "./components/HeaderGreeting";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#06090f] px-3 py-3 sm:p-4 md:p-8 relative overflow-x-hidden">
      {/* 배경 오브 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 -right-60 w-[900px] h-[900px] bg-amber-500/[0.07] rounded-full blur-[160px]" />
        <div className="absolute -bottom-60 -left-60 w-[800px] h-[800px] bg-indigo-600/[0.08] rounded-full blur-[150px]" />
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-500/[0.05] rounded-full blur-[130px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-emerald-600/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* 헤더 */}
        <HeaderGreeting />

        {/* 검색바 */}
        <div className="fade-up" style={{ animationDelay: "80ms" }}>
          <SearchBar />
        </div>

        {/* 미니게임 */}
        <div className="fade-up" style={{ animationDelay: "160ms" }}>
          <Link
            href="/games"
            className="relative overflow-hidden bg-white/[0.03] backdrop-blur-xl rounded-2xl px-4 py-3.5 sm:p-5 border border-white/[0.07] hover:border-amber-400/25 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(251,191,36,0.09)] hover:-translate-y-0.5 transition-all duration-300 group flex items-center gap-3 sm:gap-5"
          >
            <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(251,191,36,0.35), transparent)" }} className="absolute top-0 inset-x-0" />
            <div className="text-2xl sm:text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              🎮
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[#f0ead6] font-semibold tracking-wide group-hover:text-amber-200 transition-colors text-sm sm:text-base">
                미니게임
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {["♠ Hold'em", "⛏ 마이너", "🍒 슬롯", "👾 갤러그", "🧱 테트리스"].map(g => (
                  <span key={g}
                    className="text-[10px] text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.06] group-hover:border-amber-400/15 group-hover:text-white/45 transition-all">
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-white/20 group-hover:text-amber-400/70 group-hover:translate-x-0.5 transition-all duration-300 text-base flex-shrink-0">→</div>
          </Link>
        </div>

        {/* 할 일 */}
        <div className="fade-up" style={{ animationDelay: "200ms" }}>
          <TodoWidget />
        </div>

        <WidgetsGrid />
      </div>
    </main>
  );
}
