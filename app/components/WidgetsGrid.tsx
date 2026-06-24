"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, X, Monitor, Smartphone } from "lucide-react";
import { createPortal } from "react-dom";
import ThemeToggle from "./ThemeToggle";
import ClockWidget from "./ClockWidget";
import WeatherWidget from "./WeatherWidget";
import BookmarksWidget from "./BookmarksWidget";
import NewsWidget from "./NewsWidget";
import StocksWidget from "./StocksWidget";
import ExchangeWidget from "./ExchangeWidget";
import CryptoWidget from "./CryptoWidget";

type WidgetKey = "clock" | "weather" | "bookmarks" | "news" | "stocks" | "crypto" | "exchange";
type ViewMode = "auto" | "pc" | "mobile";

const WIDGET_META: { key: WidgetKey; label: string; icon: string }[] = [
  { key: "clock",    label: "시계",      icon: "🕐" },
  { key: "weather",  label: "날씨",      icon: "🌤️" },
  { key: "bookmarks",label: "즐겨찾기",  icon: "⭐" },
  { key: "news",     label: "뉴스",      icon: "📰" },
  { key: "stocks",   label: "증시",      icon: "📈" },
  { key: "crypto",   label: "암호화폐",  icon: "🪙" },
  { key: "exchange", label: "환율",      icon: "💱" },
];

const DEFAULT_VIS: Record<WidgetKey, boolean> = {
  clock: true, weather: true, bookmarks: true, news: true,
  stocks: true, crypto: true, exchange: true,
};

const VIS_KEY = "widget_visibility_v2";
const VIEW_KEY = "portal_view_mode";

const CELL = "hover:-translate-y-0.5 transition-all duration-300 rounded-2xl";

function getColClass(
  cols: "always2" | "sm" | "lg",
  viewMode: ViewMode,
  hasBoth: boolean
): string {
  if (!hasBoth) return "grid-cols-1";
  if (viewMode === "pc") return "grid-cols-2";
  if (viewMode === "mobile") {
    return cols === "always2" ? "grid-cols-2" : "grid-cols-1";
  }
  // auto — 기존 반응형
  if (cols === "always2") return "grid-cols-2";
  if (cols === "lg") return "grid-cols-1 lg:grid-cols-2";
  return "grid-cols-1 sm:grid-cols-2";
}

function WidgetRow({
  left, right, delay, cols = "sm", viewMode,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  delay: string;
  cols?: "always2" | "sm" | "lg";
  viewMode: ViewMode;
}) {
  if (!left && !right) return null;
  const colClass = getColClass(cols, viewMode, !!(left && right));
  return (
    <div className={`fade-up grid gap-3 sm:gap-4 ${colClass}`} style={{ animationDelay: delay }}>
      {left  && <div className={CELL}>{left}</div>}
      {right && <div className={CELL}>{right}</div>}
    </div>
  );
}

export default function WidgetsGrid() {
  const [vis, setVis] = useState<Record<WidgetKey, boolean>>(() => {
    if (typeof window === "undefined") return DEFAULT_VIS;
    try {
      const saved = localStorage.getItem(VIS_KEY);
      return saved ? { ...DEFAULT_VIS, ...JSON.parse(saved) } : DEFAULT_VIS;
    } catch {
      return DEFAULT_VIS;
    }
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "auto";
    return (localStorage.getItem(VIEW_KEY) as ViewMode) ?? "auto";
  });
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { localStorage.setItem(VIS_KEY, JSON.stringify(vis)); }, [vis]);
  useEffect(() => { localStorage.setItem(VIEW_KEY, viewMode); }, [viewMode]);

  const toggle = (key: WidgetKey) => setVis((prev) => ({ ...prev, [key]: !prev[key] }));

  const cycleView = () => {
    setViewMode((prev) => {
      if (prev === "auto") return "pc";
      if (prev === "pc") return "mobile";
      return "auto";
    });
  };

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setShowSettings(false);
  }, []);
  useEffect(() => {
    if (showSettings) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showSettings, onKey]);

  const viewLabel = viewMode === "pc" ? "PC" : viewMode === "mobile" ? "모바일" : "자동";
  const ViewIcon = viewMode === "mobile" ? Smartphone : Monitor;

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Row 1: 시계 + 날씨 */}
        <WidgetRow delay="240ms" cols="always2" viewMode={viewMode}
          left={vis.clock    ? <ClockWidget />   : null}
          right={vis.weather ? <WeatherWidget /> : null}
        />

        {/* Row 2: 즐겨찾기 + 증시 */}
        <WidgetRow delay="300ms" cols="lg" viewMode={viewMode}
          left={vis.bookmarks ? <BookmarksWidget /> : null}
          right={vis.stocks   ? <StocksWidget />    : null}
        />

        {/* Row 3: 뉴스 (full width) */}
        {vis.news && (
          <div className={`fade-up ${CELL}`} style={{ animationDelay: "360ms" }}>
            <NewsWidget />
          </div>
        )}

        {/* Row 4: 암호화폐 + 환율 */}
        <WidgetRow delay="420ms" cols="sm" viewMode={viewMode}
          left={vis.crypto    ? <CryptoWidget />   : null}
          right={vis.exchange ? <ExchangeWidget /> : null}
        />
      </div>

      {/* 뷰 전환 버튼 */}
      <button
        onClick={cycleView}
        className="fixed bottom-6 left-6 flex items-center gap-1.5 h-11 px-3 rounded-full bg-(--surface-2) backdrop-blur-xl border border-(--rim-2) text-(--t3) hover:text-amber-400/80 hover:bg-(--surface-3) transition-all shadow-lg z-50"
        title="레이아웃 전환"
      >
        <ViewIcon className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-medium">{viewLabel}</span>
      </button>

      {/* 테마 토글 */}
      <ThemeToggle />

      {/* 위젯 설정 버튼 */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-(--surface-2) backdrop-blur-xl border border-(--rim-2) flex items-center justify-center text-(--t3) hover:text-amber-400/80 hover:bg-(--surface-3) transition-all shadow-lg z-50"
        title="위젯 설정"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* 설정 모달 */}
      {showSettings && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
        >
          <div
            className="w-full max-w-xs rounded-2xl overflow-hidden"
            style={{
              background: "var(--modal-bg)",
              border: "1px solid var(--modal-border)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ height: 2, background: "linear-gradient(to right, transparent, #fbbf24, #f59e0b, #fbbf24, transparent)" }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-(--t1)">위젯 설정</span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-(--t4) hover:text-(--t1) hover:bg-(--surface-2) transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {WIDGET_META.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => toggle(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${
                      vis[key]
                        ? "bg-amber-400/10 border-amber-400/30 text-amber-200"
                        : "bg-(--surface) border-(--rim) text-(--t4) line-through"
                    }`}
                  >
                    <span className="text-base">{icon}</span>
                    <span className="text-xs font-medium">{label}</span>
                    <div className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${vis[key] ? "bg-amber-400/70" : "bg-(--surface-3)"}`} />
                  </button>
                ))}
              </div>

              <p className="text-(--t5) text-[10px] mt-3 text-center tracking-wide">
                클릭으로 위젯 표시 / 숨기기
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
