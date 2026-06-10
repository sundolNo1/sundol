import Link from "next/link";
import Image from "next/image";
import ClockWidget from "./components/ClockWidget";
import WeatherWidget from "./components/WeatherWidget";
import BookmarksWidget from "./components/BookmarksWidget";
import NewsWidget from "./components/NewsWidget";
import SearchBar from "./components/SearchBar";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#06090f] px-3 py-3 sm:p-4 md:p-8 relative overflow-x-hidden">
      {/* 배경 장식 오브 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-amber-500/[0.06] rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-indigo-600/[0.07] rounded-full blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-500/[0.04] rounded-full blur-[110px]" />
      </div>

      <div className="relative max-w-6xl mx-auto space-y-3 sm:space-y-6">
        {/* 헤더 */}
        <div className="text-center pt-4 sm:pt-8 pb-1 sm:pb-2">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Image
              src="/character.png"
              alt="sundol character"
              width={40}
              height={40}
              className="object-contain drop-shadow-lg sm:w-14 sm:h-14"
            />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.2em] bg-gradient-to-r from-amber-300 via-amber-100 to-white bg-clip-text text-transparent">
              SUNDOL
            </h1>
          </div>
          <p className="text-white/25 text-xs tracking-widest uppercase">좋은 하루 보내세요</p>
        </div>

        <SearchBar />

        {/* 미니게임 */}
        <Link
          href="/games"
          className="bg-white/[0.03] backdrop-blur-xl rounded-2xl px-4 py-3.5 sm:p-5 border border-white/[0.07] hover:border-amber-400/25 hover:bg-white/[0.05] transition-all group flex items-center gap-3 sm:gap-5"
        >
          <div className="text-2xl sm:text-3xl opacity-80 flex-shrink-0">🎮</div>
          <div className="min-w-0">
            <h2 className="text-[#f0ead6] font-semibold tracking-wide group-hover:text-amber-200 transition-colors text-sm sm:text-base">미니게임</h2>
            <p className="text-white/30 text-xs mt-0.5 tracking-wide truncate">Texas Hold'em 외 1개 · 계속 업데이트 중</p>
          </div>
          <div className="ml-auto text-white/20 group-hover:text-amber-400/60 transition-colors text-lg flex-shrink-0">→</div>
        </Link>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <ClockWidget />
          <WeatherWidget />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <BookmarksWidget />
          <NewsWidget />
        </div>
      </div>
    </main>
  );
}
