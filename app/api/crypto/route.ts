import { NextResponse } from "next/server";

const COINS = [
  { id: "bitcoin",  symbol: "BTC", name: "비트코인" },
  { id: "ethereum", symbol: "ETH", name: "이더리움" },
  { id: "ripple",   symbol: "XRP", name: "리플" },
  { id: "solana",   symbol: "SOL", name: "솔라나" },
];

export async function GET() {
  try {
    const ids = COINS.map((c) => c.id).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=krw&include_24hr_change=true`,
      { next: { revalidate: 300 }, headers: { "Accept": "application/json" } }
    );
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();

    const output = COINS.map((coin) => {
      const d = data[coin.id];
      return {
        ...coin,
        price: d?.krw ?? null,
        changePct: d?.krw_24h_change ?? null,
      };
    });

    return NextResponse.json(output);
  } catch {
    return NextResponse.json(
      COINS.map((c) => ({ ...c, price: null, changePct: null }))
    );
  }
}
