import { NextResponse } from "next/server";

const STOCKS = [
  { symbol: "^KS11",   name: "KOSPI",   group: "domestic" },
  { symbol: "^KQ11",   name: "KOSDAQ",  group: "domestic" },
  { symbol: "^GSPC",   name: "S&P 500", group: "foreign" },
  { symbol: "^IXIC",   name: "NASDAQ",  group: "foreign" },
  { symbol: "^DJI",    name: "DOW",     group: "foreign" },
  { symbol: "^N225",   name: "닛케이",  group: "foreign" },
];

async function fetchQuote(symbol: string) {
  const res = await fetch(
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    { next: { revalidate: 300 }, headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  return {
    price: meta.regularMarketPrice as number,
    prevClose: meta.chartPreviousClose as number,
  };
}

export async function GET() {
  const results = await Promise.allSettled(STOCKS.map(s => fetchQuote(s.symbol)));

  const output = STOCKS.map((s, i) => {
    const r = results[i];
    if (r.status !== "fulfilled" || !r.value) return { ...s, price: null, change: null, changePct: null };
    const { price, prevClose } = r.value;
    const change = price - prevClose;
    const changePct = (change / prevClose) * 100;
    return { ...s, price, change, changePct };
  });

  return NextResponse.json(output);
}
