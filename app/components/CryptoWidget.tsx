"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface CoinItem {
  id: string;
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
}

function fmtKRW(price: number) {
  if (price >= 1_0000_0000) return (price / 1_0000_0000).toFixed(2) + "억";
  if (price >= 1_0000) return Math.floor(price / 1_0000).toLocaleString("ko-KR") + "만";
  if (price >= 1_000) return price.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
  return price.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

const COIN_URLS: Record<string, string> = {
  bitcoin:  "https://www.coingecko.com/en/coins/bitcoin",
  ethereum: "https://www.coingecko.com/en/coins/ethereum",
  ripple:   "https://www.coingecko.com/en/coins/ripple",
  solana:   "https://www.coingecko.com/en/coins/solana",
};

const COIN_EMOJI: Record<string, string> = {
  bitcoin:  "₿",
  ethereum: "Ξ",
  ripple:   "✕",
  solana:   "◎",
};

function CoinRow({ item }: { item: CoinItem }) {
  const up = (item.changePct ?? 0) >= 0;
  const color = up ? "#4ade80" : "#f87171";
  const Icon = up ? TrendingUp : TrendingDown;

  return (
    <a
      href={COIN_URLS[item.id]}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between py-2 px-1 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.04] active:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm w-5 text-center text-white/30 flex-shrink-0 font-mono">
          {COIN_EMOJI[item.id]}
        </span>
        <span className="text-xs sm:text-sm font-medium text-white/70 truncate">{item.name}</span>
        <span className="text-[10px] text-white/25 flex-shrink-0">{item.symbol}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {item.price !== null ? (
          <>
            <span className="text-xs sm:text-sm font-semibold text-white/80 tabular-nums">
              ₩{fmtKRW(item.price)}
            </span>
            <span
              className="text-[10px] sm:text-xs tabular-nums font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5"
              style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
            >
              <Icon className="w-2.5 h-2.5" />
              {up ? "+" : ""}{item.changePct?.toFixed(2)}%
            </span>
          </>
        ) : (
          <span className="text-xs text-white/20">—</span>
        )}
      </div>
    </a>
  );
}

export default function CryptoWidget() {
  const [coins, setCoins] = useState<CoinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCoins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crypto");
      const data = await res.json();
      setCoins(data);
      setLastUpdated(new Date());
    } catch {
      setCoins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoins(); }, []);

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/[0.07]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white/30 text-xs font-semibold uppercase tracking-widest">암호화폐</h2>
        <button onClick={fetchCoins} className="text-white/25 hover:text-amber-400/80 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex justify-between py-2">
              <div className="h-4 bg-white/[0.05] rounded w-20" />
              <div className="h-4 bg-white/[0.05] rounded w-24" />
            </div>
          ))}
        </div>
      ) : coins.length === 0 ? (
        <div className="text-white/20 text-sm text-center py-4">데이터를 불러올 수 없습니다</div>
      ) : (
        <div>{coins.map((c) => <CoinRow key={c.id} item={c} />)}</div>
      )}

      <p className="text-white/15 text-[10px] mt-3 text-right tracking-wide">
        CoinGecko · {timeStr ? `${timeStr} 기준` : "5분 캐시"}
      </p>
    </div>
  );
}
