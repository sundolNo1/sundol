"use client";

import { useEffect, useState, useRef } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, MapPin, Navigation } from "lucide-react";

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
  "01": <Sun className="w-10 h-10 text-yellow-400" />,
  "02": <Cloud className="w-10 h-10 text-slate-300" />,
  "03": <Cloud className="w-10 h-10 text-slate-400" />,
  "04": <Cloud className="w-10 h-10 text-slate-500" />,
  "09": <CloudRain className="w-10 h-10 text-blue-400" />,
  "10": <CloudRain className="w-10 h-10 text-blue-400" />,
  "13": <CloudSnow className="w-10 h-10 text-blue-200" />,
  "50": <Wind className="w-10 h-10 text-slate-400" />,
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
  const pickerRef = useRef<HTMLDivElement>(null);

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
      if (!navigator.geolocation) {
        fetchWeather(37.5665, 126.9780);
        return;
      }
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  const handleSelectCity = (city: City) => {
    setSelectedCity(city.name);
    localStorage.setItem("weatherCity", city.name);
    setShowPicker(false);
    loadByCity(city);
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest">날씨</h2>
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors text-xs"
            title="지역 변경"
          >
            {selectedCity === "현재 위치" ? (
              <Navigation className="w-3.5 h-3.5" />
            ) : (
              <MapPin className="w-3.5 h-3.5" />
            )}
            <span>{selectedCity}</span>
          </button>

          {showPicker && (
            <div className="absolute right-0 top-6 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl w-32 py-1 overflow-hidden">
              {CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleSelectCity(city)}
                  className={`w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center gap-2
                    ${selectedCity === city.name
                      ? "text-blue-400 bg-blue-500/10"
                      : "text-slate-300 hover:bg-slate-700"
                    }`}
                >
                  {city.name === "현재 위치" && <Navigation className="w-3 h-3 shrink-0" />}
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-20 text-slate-500">로딩 중...</div>
      )}
      {error && (
        <div className="flex items-center justify-center h-20 text-slate-500 text-sm text-center">{error}</div>
      )}
      {!loading && !error && weather && (
        <div>
          <div className="flex items-center gap-4">
            <div>{WEATHER_ICONS[weather.icon] ?? <Cloud className="w-10 h-10 text-slate-400" />}</div>
            <div>
              <div className="text-4xl font-bold text-white">{weather.temp}°C</div>
              <div className="text-slate-400 text-sm capitalize">{weather.description}</div>
              <div className="text-slate-500 text-xs">{weather.city}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3" />
              <span>체감 {weather.feels_like}°</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              <span>습도 {weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              <span>바람 {weather.wind_speed}m/s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
