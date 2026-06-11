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
    id: "miner",
    title: "마이너",
    description: "2D 테라리아 스타일 채굴 게임. 블록을 캐고, 땅을 파고, 희귀 광석을 찾아보세요.",
    emoji: "⛏️",
    href: "/miner",
    players: "1인",
    tags: ["싱글플레이", "건설", "탐험"],
    available: true,
  },
  {
    id: "slot",
    title: "체리마스터",
    description: "복고풍 3릴 슬롯머신. 체리·레몬·포도·777을 맞추고 대박을 노려보세요.",
    emoji: "🍒",
    href: "/slot",
    players: "1인",
    tags: ["슬롯", "복고", "캐주얼"],
    available: true,
  },
];

export default function GamesPage() {
  const available = GAMES.filter((g) => g.available);
  const coming = GAMES.filter((g) => !g.available);

  return (
    <main className="min-h-screen bg-[#06090f] p-4 md:p-8 relative overflow-x-hidden">
      {/* 배경 오브 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-amber-500/[0.05] rounded-full blur-[130px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-600/[0.06] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="fade-up flex items-center gap-4 mb-10 pt-4" style={{ animationDelay: "0ms" }}>
          <Link href="/" className="text-white/25 hover:text-amber-300/70 transition-colors text-sm tracking-wide">
            ← sundol
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <div>
            <h1 className="text-xl font-semibold text-[#f0ead6] tracking-wide">게임 목록</h1>
            <p className="text-white/25 text-xs mt-0.5">{available.length}개 플레이 가능</p>
          </div>
        </div>

        {/* 플레이 가능한 게임 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {available.map((game, i) => (
            <Link
              key={game.id}
              href={game.href}
              className="fade-up bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.07] hover:border-amber-400/25 hover:bg-white/[0.05] hover:shadow-[0_0_32px_rgba(251,191,36,0.07)] hover:-translate-y-0.5 transition-all duration-300 group"
              style={{ animationDelay: `${80 + i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl opacity-80">{game.emoji}</div>
                <span className="text-xs text-white/25 bg-white/[0.05] px-2 py-1 rounded-full border border-white/[0.06]">
                  {game.players}
                </span>
              </div>
              <h2 className="text-[#f0ead6] font-semibold text-xl mb-1 group-hover:text-amber-200 transition-colors tracking-wide">
                {game.title}
              </h2>
              <p className="text-white/35 text-sm leading-relaxed mb-4">{game.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {game.tags.map((tag) => (
                    <span key={tag} className="text-xs text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.06]">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-white/20 group-hover:text-amber-400/60 transition-colors text-lg ml-2">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* 준비 중 */}
        {coming.length > 0 && (
          <>
            <h2 className="fade-up text-white/20 text-xs font-semibold uppercase tracking-widest mb-3" style={{ animationDelay: "240ms" }}>준비 중</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coming.map((game, i) => (
                <div
                  key={game.id}
                  className="fade-up bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04] opacity-40"
                  style={{ animationDelay: `${320 + i * 80}ms` }}
                >
                  <div className="text-5xl mb-4 grayscale">{game.emoji}</div>
                  <h2 className="text-white/50 font-semibold text-xl mb-1">{game.title}</h2>
                  <p className="text-white/30 text-sm">{game.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
