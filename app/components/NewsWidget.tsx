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
    <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest">뉴스</h2>
        <button
          onClick={fetchNews}
          className="text-slate-500 hover:text-blue-400 transition-colors"
          title="새로고침"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {categories.map((src) => (
          <button
            key={src}
            onClick={() => setActiveSource(src)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              activeSource === src
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-400 hover:text-white"
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
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-1" />
              <div className="h-3 bg-slate-700/50 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-6">뉴스를 불러올 수 없습니다</div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
          {filtered.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-700/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 group-hover:text-white line-clamp-2 leading-snug">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-blue-400">{item.source}</span>
                  {item.pubDate && (
                    <span className="text-xs text-slate-500">{timeAgo(item.pubDate)}</span>
                  )}
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400 flex-shrink-0 mt-1" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
