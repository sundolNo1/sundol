import Link from "next/link";

export const metadata = { title: "게임 목록 — sundol" };

interface Game {
  id: string;
  title: string;
  description: string;
  emoji: string;
  href: string;
  players: string;
  tags: string[];
  available: boolean;
}

const GAMES: Game[] = [
  {
    id: "poker",
    title: "Texas Hold'em",
    description: "멀티플레이어 텍사스 홀덤 포커. 봇과 함께 연습하거나 친구와 대결하세요.",
    emoji: "♠",
    href: "/game",
    players: "1~6인",
    tags: ["멀티플레이", "카드", "봇 지원"],
    available: true,
  },
  {
    id: "coming1",
    title: "곧 추가 예정",
    description: "새로운 게임이 준비 중입니다.",
    emoji: "🎮",
    href: "#",
    players: "-",
    tags: [],
    available: false,
  },
];

export default function GamesPage() {
  const available = GAMES.filter((g) => g.available);
  const coming = GAMES.filter((g) => !g.available);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8 pt-4">
          <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
            ← sundol
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">게임 목록</h1>
            <p className="text-slate-500 text-sm">총 {available.length}개 플레이 가능</p>
          </div>
        </div>

        {/* 플레이 가능한 게임 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {available.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/50 hover:border-yellow-500/40 transition-all group hover:bg-slate-800/80"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl">{game.emoji}</div>
                <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-full">
                  {game.players}
                </span>
              </div>
              <h2 className="text-white font-bold text-xl mb-1 group-hover:text-yellow-400 transition-colors">
                {game.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{game.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {game.tags.map((tag) => (
                    <span key={tag} className="text-xs text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-slate-600 group-hover:text-yellow-500 transition-colors text-lg ml-2">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* 준비 중 */}
        {coming.length > 0 && (
          <>
            <h2 className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">준비 중</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coming.map((game) => (
                <div
                  key={game.id}
                  className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/30 opacity-50"
                >
                  <div className="text-5xl mb-4 grayscale">{game.emoji}</div>
                  <h2 className="text-slate-400 font-bold text-xl mb-1">{game.title}</h2>
                  <p className="text-slate-500 text-sm">{game.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
