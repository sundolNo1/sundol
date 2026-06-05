"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer } from "lucide-react";

interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  humidity: number;
  wind_speed: number;
  city: string;
  icon: string;
}

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

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWeather(data);
    };

    const tryGeo = () =>
      new Promise<{ lat: number; lon: number }>((resolve, reject) => {
        if (!navigator.geolocation) { reject(); return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => reject(),
          { timeout: 5000 }
        );
      });

    tryGeo()
      .then(({ lat, lon }) => fetchWeather(lat, lon))
      .catch(() => fetchWeather(37.5665, 126.9780))
      .catch(() => setError("날씨 정보를 불러올 수 없습니다"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/50">
      <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">날씨</h2>
      {loading && (
        <div className="flex items-center justify-center h-20 text-slate-500">로딩 중...</div>
      )}
      {error && (
        <div className="flex items-center justify-center h-20 text-slate-500 text-sm text-center">{error}</div>
      )}
      {weather && (
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
