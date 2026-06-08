"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  emoji: string;
}

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: "1", title: "Gmail", url: "https://mail.google.com", emoji: "📧" },
  { id: "2", title: "GitHub", url: "https://github.com", emoji: "🐙" },
  { id: "3", title: "YouTube", url: "https://youtube.com", emoji: "▶️" },
  { id: "4", title: "Notion", url: "https://notion.so", emoji: "📝" },
  { id: "5", title: "네이버", url: "https://naver.com", emoji: "🟢" },
  { id: "6", title: "카카오", url: "https://kakao.com", emoji: "💛" },
  { id: "7", title: "네이버웹툰", url: "https://comic.naver.com", emoji: "🎨" },
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
    <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest">즐겨찾기</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-slate-500 hover:text-blue-400 transition-colors"
          title="추가"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-slate-700/50 rounded-xl space-y-2">
          <input
            type="text"
            placeholder="사이트 이름"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-slate-600/50 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="URL (예: google.com)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full bg-slate-600/50 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-1 flex-wrap">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setForm({ ...form, emoji: e })}
                className={`text-lg p-1 rounded ${form.emoji === e ? "bg-blue-500/30 ring-1 ring-blue-500" : "hover:bg-slate-600"}`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={addBookmark}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg py-1.5 transition-colors"
            >
              추가
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg py-1.5 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {bookmarks.map((bm) => {
          const favicon = getFavicon(bm.url);
          return (
            <div key={bm.id} className="group relative">
              <a
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-700/60 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {favicon ? (
                    <img
                      src={favicon}
                      alt={bm.title}
                      className="w-6 h-6 rounded"
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
                <span className="text-xs text-slate-300 truncate w-full text-center">{bm.title}</span>
              </a>
              <button
                onClick={() => removeBookmark(bm.id)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
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
