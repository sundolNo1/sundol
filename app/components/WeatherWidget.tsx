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

export default function WeatherWidget({ apiKey }: { apiKey: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiKey || apiKey === "YOUR_API_KEY") {
      setError("API 키를 설정해주세요");
      setLoading(false);
      return;
    }

    const fetchWeather = async (lat: number, lon: number) => {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`
      );
      if (!res.ok) throw new Error("날씨 데이터 로드 실패");
      const data = await res.json();
      setWeather({
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        city: data.name,
        icon: data.weather[0].icon.slice(0, 2),
      });
    };

    // 위치 권한 있으면 실제 위치, 없으면 서울 기본값
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
      .catch(() => fetchWeather(37.5665, 126.9780)) // 서울 fallback
      .catch(() => setError("날씨 정보를 불러올 수 없습니다"))
      .finally(() => setLoading(false));
  }, [apiKey]);

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
