"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search, X } from "lucide-react";
import { createPortal } from "react-dom";

interface RateItem {
  code: string;
  name: string;
  flag: string;
  krw: number;
}

interface ExchangeData {
  date: string;
  primary: RateItem[];
  secondary: RateItem[];
}

function RateRow({ rate }: { rate: RateItem }) {
  return (
    <a
      href={`https://finance.naver.com/marketindex/exchangeDetail.naver?marketindexCd=FX_${rate.code}KRW`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between px-1 py-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.04] rounded-lg transition-colors group cursor-pointer"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base flex-shrink-0">{rate.flag}</span>
        <span className="text-xs sm:text-sm text-white/60 group-hover:text-white/80 transition-colors truncate">{rate.name}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
        <span className="text-xs sm:text-sm font-semibold tabular-nums text-white/80">
          {rate.krw.toLocaleString()}
        </span>
        <span className="text-[10px] text-white/25">원</span>
      </div>
    </a>
  );
}

const SUPPORTED: { code: string; name: string; flag: string }[] = [
  { code: "USD", name: "달러",       flag: "🇺🇸" },
  { code: "JPY", name: "엔",         flag: "🇯🇵" },
  { code: "EUR", name: "유로",       flag: "🇪🇺" },
  { code: "CNY", name: "위안",       flag: "🇨🇳" },
  { code: "GBP", name: "파운드",     flag: "🇬🇧" },
  { code: "AUD", name: "호주달러",   flag: "🇦🇺" },
  { code: "CAD", name: "캐나다달러", flag: "🇨🇦" },
  { code: "CHF", name: "스위스프랑", flag: "🇨🇭" },
  { code: "HKD", name: "홍콩달러",   flag: "🇭🇰" },
  { code: "SGD", name: "싱가폴달러", flag: "🇸🇬" },
  { code: "THB", name: "바트",       flag: "🇹🇭" },
  { code: "MXN", name: "페소",       flag: "🇲🇽" },
  { code: "BRL", name: "헤알",       flag: "🇧🇷" },
  { code: "INR", name: "루피",       flag: "🇮🇳" },
  { code: "SEK", name: "스웨덴 크로나", flag: "🇸🇪" },
  { code: "NOK", name: "노르웨이 크로나", flag: "🇳🇴" },
  { code: "DKK", name: "덴마크 크로나", flag: "🇩🇰" },
  { code: "NZD", name: "뉴질랜드달러", flag: "🇳🇿" },
  { code: "ZAR", name: "랜드",       flag: "🇿🇦" },
  { code: "TRY", name: "리라",       flag: "🇹🇷" },
];

function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState("1");
  const [result, setResult] = useState<RateItem | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = SUPPORTED.filter(
    (c) =>
      c.code.includes(query.toUpperCase()) ||
      c.name.includes(query)
  );

  const search = useCallback(async (code: string) => {
    setSearching(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/exchange?q=${code}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.rates[0]);
    } catch {
      setError("환율 정보를 불러올 수 없습니다");
    } finally {
      setSearching(false);
    }
  }, []);

  const onKey = useCallback((e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }, [onClose]);
  useEffect(() => {
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onKey]);

  const amtNum = parseFloat(amount) || 1;
  const converted = result ? Math.round(result.krw * amtNum) : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(14,14,22,0.98), rgba(8,8,16,0.99))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ height: 2, background: "linear-gradient(to right, transparent, #fbbf24, #f59e0b, #fbbf24, transparent)" }} />

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white/70">환율 검색</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 통화 검색 */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="통화 코드 또는 이름 (예: USD, 달러)"
              autoFocus
              className="w-full bg-white/[0.05] text-[#f0ead6] text-sm rounded-xl pl-8 pr-3 py-2.5 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-white/20 border border-white/[0.06]"
            />
          </div>

          {/* 통화 목록 */}
          <div className="max-h-40 overflow-y-auto rounded-xl border border-white/[0.06] mb-4">
            {(query ? filtered : SUPPORTED).map((c) => (
              <button
                key={c.code}
                onClick={() => search(c.code)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-0"
              >
                <span className="text-base flex-shrink-0">{c.flag}</span>
                <span className="text-white/60">{c.name}</span>
                <span className="text-white/25 text-xs ml-auto">{c.code}</span>
              </button>
            ))}
            {query && filtered.length === 0 && (
              <p className="text-white/25 text-xs text-center py-4">검색 결과 없음</p>
            )}
          </div>

          {/* 변환 결과 */}
          {searching && (
            <div className="animate-pulse h-14 bg-white/[0.04] rounded-xl" />
          )}
          {result && !searching && (
            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{result.flag}</span>
                <span className="text-white/60 text-sm">{result.name} ({result.code})</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  className="w-24 bg-white/[0.06] text-[#f0ead6] text-sm rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-400/40 border border-white/[0.06] tabular-nums"
                />
                <span className="text-white/30 text-sm">{result.code} =</span>
                <span className="text-amber-200 font-semibold text-base tabular-nums">
                  {converted?.toLocaleString()}원
                </span>
              </div>
              <p className="text-white/20 text-[10px] mt-2">1 {result.code} = {result.krw.toLocaleString()}원 기준</p>
            </div>
          )}
          {error && !searching && (
            <p className="text-red-400/60 text-xs text-center py-2">{error}</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ExchangeWidget() {
  const [data, setData] = useState<ExchangeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"primary" | "secondary">("primary");
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exchange");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRates(); }, []);

  const rates = data ? (tab === "primary" ? data.primary : data.secondary) : [];

  return (
    <>
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/[0.07]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {(["primary", "secondary"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
                style={
                  tab === key
                    ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }
                    : { color: "#6b7280", border: "1px solid transparent" }
                }
              >
                {key === "primary" ? "주요" : "기타"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="text-white/25 hover:text-amber-400/80 transition-colors"
              title="환율 검색"
            >
              <Search className="w-4 h-4" />
            </button>
            <button onClick={fetchRates} className="text-white/25 hover:text-amber-400/80 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex justify-between py-2">
                <div className="h-4 bg-white/[0.05] rounded w-20" />
                <div className="h-4 bg-white/[0.05] rounded w-24" />
              </div>
            ))}
          </div>
        ) : !data ? (
          <div className="text-white/20 text-sm text-center py-4">환율 정보를 불러올 수 없습니다</div>
        ) : (
          <div>{rates.map((r) => <RateRow key={r.code} rate={r} />)}</div>
        )}

        <p className="text-white/15 text-[10px] mt-3 text-right tracking-wide">
          Frankfurter · {data?.date ?? "—"}
        </p>
      </div>

      {showModal && mounted && <SearchModal onClose={() => setShowModal(false)} />}
    </>
  );
}
