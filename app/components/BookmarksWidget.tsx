"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, GripVertical, Pencil, Check, X, Settings2, ChevronUp, ChevronDown } from "lucide-react";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  emoji: string;
}

const BOOKMARKS_VERSION = "8";

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: "1", title: "네이버", url: "https://naver.com", emoji: "🟢" },
  { id: "2", title: "구글", url: "https://google.com", emoji: "🔍" },
  { id: "3", title: "유튜브", url: "https://youtube.com", emoji: "▶️" },
  { id: "4", title: "카카오", url: "https://kakao.com", emoji: "💛" },
  { id: "5", title: "네이버웹툰", url: "https://comic.naver.com", emoji: "🎨" },
  { id: "6", title: "넷플릭스", url: "https://netflix.com", emoji: "🎬" },
  { id: "8", title: "티비몬", url: "https://tvmon1.com/", emoji: "📡" },
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
      const savedVersion = localStorage.getItem("bookmarks_version");
      if (savedVersion !== BOOKMARKS_VERSION) {
        localStorage.setItem("bookmarks_version", BOOKMARKS_VERSION);
        localStorage.setItem("bookmarks", JSON.stringify(DEFAULT_BOOKMARKS));
        return DEFAULT_BOOKMARKS;
      }
      const saved = localStorage.getItem("bookmarks");
      return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
    } catch {
      return DEFAULT_BOOKMARKS;
    }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", emoji: "🌐" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", url: "", emoji: "🌐" });
  const [mounted, setMounted] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [modalEditingId, setModalEditingId] = useState<string | null>(null);
  const [modalEditForm, setModalEditForm] = useState({ title: "", url: "", emoji: "🌐" });

  // 데스크탑 드래그 상태
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

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

  const startEdit = (bm: Bookmark) => {
    setEditingId(bm.id);
    setEditForm({ title: bm.title, url: bm.url, emoji: bm.emoji });
  };

  const saveEdit = () => {
    if (!editForm.title || !editForm.url) return;
    const url = editForm.url.startsWith("http") ? editForm.url : `https://${editForm.url}`;
    setBookmarks((prev) => prev.map((b) => b.id === editingId ? { ...b, title: editForm.title, url, emoji: editForm.emoji } : b));
    setEditingId(null);
  };

  // 데스크탑 드래그 핸들러
  const handleDragStart = (index: number) => { setDragIndex(index); };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null); setDragOverIndex(null); return;
    }
    const next = [...bookmarks];
    const [item] = next.splice(dragIndex, 1);
    next.splice(index, 0, item);
    setBookmarks(next);
    setDragIndex(null); setDragOverIndex(null);
  };

  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  // 모바일 관리 모달 함수
  const moveItem = (index: number, dir: -1 | 1) => {
    const next = [...bookmarks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBookmarks(next);
  };

  const startModalEdit = (bm: Bookmark) => {
    setModalEditingId(bm.id);
    setModalEditForm({ title: bm.title, url: bm.url, emoji: bm.emoji });
  };

  const saveModalEdit = () => {
    if (!modalEditForm.title || !modalEditForm.url) return;
    const url = modalEditForm.url.startsWith("http") ? modalEditForm.url : `https://${modalEditForm.url}`;
    setBookmarks((prev) => prev.map((b) => b.id === modalEditingId ? { ...b, title: modalEditForm.title, url, emoji: modalEditForm.emoji } : b));
    setModalEditingId(null);
  };

  return (
    <>
    <div className="relative overflow-hidden bg-(--surface) backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-(--rim-2) shadow-[0_4px_30px_rgba(0,0,0,0.25)] hover:border-violet-400/20 hover:shadow-[0_0_40px_rgba(167,139,250,0.10)] transition-all">
      <div style={{ height: 2, background: "linear-gradient(to right, transparent, rgba(167,139,250,0.7), rgba(139,92,246,0.5), transparent)" }} className="absolute top-0 inset-x-0 pointer-events-none" />
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-(--t4) text-xs font-semibold uppercase tracking-widest">즐겨찾기</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManageModal(true)}
            className="sm:hidden text-(--t4) hover:text-violet-400/80 active:text-violet-400/80 transition-colors"
            title="관리"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-(--t4) hover:text-amber-400/80 transition-colors"
            title="추가"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-(--surface) rounded-xl space-y-2 border border-(--rim)">
          <input
            type="text"
            placeholder="사이트 이름"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-(--surface) text-(--foreground) text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-(--t5)"
          />
          <input
            type="text"
            placeholder="URL (예: google.com)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full bg-(--surface) text-(--foreground) text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-(--t5)"
          />
          <div className="flex gap-1 flex-wrap">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setForm({ ...form, emoji: e })}
                className={`text-lg p-1 rounded transition-colors ${
                  form.emoji === e
                    ? "bg-amber-400/20 ring-1 ring-amber-400/50"
                    : "hover:bg-(--surface-3)"
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
              className="flex-1 bg-(--surface) hover:bg-(--surface-3) text-(--t2) text-sm rounded-lg py-1.5 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
        {bookmarks.map((bm, index) => {
          const favicon = mounted ? getFavicon(bm.url) : null;
          const isDragging = dragIndex === index;
          const isOver = dragOverIndex === index && dragIndex !== index;
          const isEditing = editingId === bm.id;
          return (
            <div
              key={bm.id}
              draggable={!isEditing}
              onDragStart={() => !isEditing && handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative transition-all ${
                isDragging ? "opacity-30 scale-95" : "opacity-100 scale-100"
              } ${isOver ? "ring-1 ring-amber-400/50 rounded-xl bg-amber-400/[0.04]" : ""}`}
            >
              {isEditing ? (
                <div className="col-span-1 p-2 rounded-xl bg-(--surface-2) border border-amber-400/20 space-y-1.5">
                  <div className="flex gap-1 flex-wrap mb-1">
                    {EMOJIS.map((e) => (
                      <button key={e} onClick={() => setEditForm({ ...editForm, emoji: e })}
                        className={`text-sm p-0.5 rounded transition-colors ${editForm.emoji === e ? "bg-amber-400/20 ring-1 ring-amber-400/50" : "hover:bg-(--surface-3)"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="이름" className="w-full bg-(--surface) text-(--foreground) text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-(--t5)" />
                  <input type="text" value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                    placeholder="URL" className="w-full bg-(--surface) text-(--foreground) text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-(--t5)" />
                  <div className="flex gap-1">
                    <button onClick={saveEdit} className="flex-1 flex items-center justify-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs rounded-lg py-1 transition-colors border border-amber-400/20">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center bg-(--surface) hover:bg-(--surface-3) text-(--t3) text-xs rounded-lg py-1 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    draggable="false"
                    className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl hover:bg-(--surface-2) active:bg-(--surface-3) transition-colors cursor-pointer min-h-[64px] justify-center"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                      {favicon ? (
                        <img src={favicon} alt={bm.title} className="w-5 h-5 sm:w-6 sm:h-6 rounded opacity-80" loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).nextSibling!.textContent = bm.emoji;
                          }} />
                      ) : (
                        <span className="text-xl">{bm.emoji}</span>
                      )}
                      <span className="hidden text-xl">{bm.emoji}</span>
                    </div>
                    <span className="text-xs text-(--t3) group-hover:text-(--t1) truncate w-full text-center transition-colors">{bm.title}</span>
                  </a>
                  <button onClick={() => removeBookmark(bm.id)}
                    className="absolute top-1 right-1 hidden sm:opacity-0 sm:group-hover:opacity-100 sm:flex text-(--t4) hover:text-red-400/70 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => startEdit(bm)}
                    className="absolute top-1 left-1 hidden sm:opacity-0 sm:group-hover:opacity-100 sm:flex text-(--t4) hover:text-amber-400/70 transition-all">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <GripVertical className="absolute bottom-1 right-1 w-3 h-3 text-(--t5) hidden sm:opacity-0 sm:group-hover:opacity-100 sm:block transition-all cursor-grab" />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {showManageModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowManageModal(false); setModalEditingId(null); } }}
        >
          <div
            className="w-full rounded-t-2xl overflow-hidden flex flex-col"
            style={{ background: "linear-gradient(135deg, rgba(14,14,22,0.99), rgba(8,8,16,0.99))", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", maxHeight: "80vh" }}
          >
            <div style={{ height: 2, background: "linear-gradient(to right, transparent, rgba(167,139,250,0.7), rgba(139,92,246,0.5), transparent)", flexShrink: 0 }} />
            <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
              <span className="text-sm font-semibold text-(--t1)">즐겨찾기 관리</span>
              <button
                onClick={() => { setShowManageModal(false); setModalEditingId(null); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-(--t4) hover:text-(--t1) hover:bg-(--surface-2) transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 pb-8 space-y-2">
              {bookmarks.map((bm, index) => {
                const favicon = getFavicon(bm.url);
                const isModalEditing = modalEditingId === bm.id;
                return (
                  <div key={bm.id} className="rounded-xl border border-(--rim-2) overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    {isModalEditing ? (
                      <div className="p-3 space-y-2">
                        <div className="flex gap-1 flex-wrap">
                          {EMOJIS.map((e) => (
                            <button key={e} onClick={() => setModalEditForm({ ...modalEditForm, emoji: e })}
                              className={`text-base p-1 rounded transition-colors ${modalEditForm.emoji === e ? "bg-amber-400/20 ring-1 ring-amber-400/50" : "hover:bg-(--surface-3)"}`}>
                              {e}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={modalEditForm.title}
                          onChange={(e) => setModalEditForm({ ...modalEditForm, title: e.target.value })}
                          placeholder="이름"
                          className="w-full bg-(--surface) text-(--foreground) text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-(--t5)"
                        />
                        <input
                          type="text"
                          value={modalEditForm.url}
                          onChange={(e) => setModalEditForm({ ...modalEditForm, url: e.target.value })}
                          placeholder="URL"
                          className="w-full bg-(--surface) text-(--foreground) text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-(--t5)"
                        />
                        <div className="flex gap-2">
                          <button onClick={saveModalEdit}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-sm rounded-lg py-2 transition-colors border border-amber-400/20">
                            <Check className="w-3.5 h-3.5" /> 저장
                          </button>
                          <button onClick={() => setModalEditingId(null)}
                            className="flex-1 flex items-center justify-center bg-(--surface) hover:bg-(--surface-3) text-(--t3) text-sm rounded-lg py-2 transition-colors">
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                          {favicon ? (
                            <img src={favicon} alt={bm.title} className="w-6 h-6 rounded opacity-80"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                const next = (e.target as HTMLImageElement).nextSibling as HTMLElement | null;
                                if (next) next.textContent = bm.emoji;
                              }} />
                          ) : null}
                          <span className={`text-xl ${favicon ? "hidden" : ""}`}>{bm.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-(--t1) truncate">{bm.title}</p>
                          <p className="text-xs text-(--t4) truncate">{bm.url}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveItem(index, -1)} disabled={index === 0}
                              className="w-6 h-5 flex items-center justify-center text-(--t4) hover:text-(--t2) active:text-(--t2) disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => moveItem(index, 1)} disabled={index === bookmarks.length - 1}
                              className="w-6 h-5 flex items-center justify-center text-(--t4) hover:text-(--t2) active:text-(--t2) disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button onClick={() => startModalEdit(bm)}
                            className="w-7 h-7 flex items-center justify-center text-(--t4) hover:text-amber-400/80 active:text-amber-400/80 transition-colors rounded-lg hover:bg-(--surface)">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeBookmark(bm.id)}
                            className="w-7 h-7 flex items-center justify-center text-(--t4) hover:text-red-400/70 active:text-red-400/70 transition-colors rounded-lg hover:bg-(--surface)">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
