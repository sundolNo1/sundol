import { NextResponse } from "next/server";
import { searchKoreanStocks } from "@/app/data/korean-stocks";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  // 한글 포함 또는 숫자만(종목코드) → 정적 Korean stocks 테이블에서 검색
  if (/[ㄱ-ㅎ가-힣]/.test(q) || /^\d+$/.test(q)) {
    const hits = searchKoreanStocks(q);
    const results = hits.map(s => ({
      symbol: s.symbol,
      name: s.name,
      exchange: s.exchange,
    }));
    return NextResponse.json({ results });
  }

  // 영문/숫자 → Yahoo Finance search API
  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`,
      { next: { revalidate: 60 }, headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = await res.json();
    if (data?.finance?.error) return NextResponse.json({ results: [] });

    const quotes: Record<string, unknown>[] = data?.quotes ?? [];
    const results = quotes
      .filter(q => q.isYahooFinance && q.symbol && q.quoteType === "EQUITY")
      .slice(0, 6)
      .map(q => ({
        symbol: q.symbol as string,
        name: (q.shortname || q.longname || q.symbol) as string,
        exchange: (q.exchDisp || q.exchange || "") as string,
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
