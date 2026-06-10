"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface RateItem {
  code: string;
  name: string;
  flag: string;
  krw: number;
}

interface ExchangeData {
  date: string;
  rates: RateItem[];
}

export default function ExchangeWidget() {
  const [data, setData] = useState<ExchangeData | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/[0.07]">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-white/30 text-xs font-semibold uppercase tracking-widest">환율</h2>
        <button onClick={fetchRates} className="text-white/25 hover:text-amber-400/80 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex justify-between py-2">
              <div className="h-4 bg-white/[0.05] rounded w-20" />
              <div className="h-4 bg-white/[0.05] rounded w-24" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <div className="text-white/20 text-sm text-center py-4">환율 정보를 불러올 수 없습니다</div>
      ) : (
        <>
          <div className="space-y-0.5">
            {data.rates.map(rate => (
              <a key={rate.code}
                href={`https://finance.naver.com/marketindex/exchangeDetail.naver?marketindexCd=FX_${rate.code}KRW`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors group">
                <div className="flex items-center gap-2">
                  <span className="text-base">{rate.flag}</span>
                  <span className="text-xs sm:text-sm text-white/60 group-hover:text-white/80 transition-colors">{rate.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-semibold tabular-nums text-white/80">
                    {rate.krw.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-white/25">원</span>
                </div>
              </a>
            ))}
          </div>
          <p className="text-white/15 text-[10px] mt-3 text-right tracking-wide">ECB 기준 · {data.date}</p>
        </>
      )}
    </div>
  );
}
