import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=KRW,JPY,EUR,CNY",
      { next: { revalidate: 3600 }, headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    const { KRW, JPY, EUR, CNY } = data.rates;

    return NextResponse.json({
      date: data.date,
      rates: [
        { code: "USD", name: "달러", flag: "🇺🇸", krw: Math.round(KRW) },
        { code: "JPY", name: "엔 (100)", flag: "🇯🇵", krw: Math.round((KRW / JPY) * 100) },
        { code: "EUR", name: "유로", flag: "🇪🇺", krw: Math.round(KRW / EUR) },
        { code: "CNY", name: "위안", flag: "🇨🇳", krw: Math.round(KRW / CNY) },
      ],
    });
  } catch {
    return NextResponse.json({ error: "환율 로드 실패" }, { status: 502 });
  }
}
