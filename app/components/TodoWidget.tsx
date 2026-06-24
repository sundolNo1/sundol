"use client";

import { useState, useEffect } from "react";
import { Plus, Check, X, GripVertical } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const TODOS_KEY = "todos_v1";

export default function TodoWidget() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(TODOS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [{ id: Date.now().toString(), text, done: false }, ...prev]);
    setInput("");
  };

  const toggleTodo = (id: string) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const removeTodo = (id: string) =>
    setTodos((prev) => prev.filter((t) => t.id !== id));

  const clearDone = () => setTodos((prev) => prev.filter((t) => !t.done));

  // 드래그 핸들러
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragId) setOverId(id);
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); setOverId(null); return; }
    setTodos(prev => {
      const arr = [...prev];
      const from = arr.findIndex(t => t.id === dragId);
      const to   = arr.findIndex(t => t.id === targetId);
      if (from < 0 || to < 0) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    setDragId(null);
    setOverId(null);
  };

  const onDragEnd = () => { setDragId(null); setOverId(null); };

  const doneCount   = todos.filter((t) => t.done).length;
  const activeCount = todos.filter((t) => !t.done).length;

  const filtered = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "done" ? t.done : true
  );

  return (
    <div className="relative overflow-hidden bg-white/[0.05] backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.25)] hover:border-rose-400/20 hover:shadow-[0_0_40px_rgba(251,113,133,0.10)] transition-all">
      <div style={{ height: 2, background: "linear-gradient(to right, transparent, rgba(251,113,133,0.7), rgba(244,63,94,0.5), transparent)" }} className="absolute top-0 inset-x-0 pointer-events-none" />
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-white/30 text-xs font-semibold uppercase tracking-widest">할 일</h2>
        {doneCount > 0 && (
          <button
            onClick={clearDone}
            className="text-white/20 hover:text-red-400/60 transition-colors text-[10px] tracking-wide"
          >
            완료 삭제
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="새 할 일..."
          className="flex-1 bg-white/[0.04] text-[#f0ead6] text-sm rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400/40 placeholder-white/20 border border-white/[0.06]"
        />
        <button
          onClick={addTodo}
          className="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300/70 rounded-xl transition-colors border border-amber-400/15"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {todos.length > 0 && (
        <div className="flex gap-1 mb-3">
          {(["all", "active", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                filter === f
                  ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                  : "text-white/30 hover:text-white/50 border border-transparent"
              }`}
            >
              {f === "all" ? `전체 ${todos.length}` : f === "active" ? `진행 ${activeCount}` : `완료 ${doneCount}`}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-white/15 text-xs text-center py-6 tracking-wide">
            {todos.length === 0 ? "할 일을 추가해 보세요" : "표시할 항목이 없습니다"}
          </div>
        ) : (
          filtered.map((todo) => (
            <div
              key={todo.id}
              draggable
              onDragStart={e => onDragStart(e, todo.id)}
              onDragOver={e  => onDragOver(e, todo.id)}
              onDrop={e      => onDrop(e, todo.id)}
              onDragEnd={onDragEnd}
              className={`group flex items-center gap-2 py-2 px-1.5 rounded-lg transition-all duration-150 ${
                dragId === todo.id
                  ? "opacity-40 scale-[0.98]"
                  : overId === todo.id
                  ? "bg-amber-400/[0.07] ring-1 ring-amber-400/25"
                  : "hover:bg-white/[0.04]"
              }`}
            >
              {/* 드래그 핸들 */}
              <GripVertical
                className="w-3.5 h-3.5 flex-shrink-0 text-white/15 group-hover:text-white/35 transition-colors cursor-grab active:cursor-grabbing"
              />

              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
                  todo.done
                    ? "bg-amber-400/30 border-amber-400/50"
                    : "border-white/20 hover:border-amber-400/50"
                }`}
              >
                {todo.done && <Check className="w-2.5 h-2.5 text-amber-300" />}
              </button>

              <span
                className={`flex-1 text-sm transition-colors ${
                  todo.done ? "line-through text-white/20" : "text-white/60"
                }`}
              >
                {todo.text}
              </span>

              <button
                onClick={() => removeTodo(todo.id)}
                className="sm:opacity-0 sm:group-hover:opacity-100 text-white/20 hover:text-red-400/60 active:text-red-400/60 transition-all flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
