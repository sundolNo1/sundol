import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") ?? "37.5665";
  const lon = searchParams.get("lon") ?? "126.9780";

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API 키 미설정" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`,
    { next: { revalidate: 600 } }
  );
  if (!res.ok) {
    return NextResponse.json({ error: "날씨 로드 실패" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({
    temp: Math.round(data.main.temp),
    feels_like: Math.round(data.main.feels_like),
    description: data.weather[0].description,
    humidity: data.main.humidity,
    wind_speed: data.wind.speed,
    city: data.name,
    icon: data.weather[0].icon.slice(0, 2),
  });
}
