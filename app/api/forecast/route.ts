import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") ?? "37.5665";
  const lon = searchParams.get("lon") ?? "126.9780";

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API 키 미설정" }, { status: 500 });

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr&cnt=40`,
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) return NextResponse.json({ error: "예보 로드 실패" }, { status: 502 });

  const data = await res.json();

  const hourly = data.list.slice(0, 8).map((item: any) => ({
    dt: item.dt,
    temp: Math.round(item.main.temp),
    description: item.weather[0].description,
    icon: item.weather[0].icon.slice(0, 2),
    isDay: item.weather[0].icon.endsWith("d"),
    pop: Math.round((item.pop ?? 0) * 100),
    wind: item.wind.speed,
  }));

  // 일별 요약: dt_txt 날짜 기준으로 그룹핑
  const dayMap = new Map<string, any[]>();
  for (const item of data.list) {
    const date = new Date(item.dt * 1000).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" });
    if (!dayMap.has(date)) dayMap.set(date, []);
    dayMap.get(date)!.push(item);
  }
  const daily = [...dayMap.entries()].slice(0, 5).map(([date, items]) => ({
    date,
    tempMax: Math.round(Math.max(...items.map((i: any) => i.main.temp_max))),
    tempMin: Math.round(Math.min(...items.map((i: any) => i.main.temp_min))),
    icon: items[Math.floor(items.length / 2)].weather[0].icon.slice(0, 2),
    pop: Math.round(Math.max(...items.map((i: any) => (i.pop ?? 0) * 100))),
  }));

  return NextResponse.json({ hourly, daily });
}
