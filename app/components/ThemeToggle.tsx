"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const KEY = "portal_theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") as "dark" | "light";
    setTheme(t || "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(KEY, next);
  }

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-20 w-11 h-11 rounded-full bg-(--surface) backdrop-blur-xl border border-(--rim-2) flex items-center justify-center text-(--t3) hover:text-amber-400/80 hover:bg-(--surface-2) transition-all shadow-lg z-50"
      title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {theme === "dark"
        ? <Sun className="w-4 h-4" />
        : <Moon className="w-4 h-4" />}
    </button>
  );
}
