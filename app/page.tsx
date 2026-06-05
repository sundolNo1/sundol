import Link from "next/link";
import ClockWidget from "./components/ClockWidget";
import WeatherWidget from "./components/WeatherWidget";
import BookmarksWidget from "./components/BookmarksWidget";
import NewsWidget from "./components/NewsWidget";
import SearchBar from "./components/SearchBar";

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ?? "YOUR_API_KEY";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center pt-4 pb-2">
          <h1 className="text-2xl font-bold text-slate-200 mb-1">sundol</h1>
          <p className="text-slate-500 text-sm">좋은 하루 보내세요 👋</p>
        </div>

        <SearchBar />

        {/* 미니게임 */}
        <Link href="/games"
          className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/50 hover:border-yellow-500/50 transition-colors group flex items-center gap-5">
          <div className="text-4xl">🎮</div>
          <div>
            <h2 className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors">미니게임</h2>
            <p className="text-slate-400 text-sm mt-0.5">Texas Hold'em 외 1개 · 계속 업데이트 중</p>
          </div>
          <div className="ml-auto text-slate-600 group-hover:text-yellow-500 transition-colors text-xl">→</div>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ClockWidget />
          <WeatherWidget apiKey={OPENWEATHER_API_KEY} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BookmarksWidget />
          <NewsWidget />
        </div>
      </div>
    </main>
  );
}
