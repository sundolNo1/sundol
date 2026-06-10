"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, MapPin, Navigation, ChevronDown, ChevronUp } from "lucide-react";

interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  humidity: number;
  wind_speed: number;
  city: string;
  icon: string;
}

interface City {
  name: string;
  lat: number;
  lon: number;
}

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

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  "01": <Sun className="w-10 h-10 text-amber-300" />,
  "02": <Cloud className="w-10 h-10 text-white/50" />,
  "03": <Cloud className="w-10 h-10 text-white/40" />,
  "04": <Cloud className="w-10 h-10 text-white/30" />,
  "09": <CloudRain className="w-10 h-10 text-blue-300/70" />,
  "10": <CloudRain className="w-10 h-10 text-blue-300/70" />,
  "13": <CloudSnow className="w-10 h-10 text-blue-100/60" />,
  "50": <Wind className="w-10 h-10 text-white/40" />,
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof window === "undefined") return "현재 위치";
    return localStorage.getItem("weatherCity") ?? "현재 위치";
  });

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
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

  const loadByCity = (city: City) => {
    if (city.name === "현재 위치") {
      if (!navigator.geolocation) { fetchWeather(37.5665, 126.9780); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(37.5665, 126.9780),
        { timeout: 5000 }
      );
    } else {
      fetchWeather(city.lat, city.lon);
    }
  };

  useEffect(() => {
    const city = CITIES.find((c) => c.name === selectedCity) ?? CITIES[0];
    loadByCity(city);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectCity = (city: City) => {
    setSelectedCity(city.name);
    localStorage.setItem("weatherCity", city.name);
    setShowPicker(false);
    loadByCity(city);
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/[0.07]">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-white/30 text-xs font-semibold uppercase tracking-widest">날씨</h2>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="flex items-center gap-1 text-white/30 hover:text-amber-400/80 transition-colors text-xs"
        >
          {selectedCity === "현재 위치"
            ? <Navigation className="w-3.5 h-3.5" />
            : <MapPin className="w-3.5 h-3.5" />}
          <span>{selectedCity}</span>
          {showPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showPicker && (
        <div className="mb-4 overflow-y-auto max-h-40 rounded-xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.04]">
          {CITIES.map((city) => (
            <button
              key={city.name}
              onClick={() => handleSelectCity(city)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2
                ${selectedCity === city.name
                  ? "text-amber-300 bg-amber-400/10"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"}`}
            >
              {city.name === "현재 위치"
                ? <Navigation className="w-3 h-3 shrink-0" />
                : <MapPin className="w-3 h-3 shrink-0 text-white/20" />}
              {city.name}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-20 text-white/20 text-sm">로딩 중...</div>
      )}
      {error && (
        <div className="flex items-center justify-center h-20 text-white/20 text-sm text-center">{error}</div>
      )}
      {!loading && !error && weather && (
        <div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="opacity-80 flex-shrink-0 [&>svg]:w-7 [&>svg]:h-7 sm:[&>svg]:w-10 sm:[&>svg]:h-10">{WEATHER_ICONS[weather.icon] ?? <Cloud className="w-7 h-7 sm:w-10 sm:h-10 text-white/40" />}</div>
            <div className="min-w-0">
              <div className="text-3xl sm:text-5xl font-thin text-[#f0ead6] tracking-wide">{weather.temp}°</div>
              <div className="text-white/40 text-xs sm:text-sm capitalize mt-0.5 truncate">{weather.description}</div>
              <div className="text-white/20 text-xs truncate">{weather.city}</div>
            </div>
          </div>
          <div className="mt-3 sm:mt-5 grid grid-cols-3 gap-1 sm:gap-2 text-[10px] sm:text-xs text-white/30 border-t border-white/[0.05] pt-3 sm:pt-4">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3 h-3 text-amber-400/40" />
              <span>체감 {weather.feels_like}°</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3 h-3 text-blue-300/40" />
              <span>습도 {weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="w-3 h-3 text-white/30" />
              <span>바람 {weather.wind_speed}m/s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
