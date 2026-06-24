"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, TrendingUp, TrendingDown, Plus, X, Search, Loader2 } from "lucide-react";

interface StockItem {
  symbol: string;
  name: string;
  group: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  isCustom?: boolean;
}

interface CustomStockConfig {
  symbol: string;
  name: string;
  group: "domestic" | "foreign";
}

const CUSTOM_STOCKS_KEY = "customStocksV1";

function loadCustomStocks(): CustomStockConfig[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_STOCKS_KEY) || "[]");
  } catch { return []; }
}

function saveCustomStocks(stocks: CustomStockConfig[]) {
  localStorage.setItem(CUSTOM_STOCKS_KEY, JSON.stringify(stocks));
}

const DEFAULT_SYMBOLS = ["^KS11", "^KQ11", "^GSPC", "^IXIC", "^DJI", "^N225"];

const STOCK_URLS: Record<string, string> = {
  "^KS11": "https://finance.naver.com/sise/",
  "^KQ11": "https://finance.naver.com/sise/sise_index.naver?code=KOSDAQ",
  "^GSPC": "https://finance.yahoo.com/quote/%5EGSPC",
  "^IXIC": "https://finance.yahoo.com/quote/%5EIXIC",
  "^DJI":  "https://finance.yahoo.com/quote/%5EDJI",
  "^N225": "https://finance.yahoo.com/quote/%5EN225",
};

function getStockUrl(symbol: string): string {
  if (STOCK_URLS[symbol]) return STOCK_URLS[symbol];
  if (symbol.endsWith(".KS") || symbol.endsWith(".KQ")) {
    const code = symbol.replace(/\.(KS|KQ)$/, "");
    return `https://finance.naver.com/item/main.naver?code=${code}`;
  }
  return `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
}

function fmt(price: number, symbol: string) {
  if (symbol.endsWith(".KS") || symbol.endsWith(".KQ") || ["^KS11", "^KQ11"].includes(symbol)) {
    return price >= 1000 ? price.toLocaleString("ko-KR", { maximumFractionDigits: 0 }) : price.toFixed(2);
  }
  return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function detectGroup(symbol: string): "domestic" | "foreign" {
  return symbol.endsWith(".KS") || symbol.endsWith(".KQ") ? "domestic" : "foreign";
}

function StockRow({ item, onDelete }: { item: StockItem; onDelete?: () => void }) {
  const url = getStockUrl(item.symbol);

  if (item.price === null) {
    return (
      <div className="group flex items-center justify-between py-2 px-1 border-b border-(--rim) last:border-0">
        <span className="text-xs sm:text-sm text-(--t3)">{item.name}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-(--t5)">—</span>
          {onDelete && (
            <button onClick={onDelete}
              className="text-(--t5) hover:text-red-400 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="삭제">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const up = (item.change ?? 0) >= 0;
  const color = up ? "#4ade80" : "#f87171";
  const Icon = up ? TrendingUp : TrendingDown;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="group flex items-center justify-between py-2 px-1 border-b border-(--rim) last:border-0 hover:bg-(--surface) active:bg-(--surface-2) rounded-lg transition-colors cursor-pointer">
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
        <span className="text-xs sm:text-sm font-medium text-(--t1) truncate">{item.name}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className="text-xs sm:text-sm font-semibold text-(--t1) tabular-nums">
          {fmt(item.price, item.symbol)}
        </span>
        <span className="text-[10px] sm:text-xs tabular-nums font-medium px-1.5 py-0.5 rounded"
          style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
          {up ? "+" : ""}{item.changePct?.toFixed(2)}%
        </span>
        {onDelete && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            className="text-(--t5) hover:text-red-400 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="삭제">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </a>
  );
}

interface SearchResult { symbol: string; name: string; exchange: string; }

function AddStockModal({ onAdd, onClose, existingSymbols }: {
  onAdd: (stock: CustomStockConfig) => void;
  onClose: () => void;
  existingSymbols: string[];
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [name, setName] = useState("");
  const [group, setGroup] = useState<"domestic" | "foreign">("foreign");
  const [quote, setQuote] = useState<{ price: number; changePct: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    setError("");
    setResults([]);
    setSelected(null);
    setQuote(null);

    try {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const list: SearchResult[] = data.results ?? [];
      setResults(list);
      if (!list.length) setError("검색 결과가 없습니다.");
    } catch {
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const handleSelect = async (r: SearchResult) => {
    setSelected(r);
    setName(r.name);
    setGroup(detectGroup(r.symbol));
    setQuote(null);
    try {
      const res = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(r.symbol)}`);
      if (res.ok) {
        const data = await res.json();
        setQuote({ price: data.price, changePct: data.changePct });
      }
    } catch { /* quote preview is optional */ }
  };

  const handleAdd = () => {
    if (!selected || !name.trim()) return;
    if (existingSymbols.includes(selected.symbol)) { setError("이미 추가된 종목입니다."); return; }
    onAdd({ symbol: selected.symbol, name: name.trim(), group });
    onClose();
  };

  const up = quote ? quote.changePct >= 0 : true;
  const qColor = up ? "#4ade80" : "#f87171";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-(--rim-2) max-h-[88vh] flex flex-col"
        style={{ background: "rgba(15,15,20,0.97)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ height: 2, background: "linear-gradient(to right, transparent, rgba(251,191,36,0.7), rgba(245,158,11,0.5), transparent)" }} />

        <div className="p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-(--t1)">종목 추가</h3>
            <button onClick={onClose} className="text-(--t4) hover:text-(--t2) transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 검색 입력 */}
          <div className="mb-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setError(""); if (selected) { setSelected(null); setQuote(null); } }}
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                placeholder="종목명 또는 심볼 (예: 삼성전자, samsung, AAPL)"
                className="flex-1 bg-(--surface-2) border border-(--rim-2) rounded-lg px-3 py-2 text-sm text-(--t1) placeholder:text-(--t5) outline-none focus:border-amber-400/40"
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={!query.trim() || searching}
                className="px-3 py-2 rounded-lg transition-all disabled:opacity-40 flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)", minWidth: 40 }}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-(--t4) mt-1.5">
              한글·영문·심볼 모두 검색 가능 (예: 삼성전자, samsung, AAPL)
            </p>
          </div>

          {/* 에러 */}
          {error && (
            <p className="text-xs text-red-400/80 mb-3 whitespace-pre-line">{error}</p>
          )}

          {/* 검색 결과 목록 */}
          {results.length > 0 && !selected && (
            <div className="mb-3 rounded-xl overflow-hidden border border-(--rim-2)">
              {results.map((r, i) => (
                <button key={r.symbol}
                  onClick={() => handleSelect(r)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-(--surface-2) active:bg-(--surface-3) transition-colors ${i > 0 ? "border-t border-(--rim)" : ""}`}>
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-semibold text-amber-300/90">{r.symbol}</span>
                    <p className="text-[11px] text-(--t3) mt-0.5 truncate">{r.name}</p>
                  </div>
                  <span className="text-[10px] text-(--t4) flex-shrink-0 ml-3">{r.exchange}</span>
                </button>
              ))}
            </div>
          )}

          {/* 선택된 종목 */}
          {selected && (
            <>
              <div className="mb-3 px-3 py-2.5 rounded-xl flex items-center justify-between"
                style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <div>
                  <span className="text-xs font-mono font-semibold text-amber-300/90">{selected.symbol}</span>
                  <p className="text-[11px] text-(--t3) mt-0.5">{selected.exchange}</p>
                </div>
                <div className="flex items-center gap-2">
                  {quote && (
                    <>
                      <span className="text-sm font-semibold text-(--t1) tabular-nums">{fmt(quote.price, selected.symbol)}</span>
                      <span className="text-xs tabular-nums px-1.5 py-0.5 rounded"
                        style={{ color: qColor, background: `${qColor}18`, border: `1px solid ${qColor}30` }}>
                        {up ? "+" : ""}{quote.changePct.toFixed(2)}%
                      </span>
                    </>
                  )}
                  <button onClick={() => { setSelected(null); setQuote(null); setResults([]); setSearched(false); }}
                    className="text-(--t4) hover:text-(--t2) transition-colors ml-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="text-xs text-(--t3) mb-1 block">표시 이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
                  placeholder="종목명"
                  className="w-full bg-(--surface-2) border border-(--rim-2) rounded-lg px-3 py-2 text-sm text-(--t1) placeholder:text-(--t5) outline-none focus:border-amber-400/40"
                />
              </div>

              <div className="mb-4">
                <label className="text-xs text-(--t3) mb-1 block">구분</label>
                <div className="flex gap-1 p-0.5 rounded-lg w-fit" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {(["domestic", "foreign"] as const).map(key => (
                    <button key={key}
                      onClick={() => setGroup(key)}
                      className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                      style={group === key
                        ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }
                        : { color: "#6b7280", border: "1px solid transparent" }}>
                      {key === "domestic" ? "국내" : "해외"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)" }}>
                추가
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function StocksWidget() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"domestic" | "foreign">("domestic");
  const [customStocks, setCustomStocks] = useState<CustomStockConfig[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const doFetch = async (customs: CustomStockConfig[]) => {
    setLoading(true);
    try {
      const defaultRes = await fetch("/api/stocks");
      const defaults: StockItem[] = await defaultRes.json();

      let customItems: StockItem[] = [];
      if (customs.length > 0) {
        const results = await Promise.allSettled(
          customs.map(c =>
            fetch(`/api/stocks/quote?symbol=${encodeURIComponent(c.symbol)}`).then(r => r.ok ? r.json() : null)
          )
        );
        customItems = customs.map((c, i) => {
          const r = results[i];
          const data = r.status === "fulfilled" ? r.value : null;
          return { ...c, price: data?.price ?? null, change: data?.change ?? null, changePct: data?.changePct ?? null, isCustom: true as const };
        });
      }

      setStocks([...defaults, ...customItems]);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = loadCustomStocks();
    setCustomStocks(saved);
    doFetch(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddStock = (stock: CustomStockConfig) => {
    const updated = [...customStocks, stock];
    setCustomStocks(updated);
    saveCustomStocks(updated);
    doFetch(updated);
  };

  const handleDeleteStock = (symbol: string) => {
    const updated = customStocks.filter(s => s.symbol !== symbol);
    setCustomStocks(updated);
    saveCustomStocks(updated);
    setStocks(prev => prev.filter(s => s.symbol !== symbol));
  };

  const filtered = stocks.filter(s => s.group === tab);
  const existingSymbols = [...DEFAULT_SYMBOLS, ...customStocks.map(s => s.symbol)];

  return (
    <div className="relative overflow-hidden bg-(--surface) backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-(--rim-2) shadow-[0_4px_30px_rgba(0,0,0,0.25)] hover:border-emerald-400/20 hover:shadow-[0_0_40px_rgba(52,211,153,0.10)] transition-all">
      <div style={{ height: 2, background: "linear-gradient(to right, transparent, rgba(52,211,153,0.7), rgba(16,185,129,0.5), transparent)" }} className="absolute top-0 inset-x-0 pointer-events-none" />

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
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowAddModal(true)}
            className="text-(--t4) hover:text-amber-400/80 transition-colors"
            aria-label="종목 추가">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => doFetch(customStocks)}
            className="text-(--t4) hover:text-amber-400/80 transition-colors"
            aria-label="새로고침">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: Math.max(2, filtered.length || 2) }).map((_, i) => (
            <div key={i} className="animate-pulse flex justify-between py-2">
              <div className="h-4 bg-(--surface) rounded w-20" />
              <div className="h-4 bg-(--surface) rounded w-24" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-(--t5) text-sm text-center py-4">데이터를 불러올 수 없습니다</div>
      ) : (
        <div>
          {filtered.map(item => (
            <StockRow
              key={item.symbol}
              item={item}
              onDelete={item.isCustom ? () => handleDeleteStock(item.symbol) : undefined}
            />
          ))}
        </div>
      )}

      <p className="text-(--t5) text-[10px] mt-3 text-right tracking-wide">Yahoo Finance · 5분 캐시</p>

      {showAddModal && (
        <AddStockModal
          onAdd={handleAddStock}
          onClose={() => setShowAddModal(false)}
          existingSymbols={existingSymbols}
        />
      )}
    </div>
  );
}
