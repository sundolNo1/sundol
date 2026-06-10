"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface StockItem {
  symbol: string;
  name: string;
  group: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
}

const STOCK_URLS: Record<string, string> = {
  "^KS11": "https://finance.naver.com/sise/",
  "^KQ11": "https://finance.naver.com/sise/sise_index.naver?code=KOSDAQ",
  "^GSPC": "https://finance.yahoo.com/quote/%5EGSPC",
  "^IXIC": "https://finance.yahoo.com/quote/%5EIXIC",
  "^DJI":  "https://finance.yahoo.com/quote/%5EDJI",
  "^N225": "https://finance.yahoo.com/quote/%5EN225",
};

function fmt(price: number, symbol: string) {
  if (symbol.endsWith(".KS") || ["^KS11", "^KQ11"].includes(symbol)) {
    return price >= 1000 ? price.toLocaleString("ko-KR", { maximumFractionDigits: 0 }) : price.toFixed(2);
  }
  return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function StockRow({ item }: { item: StockItem }) {
  if (item.price === null) {
    return (
      <div className="flex items-center justify-between py-2 px-1 border-b border-white/[0.04] last:border-0">
        <span className="text-xs sm:text-sm text-white/40">{item.name}</span>
        <span className="text-xs text-white/20">—</span>
      </div>
    );
  }
  const up = (item.change ?? 0) >= 0;
  const color = up ? "#4ade80" : "#f87171";
  const Icon = up ? TrendingUp : TrendingDown;

  const url = STOCK_URLS[item.symbol];
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-between py-2 px-1 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.04] active:bg-white/[0.06] rounded-lg transition-colors cursor-pointer">
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
        <span className="text-xs sm:text-sm font-medium text-white/70 truncate">{item.name}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className="text-xs sm:text-sm font-semibold text-white/80 tabular-nums">
          {fmt(item.price, item.symbol)}
        </span>
        <span className="text-[10px] sm:text-xs tabular-nums font-medium px-1.5 py-0.5 rounded"
          style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
          {up ? "+" : ""}{item.changePct?.toFixed(2)}%
        </span>
      </div>
    </a>
  );
}

export default function StocksWidget() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"domestic" | "foreign">("domestic");

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stocks");
      const data = await res.json();
      setStocks(data);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStocks(); }, []);

  const filtered = stocks.filter(s => s.group === tab);

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/[0.07]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["domestic", "foreign"] as const).map(key => (
            <button key={key}
              onClick={() => setTab(key)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
              style={tab === key
                ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }
                : { color: "#6b7280", border: "1px solid transparent" }}>
              {key === "domestic" ? "국내" : "해외"}
            </button>
          ))}
        </div>
        <button onClick={fetchStocks} className="text-white/25 hover:text-amber-400/80 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse flex justify-between py-2">
              <div className="h-4 bg-white/[0.05] rounded w-20" />
              <div className="h-4 bg-white/[0.05] rounded w-24" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-white/20 text-sm text-center py-4">데이터를 불러올 수 없습니다</div>
      ) : (
        <div>
          {filtered.map(item => <StockRow key={item.symbol} item={item} />)}
        </div>
      )}

      <p className="text-white/15 text-[10px] mt-3 text-right tracking-wide">Yahoo Finance · 5분 캐시</p>
    </div>
  );
}
