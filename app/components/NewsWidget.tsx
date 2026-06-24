"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, ExternalLink, Settings2, X, Plus, Rss } from "lucide-react";
import { createPortal } from "react-dom";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  image?: string;
}

interface CustomFeed {
  id: string;
  name: string;
  url: string;
  category: string;
}

const DEFAULT_FEEDS = [
  { name: "YTN",         category: "종합" },
  { name: "한겨레",       category: "종합" },
  { name: "BBC Korea",   category: "국제" },
  { name: "연합뉴스 스포츠", category: "스포츠" },
  { name: "매일경제 스포츠", category: "스포츠" },
];

const CATEGORIES = ["종합", "국제", "스포츠", "IT", "경제", "문화"];

const CUSTOM_KEY = "news_custom_feeds_v1";
const DISABLED_KEY = "news_disabled_feeds_v1";

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  } catch { return ""; }
}

const CATEGORY_ICONS: Record<string, string> = {
  종합: "📰", 국제: "🌐", 스포츠: "⚽", IT: "💻", 경제: "💹", 문화: "🎭",
};

function FeedSettingsModal({
  customFeeds, disabled, onClose,
  onToggleDefault, onDeleteCustom, onAddCustom,
}: {
  customFeeds: CustomFeed[];
  disabled: string[];
  onClose: () => void;
  onToggleDefault: (name: string) => void;
  onDeleteCustom: (id: string) => void;
  onAddCustom: (feed: CustomFeed) => void;
}) {
  const [form, setForm] = useState({ name: "", url: "", category: "종합" });
  const [adding, setAdding] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const onKey = useCallback((e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }, [onClose]);
  useEffect(() => {
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onKey]);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setAdding(true);
    setTestError(null);
    const url = form.url.startsWith("http") ? form.url : `https://${form.url}`;
    try {
      const res = await fetch(`/api/news/fetch?url=${encodeURIComponent(url)}&name=${encodeURIComponent(form.name)}&category=${encodeURIComponent(form.category)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onAddCustom({ id: Date.now().toString(), name: form.name.trim(), url, category: form.category });
      setForm({ name: "", url: "", category: "종합" });
    } catch {
      setTestError("피드를 불러올 수 없습니다. URL을 확인해 주세요.");
    } finally {
      setAdding(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,rgba(14,14,22,0.98),rgba(8,8,16,0.99))", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>
        <div style={{ height: 2, background: "linear-gradient(to right,transparent,#fbbf24,#f59e0b,#fbbf24,transparent)" }} />
        <div className="p-5 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-(--t1)">뉴스 피드 관리</span>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-(--t4) hover:text-(--t1) hover:bg-(--surface-2) transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 기본 피드 */}
          <p className="text-[10px] text-(--t4) uppercase tracking-widest mb-2">기본 피드</p>
          <div className="space-y-1 mb-4">
            {DEFAULT_FEEDS.map((f) => {
              const on = !disabled.includes(f.name);
              return (
                <button key={f.name} onClick={() => onToggleDefault(f.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-left ${
                    on ? "bg-amber-400/10 border-amber-400/30" : "bg-(--surface) border-(--rim)"
                  }`}>
                  <Rss className={`w-3.5 h-3.5 flex-shrink-0 ${on ? "text-amber-400/70" : "text-(--t5)"}`} />
                  <span className={`text-xs flex-1 ${on ? "text-amber-200" : "text-(--t4) line-through"}`}>{f.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${on ? "bg-amber-400/15 text-amber-300/70" : "bg-(--surface) text-(--t5)"}`}>{f.category}</span>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${on ? "bg-amber-400/70" : "bg-(--surface-3)"}`} />
                </button>
              );
            })}
          </div>

          {/* 커스텀 피드 */}
          {customFeeds.length > 0 && (
            <>
              <p className="text-[10px] text-(--t4) uppercase tracking-widest mb-2">내 피드</p>
              <div className="space-y-1 mb-4">
                {customFeeds.map((f) => (
                  <div key={f.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-(--surface) border border-(--rim) group">
                    <Rss className="w-3.5 h-3.5 text-indigo-400/60 flex-shrink-0" />
                    <span className="text-xs text-(--t2) flex-1 truncate">{f.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-(--surface) text-(--t4)">{f.category}</span>
                    <button onClick={() => onDeleteCustom(f.id)}
                      className="text-(--t5) hover:text-red-400/70 active:text-red-400/70 transition-colors sm:opacity-0 sm:group-hover:opacity-100">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 피드 추가 */}
          <p className="text-[10px] text-(--t4) uppercase tracking-widest mb-2">피드 추가</p>
          <div className="space-y-2">
            <input type="text" placeholder="피드 이름" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-(--surface) text-(--foreground) text-sm rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-(--t5) border border-(--rim)" />
            <input type="text" placeholder="RSS URL" value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full bg-(--surface) text-(--foreground) text-sm rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-(--t5) border border-(--rim)" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-(--surface) text-(--t2) text-sm rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400/40 border border-(--rim)">
              {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#0e0e16]">{c}</option>)}
            </select>
            {testError && <p className="text-red-400/60 text-xs">{testError}</p>}
            <button onClick={handleAdd} disabled={adding || !form.name || !form.url}
              className="w-full flex items-center justify-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 text-amber-200 text-sm rounded-xl py-2 transition-colors border border-amber-400/20">
              {adding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {adding ? "확인 중..." : "추가"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function NewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [customFeeds, setCustomFeeds] = useState<CustomFeed[]>([]);
  const [disabled, setDisabled] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCustomFeeds(load<CustomFeed[]>(CUSTOM_KEY, []));
    setDisabled(load<string[]>(DISABLED_KEY, []));
  }, []);

  useEffect(() => { if (mounted) localStorage.setItem(CUSTOM_KEY, JSON.stringify(customFeeds)); }, [customFeeds, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem(DISABLED_KEY, JSON.stringify(disabled)); }, [disabled, mounted]);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const disabledNow = load<string[]>(DISABLED_KEY, []);
      const customNow = load<CustomFeed[]>(CUSTOM_KEY, []);

      const [defaultRes, ...customRes] = await Promise.allSettled([
        fetch("/api/news").then((r) => r.json() as Promise<NewsItem[]>),
        ...customNow.map((f) =>
          fetch(`/api/news/fetch?url=${encodeURIComponent(f.url)}&name=${encodeURIComponent(f.name)}&category=${encodeURIComponent(f.category)}`)
            .then((r) => r.json() as Promise<NewsItem[]>)
        ),
      ]);

      const defaultItems: NewsItem[] = defaultRes.status === "fulfilled" ? defaultRes.value : [];
      const customItems: NewsItem[] = customRes
        .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
        .flatMap((r) => r.value);

      const all = [...defaultItems.filter((n) => !disabledNow.includes(n.source)), ...customItems]
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      setNews(all);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (mounted) fetchNews(); }, [mounted, fetchNews]);

  const categories = ["전체", ...Array.from(new Set(news.map((n) => n.category)))];
  const filtered = activeCategory === "전체" ? news : news.filter((n) => n.category === activeCategory);

  return (
    <>
      <div className="relative overflow-hidden bg-(--surface) backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-(--rim-2) shadow-[0_4px_30px_rgba(0,0,0,0.25)] hover:border-orange-400/20 hover:shadow-[0_0_40px_rgba(249,115,22,0.10)] transition-all">
        <div style={{ height: 2, background: "linear-gradient(to right, transparent, rgba(249,115,22,0.7), rgba(234,88,12,0.5), transparent)" }} className="absolute top-0 inset-x-0 pointer-events-none" />
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-(--t4) text-xs font-semibold uppercase tracking-widest">뉴스</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 text-(--t3) hover:text-amber-400/80 transition-colors text-[10px] tracking-wide"
              title="피드 관리">
              <Settings2 className="w-3.5 h-3.5" />
              <span>피드</span>
            </button>
            <button onClick={fetchNews} className="text-(--t4) hover:text-amber-400/80 transition-colors" title="새로고침">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 mb-3 flex-wrap">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                activeCategory === cat
                  ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                  : "bg-(--surface) text-(--t4) hover:text-(--t2) border border-transparent"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-2.5">
                <div className="w-14 h-10 bg-(--surface) rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-(--surface) rounded w-full" />
                  <div className="h-3 bg-(--surface) rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-(--t5) text-sm text-center py-6">뉴스를 불러올 수 없습니다</div>
        ) : (
          <div className="space-y-0.5 max-h-64 sm:max-h-80 overflow-y-auto pr-1">
            {filtered.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-(--surface) active:bg-(--surface-3) transition-colors group min-h-[52px]">
                <div className="flex-shrink-0 w-14 h-10 sm:w-16 sm:h-11 rounded-lg overflow-hidden bg-(--surface) flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt="" loading="lazy" decoding="async"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = "none";
                        (el.nextSibling as HTMLElement).style.display = "flex";
                      }} />
                  ) : null}
                  <span className={`${item.image ? "hidden" : "flex"} items-center justify-center w-full h-full text-lg`}>
                    {CATEGORY_ICONS[item.category] ?? "📰"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-(--t2) group-hover:text-(--t1) line-clamp-2 leading-snug transition-colors">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-amber-400/50">{item.source}</span>
                    {item.pubDate && <span className="text-[10px] text-(--t5)">{timeAgo(item.pubDate)}</span>}
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-(--t5) group-hover:text-(--t3) flex-shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        )}
      </div>

      {showSettings && mounted && (
        <FeedSettingsModal
          customFeeds={customFeeds}
          disabled={disabled}
          onClose={() => { setShowSettings(false); fetchNews(); }}
          onToggleDefault={(name) => setDisabled((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name])}
          onDeleteCustom={(id) => setCustomFeeds((prev) => prev.filter((f) => f.id !== id))}
          onAddCustom={(feed) => setCustomFeeds((prev) => [...prev, feed])}
        />
      )}
    </>
  );
}
