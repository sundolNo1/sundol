import { NextResponse } from "next/server";

const PRIMARY = ["JPY", "EUR", "CNY", "GBP"];
const SECONDARY = ["AUD", "CAD", "CHF", "HKD", "SGD", "THB"];
const ALL_TO = [...PRIMARY, ...SECONDARY, "KRW"].join(",");

const META: Record<string, { name: string; flag: string; per?: number }> = {
  USD: { name: "달러",    flag: "🇺🇸" },
  JPY: { name: "엔",      flag: "🇯🇵", per: 100 },
  EUR: { name: "유로",    flag: "🇪🇺" },
  CNY: { name: "위안",    flag: "🇨🇳" },
  GBP: { name: "파운드",  flag: "🇬🇧" },
  AUD: { name: "호주달러",flag: "🇦🇺" },
  CAD: { name: "캐나다달러",flag:"🇨🇦" },
  CHF: { name: "스위스프랑",flag:"🇨🇭" },
  HKD: { name: "홍콩달러",flag: "🇭🇰" },
  SGD: { name: "싱가폴달러",flag:"🇸🇬" },
  THB: { name: "바트",    flag: "🇹🇭", per: 100 },
};

function toKRW(usdToKrw: number, usdToTarget: number, per = 1) {
  return Math.round((usdToKrw / usdToTarget) * per);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toUpperCase();

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=${query ? `${query},KRW` : ALL_TO}`,
      { next: { revalidate: query ? 60 : 3600 }, headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    const rates = data.rates as Record<string, number>;
    const KRW = rates["KRW"];
    if (!KRW) throw new Error();

    if (query) {
      const targetRate = rates[query];
      if (!targetRate) return NextResponse.json({ error: "지원하지 않는 통화" }, { status: 404 });
      const m = META[query] ?? { name: query, flag: "🏳️" };
      const per = m.per ?? 1;
      return NextResponse.json({
        date: data.date,
        rates: [{ code: query, name: m.name, flag: m.flag, per, krw: toKRW(KRW, targetRate, per) }],
      });
    }

    const makeRow = (code: string) => {
      const m = META[code]!;
      const per = m.per ?? 1;
      return { code, name: m.name + (per > 1 ? ` (${per})` : ""), flag: m.flag, krw: toKRW(KRW, rates[code], per) };
    };

    return NextResponse.json({
      date: data.date,
      primary: [
        { code: "USD", name: "달러", flag: "🇺🇸", krw: Math.round(KRW) },
        ...PRIMARY.map(makeRow),
      ],
      secondary: SECONDARY.map(makeRow),
    });
  } catch {
    return NextResponse.json({ error: "환율 로드 실패" }, { status: 502 });
  }
}
