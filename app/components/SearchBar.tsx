"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const ENGINES = [
  { name: "Google", url: "https://www.google.com/search?q=", icon: "🔍" },
  { name: "Naver", url: "https://search.naver.com/search.naver?query=", icon: "🟢" },
  { name: "YouTube", url: "https://www.youtube.com/results?search_query=", icon: "▶️" },
];

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [engine, setEngine] = useState(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    window.open(ENGINES[engine].url + encodeURIComponent(query), "_blank");
    setQuery("");
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="flex items-center bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-amber-400/40 focus-within:bg-white/[0.06] transition-all">
        <div className="flex border-r border-white/[0.06]">
          {ENGINES.map((e, i) => (
            <button
              key={e.name}
              type="button"
              onClick={() => setEngine(i)}
              className={`px-3 py-3.5 text-sm transition-colors ${
                engine === i ? "text-amber-300" : "text-white/25 hover:text-white/50"
              }`}
              title={e.name}
            >
              {e.icon}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${ENGINES[engine].name}에서 검색...`}
          className="flex-1 bg-transparent text-[#f0ead6] placeholder-white/20 outline-none py-3.5 px-3 text-sm tracking-wide"
          autoFocus
        />
        <button
          type="submit"
          className="px-4 py-3.5 text-white/25 hover:text-amber-400 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
