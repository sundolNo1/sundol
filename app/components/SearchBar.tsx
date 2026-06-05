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
      <div className="flex items-center bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden focus-within:border-blue-500/50 transition-colors">
        <div className="flex">
          {ENGINES.map((e, i) => (
            <button
              key={e.name}
              type="button"
              onClick={() => setEngine(i)}
              className={`px-3 py-3 text-sm transition-colors ${
                engine === i ? "text-white" : "text-slate-500 hover:text-slate-300"
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
          className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none py-3 px-2 text-sm"
          autoFocus
        />
        <button
          type="submit"
          className="px-4 py-3 text-slate-400 hover:text-blue-400 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
