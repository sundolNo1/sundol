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
  {
    id: "tetris",
    title: "테트리스",
    description: "고전 테트리스. 7가지 블록을 쌓아 줄을 없애고 최고 점수를 노려보세요.",
    emoji: "🟦",
    href: "/tetris",
    players: "1인",
    tags: ["싱글플레이", "퍼즐", "고전"],
    available: true,
  },
  {
    id: "galaga",
    title: "갤러그",
    description: "1981년 남코 슈팅 게임. 편대를 격파하고 보스 트랙터 빔을 피하세요.",
    emoji: "👾",
    href: "/galaga",
    players: "1인",
    tags: ["슈팅", "고전", "아케이드"],
    available: true,
  },
];

export default function GamesPage() {
  const available = GAMES.filter((g) => g.available);
  const coming = GAMES.filter((g) => !g.available);

  return (
    <main className="min-h-screen bg-(--background) p-4 md:p-8 relative overflow-x-hidden">
      {/* 배경 오브 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-amber-500/[0.05] rounded-full blur-[130px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-600/[0.06] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="fade-up flex items-center gap-4 mb-10 pt-4" style={{ animationDelay: "0ms" }}>
          <Link href="/" className="text-(--t4) hover:text-amber-300/70 transition-colors text-sm tracking-wide">
            ← sundol
          </Link>
          <div className="w-px h-4 bg-(--surface-3)" />
          <div>
            <h1 className="text-xl font-semibold text-(--foreground) tracking-wide">게임 목록</h1>
            <p className="text-(--t4) text-xs mt-0.5">{available.length}개 플레이 가능</p>
          </div>
        </div>

        {/* 플레이 가능한 게임 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {available.map((game, i) => (
            <Link
              key={game.id}
              href={game.href}
              className="fade-up bg-(--surface) backdrop-blur-xl rounded-2xl p-6 border border-(--rim-2) hover:border-amber-400/25 hover:bg-(--surface) hover:shadow-[0_0_32px_rgba(251,191,36,0.07)] hover:-translate-y-0.5 transition-all duration-300 group"
              style={{ animationDelay: `${80 + i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl opacity-80">{game.emoji}</div>
                <span className="text-xs text-(--t4) bg-(--surface) px-2 py-1 rounded-full border border-(--rim)">
                  {game.players}
                </span>
              </div>
              <h2 className="text-(--foreground) font-semibold text-xl mb-1 group-hover:text-amber-200 transition-colors tracking-wide">
                {game.title}
              </h2>
              <p className="text-(--t3) text-sm leading-relaxed mb-4">{game.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {game.tags.map((tag) => (
                    <span key={tag} className="text-xs text-(--t4) bg-(--surface) px-2 py-0.5 rounded-full border border-(--rim)">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-(--t5) group-hover:text-amber-400/60 transition-colors text-lg ml-2">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* 준비 중 */}
        {coming.length > 0 && (
          <>
            <h2 className="fade-up text-(--t5) text-xs font-semibold uppercase tracking-widest mb-3" style={{ animationDelay: "240ms" }}>준비 중</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coming.map((game, i) => (
                <div
                  key={game.id}
                  className="fade-up bg-(--surface) rounded-2xl p-6 border border-(--rim) opacity-40"
                  style={{ animationDelay: `${320 + i * 80}ms` }}
                >
                  <div className="text-5xl mb-4 grayscale">{game.emoji}</div>
                  <h2 className="text-(--t2) font-semibold text-xl mb-1">{game.title}</h2>
                  <p className="text-(--t4) text-sm">{game.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
