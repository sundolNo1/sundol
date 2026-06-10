import { NextResponse } from "next/server";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  image?: string;
}

function extractImage(itemXml: string): string | undefined {
  const thumbnail = /media:thumbnail[^>]+url="([^"]+)"/i.exec(itemXml)?.[1];
  if (thumbnail) return thumbnail;
  const content =
    /media:content[^>]+url="([^"]+)"[^>]*type="image/i.exec(itemXml)?.[1] ??
    /media:content[^>]+type="image[^"]*"[^>]+url="([^"]+)"/i.exec(itemXml)?.[1];
  if (content) return content;
  return /enclosure[^>]+url="([^"]+)"[^>]*type="image/i.exec(itemXml)?.[1];
}

function parseRSS(xml: string, source: string, category: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i.exec(item)?.[1]?.trim() ?? "";
    const link = /<link>([^<]+)<\/link>/i.exec(item)?.[1]?.trim() ?? "";
    const pubDate = /<pubDate>([^<]+)<\/pubDate>/i.exec(item)?.[1]?.trim() ?? "";
    const image = extractImage(item);
    if (title && link) items.push({ title, link, pubDate, source, category, ...(image ? { image } : {}) });
  }
  return items.slice(0, 8);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const name = searchParams.get("name") ?? "피드";
  const category = searchParams.get("category") ?? "종합";

  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  try {
    const res = await fetch(url, {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) throw new Error("fetch failed");
    const xml = await res.text();
    return NextResponse.json(parseRSS(xml, name, category));
  } catch {
    return NextResponse.json({ error: "피드를 불러올 수 없습니다" }, { status: 502 });
  }
}
