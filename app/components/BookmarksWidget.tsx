"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  emoji: string;
}

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: "1", title: "네이버", url: "https://naver.com", emoji: "🟢" },
  { id: "2", title: "구글", url: "https://google.com", emoji: "🔍" },
  { id: "3", title: "유튜브", url: "https://youtube.com", emoji: "▶️" },
  { id: "4", title: "카카오", url: "https://kakao.com", emoji: "💛" },
  { id: "5", title: "네이버웹툰", url: "https://comic.naver.com", emoji: "🎨" },
];

const EMOJIS = ["🌐", "📧", "🐙", "▶️", "📝", "🟢", "💛", "🔵", "🔴", "⭐", "🏠", "🎵", "📚", "💼", "🛒"];

function getFavicon(url: string) {
  try {
    const domain = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

export default function BookmarksWidget() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    if (typeof window === "undefined") return DEFAULT_BOOKMARKS;
    try {
      const saved = localStorage.getItem("bookmarks");
      return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
    } catch {
      return DEFAULT_BOOKMARKS;
    }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", emoji: "🌐" });

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = () => {
    if (!form.title || !form.url) return;
    const url = form.url.startsWith("http") ? form.url : `https://${form.url}`;
    setBookmarks((prev) => [
      ...prev,
      { id: Date.now().toString(), title: form.title, url, emoji: form.emoji },
    ]);
    setForm({ title: "", url: "", emoji: "🌐" });
    setShowForm(false);
  };

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/[0.07]">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-white/30 text-xs font-semibold uppercase tracking-widest">즐겨찾기</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-white/25 hover:text-amber-400/80 transition-colors"
          title="추가"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-white/[0.04] rounded-xl space-y-2 border border-white/[0.06]">
          <input
            type="text"
            placeholder="사이트 이름"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-white/[0.05] text-[#f0ead6] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-white/20"
          />
          <input
            type="text"
            placeholder="URL (예: google.com)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full bg-white/[0.05] text-[#f0ead6] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-white/20"
          />
          <div className="flex gap-1 flex-wrap">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setForm({ ...form, emoji: e })}
                className={`text-lg p-1 rounded transition-colors ${
                  form.emoji === e
                    ? "bg-amber-400/20 ring-1 ring-amber-400/50"
                    : "hover:bg-white/[0.08]"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={addBookmark}
              className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-sm rounded-lg py-1.5 transition-colors border border-amber-400/20"
            >
              추가
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] text-white/50 text-sm rounded-lg py-1.5 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
        {bookmarks.map((bm) => {
          const favicon = getFavicon(bm.url);
          return (
            <div key={bm.id} className="group relative">
              <a
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors cursor-pointer min-h-[64px] justify-center"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                  {favicon ? (
                    <img
                      src={favicon}
                      alt={bm.title}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded opacity-80"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).nextSibling!.textContent = bm.emoji;
                      }}
                    />
                  ) : (
                    <span className="text-xl">{bm.emoji}</span>
                  )}
                  <span className="hidden text-xl">{bm.emoji}</span>
                </div>
                <span className="text-xs text-white/40 group-hover:text-white/70 truncate w-full text-center transition-colors">{bm.title}</span>
              </a>
              <button
                onClick={() => removeBookmark(bm.id)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400/70 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
