"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, MapPin, Navigation, ChevronDown, ChevronUp, X } from "lucide-react";

interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  humidity: number;
  wind_speed: number;
  city: string;
  icon: string;
}

interface HourlyItem {
  dt: number;
  temp: number;
  description: string;
  icon: string;
  isDay: boolean;
  pop: number;
  wind: number;
}

interface DailyItem {
  date: string;
  tempMax: number;
  tempMin: number;
  icon: string;
  pop: number;
}

interface City { name: string; lat: number; lon: number; }

const CITIES: City[] = [
  { name: "현재 위치", lat: 0, lon: 0 },
  { name: "서울", lat: 37.5665, lon: 126.9780 },
  { name: "부산", lat: 35.1796, lon: 129.0756 },
  { name: "대구", lat: 35.8714, lon: 128.6014 },
  { name: "인천", lat: 37.4563, lon: 126.7052 },
  { name: "광주", lat: 35.1595, lon: 126.8526 },
  { name: "대전", lat: 36.3504, lon: 127.3845 },
  { name: "울산", lat: 35.5384, lon: 129.3114 },
  { name: "수원", lat: 37.2636, lon: 127.0286 },
  { name: "춘천", lat: 37.8813, lon: 127.7298 },
  { name: "청주", lat: 36.6424, lon: 127.4890 },
  { name: "전주", lat: 35.8242, lon: 127.1479 },
  { name: "제주", lat: 33.4996, lon: 126.5312 },
];

function WeatherIcon({ code, className }: { code: string; className?: string }) {
  const cls = className ?? "w-7 h-7";
  const icons: Record<string, React.ReactNode> = {
    "01": <Sun className={`${cls} text-amber-300`} />,
    "02": <Cloud className={`${cls} text-white/50`} />,
    "03": <Cloud className={`${cls} text-white/40`} />,
    "04": <Cloud className={`${cls} text-white/30`} />,
    "09": <CloudRain className={`${cls} text-blue-300/70`} />,
    "10": <CloudRain className={`${cls} text-blue-300/70`} />,
    "13": <CloudSnow className={`${cls} text-blue-100/60`} />,
    "50": <Wind className={`${cls} text-white/40`} />,
  };
  return <>{icons[code] ?? <Cloud className={`${cls} text-white/40`} />}</>;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [gpsBlocked, setGpsBlocked] = useState(false);
  const [forecast, setForecast] = useState<{ hourly: HourlyItem[]; daily: DailyItem[] } | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [currentLatLon, setCurrentLatLon] = useState({ lat: 37.5665, lon: 126.9780 });
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof window === "undefined") return "현재 위치";
    return localStorage.getItem("weatherCity") ?? "현재 위치";
  });

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    setCurrentLatLon({ lat, lon });
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWeather(data);
    } catch {
      setError("날씨 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (lat: number, lon: number) => {
    setForecastLoading(true);
    try {
      const res = await fetch(`/api/forecast?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setForecast(data);
    } catch {
      setForecast(null);
    } finally {
      setForecastLoading(false);
    }
  };

  const loadByCity = (city: City) => {
    if (city.name === "현재 위치") {
      if (!navigator.geolocation) { fetchWeather(37.5665, 126.9780); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => { setGpsBlocked(false); fetchWeather(pos.coords.latitude, pos.coords.longitude); },
        () => { setGpsBlocked(true); fetchWeather(37.5665, 126.9780); },
        { timeout: 5000 }
      );
    } else {
      fetchWeather(city.lat, city.lon);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const city = CITIES.find((c) => c.name === selectedCity) ?? CITIES[0];
    loadByCity(city);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectCity = (city: City) => {
    setSelectedCity(city.name);
    localStorage.setItem("weatherCity", city.name);
    setShowPicker(false);
    setGpsBlocked(false);
    loadByCity(city);
  };

  const handleOpenModal = () => {
    setShowModal(true);
    fetchForecast(currentLatLon.lat, currentLatLon.lon);
  };

  const onKey = useCallback((e: KeyboardEvent) => { if (e.key === "Escape") setShowModal(false); }, []);
  useEffect(() => {
    if (showModal) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showModal, onKey]);

  return (
    <>
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/[0.07]">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-white/30 text-xs font-semibold uppercase tracking-widest">날씨</h2>
          <button
            onClick={(e) => { e.stopPropagation(); setShowPicker((v) => !v); }}
            className="flex items-center gap-1 text-white/30 hover:text-amber-400/80 transition-colors text-xs"
          >
            {selectedCity === "현재 위치" ? <Navigation className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
            <span>{selectedCity}</span>
            {showPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {showPicker && (
          <div className="mb-4 overflow-y-auto max-h-40 rounded-xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.04]">
            {CITIES.map((city) => (
              <button key={city.name} onClick={() => handleSelectCity(city)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2
                  ${selectedCity === city.name ? "text-amber-300 bg-amber-400/10" : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"}`}>
                {city.name === "현재 위치" ? <Navigation className="w-3 h-3 shrink-0" /> : <MapPin className="w-3 h-3 shrink-0 text-white/20" />}
                {city.name}
              </button>
            ))}
          </div>
        )}

        {gpsBlocked && (
          <div className="mb-3 flex items-center gap-1.5 text-[10px] text-amber-300/60 bg-amber-400/[0.06] border border-amber-400/15 rounded-lg px-2.5 py-1.5">
            <Navigation className="w-3 h-3 flex-shrink-0" />
            <span>위치 권한 거부됨 — 서울 기준으로 표시 중</span>
          </div>
        )}

        {loading && <div className="flex items-center justify-center h-20 text-white/20 text-sm">로딩 중...</div>}
        {error && <div className="flex items-center justify-center h-20 text-white/20 text-sm text-center">{error}</div>}
        {!loading && !error && weather && (
          <button onClick={handleOpenModal} className="w-full text-left hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="opacity-80 flex-shrink-0 [&>svg]:w-7 [&>svg]:h-7 sm:[&>svg]:w-10 sm:[&>svg]:h-10">
                <WeatherIcon code={weather.icon} className="w-7 h-7 sm:w-10 sm:h-10" />
              </div>
              <div className="min-w-0">
                <div className="text-3xl sm:text-5xl font-thin text-[#f0ead6] tracking-wide">{weather.temp}°</div>
                <div className="text-white/40 text-xs sm:text-sm capitalize mt-0.5 truncate">{weather.description}</div>
                <div className="text-white/20 text-xs truncate">{weather.city}</div>
              </div>
              <div className="ml-auto text-white/20 text-xs flex-shrink-0">예보 →</div>
            </div>
            <div className="mt-3 sm:mt-5 grid grid-cols-3 gap-1 sm:gap-2 text-[10px] sm:text-xs text-white/30 border-t border-white/[0.05] pt-3 sm:pt-4">
              <div className="flex items-center gap-1.5"><Thermometer className="w-3 h-3 text-amber-400/40" /><span>체감 {weather.feels_like}°</span></div>
              <div className="flex items-center gap-1.5"><Droplets className="w-3 h-3 text-blue-300/40" /><span>습도 {weather.humidity}%</span></div>
              <div className="flex items-center gap-1.5"><Wind className="w-3 h-3 text-white/30" /><span>바람 {weather.wind_speed}m/s</span></div>
            </div>
          </button>
        )}
      </div>

      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(14,14,22,0.98), rgba(8,8,16,0.99))", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>
            <div style={{ height: 2, background: "linear-gradient(to right, transparent, #60a5fa, #3b82f6, #60a5fa, transparent)" }} />

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm font-semibold text-white/70">시간대별 예보</span>
                  <span className="text-xs text-white/30 ml-2">{weather?.city}</span>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {forecastLoading ? (
                <div className="space-y-2 py-4">
                  {[1,2,3].map(i => <div key={i} className="animate-pulse h-10 bg-white/[0.04] rounded-xl" />)}
                </div>
              ) : forecast ? (
                <>
                  {/* 시간별 예보 */}
                  <div className="mb-4">
                    <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">3시간 간격 예보</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {forecast.hourly.map((h) => {
                        const timeStr = new Date(h.dt * 1000).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
                        return (
                          <div key={h.dt} className="flex flex-col items-center gap-1 flex-shrink-0 px-2 py-2 rounded-xl min-w-[52px]"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <span className="text-[10px] text-white/35">{timeStr}</span>
                            <div className="[&>svg]:w-5 [&>svg]:h-5 opacity-80">
                              <WeatherIcon code={h.icon} className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-white/80">{h.temp}°</span>
                            {h.pop > 0 && (
                              <span className="text-[9px] text-blue-300/70">💧{h.pop}%</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 일별 예보 */}
                  <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">5일 예보</p>
                    <div className="space-y-1">
                      {forecast.daily.map((d) => (
                        <div key={d.date} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                          <span className="text-xs text-white/50 w-24">{d.date}</span>
                          <div className="[&>svg]:w-4 [&>svg]:h-4 opacity-70">
                            <WeatherIcon code={d.icon} className="w-4 h-4" />
                          </div>
                          {d.pop > 0 && <span className="text-[10px] text-blue-300/60">💧{d.pop}%</span>}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-red-300/70">{d.tempMax}°</span>
                            <span className="text-white/20">/</span>
                            <span className="text-blue-300/70">{d.tempMin}°</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-white/20 text-sm text-center py-6">예보를 불러올 수 없습니다</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
