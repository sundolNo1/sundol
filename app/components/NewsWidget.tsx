"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  } catch {
    return "";
  }
}

export default function NewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSource, setActiveSource] = useState("전체");

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      setNews(data);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const categories = ["전체", ...Array.from(new Set(news.map((n) => n.category)))];
  const filtered = activeSource === "전체" ? news : news.filter((n) => n.category === activeSource);

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/[0.07]">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-white/30 text-xs font-semibold uppercase tracking-widest">뉴스</h2>
        <button
          onClick={fetchNews}
          className="text-white/25 hover:text-amber-400/80 transition-colors"
          title="새로고침"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
        {categories.map((src) => (
          <button
            key={src}
            onClick={() => setActiveSource(src)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              activeSource === src
                ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                : "bg-white/[0.05] text-white/30 hover:text-white/60 border border-transparent"
            }`}
          >
            {src}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-white/[0.05] rounded w-3/4 mb-1" />
              <div className="h-3 bg-white/[0.03] rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-white/20 text-sm text-center py-6">뉴스를 불러올 수 없습니다</div>
      ) : (
        <div className="space-y-0.5 sm:space-y-1 max-h-64 sm:max-h-80 overflow-y-auto pr-1">
          {filtered.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 p-2 sm:p-2 rounded-lg hover:bg-white/[0.05] active:bg-white/[0.07] transition-colors group min-h-[44px]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-white/60 group-hover:text-white/90 line-clamp-2 leading-snug transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-amber-400/50">{item.source}</span>
                  {item.pubDate && (
                    <span className="text-xs text-white/20">{timeAgo(item.pubDate)}</span>
                  )}
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-white/15 group-hover:text-white/40 flex-shrink-0 mt-1 transition-colors" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
