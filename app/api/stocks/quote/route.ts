import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const res = await fetch(
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    { next: { revalidate: 300 }, headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) return NextResponse.json({ error: "no data" }, { status: 404 });

  const price = meta.regularMarketPrice as number;
  const prevClose = meta.chartPreviousClose as number;
  const change = price - prevClose;
  const changePct = (change / prevClose) * 100;
  const shortName = (meta.shortName || meta.longName || symbol) as string;

  return NextResponse.json({ symbol, shortName, price, change, changePct });
}
