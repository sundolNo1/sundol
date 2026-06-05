import { NextResponse } from "next/server";

const RSS_FEEDS = [
  {
    name: "YTN",
    url: "https://www.ytn.co.kr/news/rss.php",
    category: "종합",
  },
  {
    name: "한겨레",
    url: "https://www.hani.co.kr/rss/",
    category: "종합",
  },
  {
    name: "BBC Korea",
    url: "https://feeds.bbci.co.uk/korean/rss.xml",
    category: "국제",
  },
];

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
}

function parseRSS(xml: string, source: string, category: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const titleRegex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i;
  const linkRegex = /<link>([^<]+)<\/link>/i;
  const pubDateRegex = /<pubDate>([^<]+)<\/pubDate>/i;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = titleRegex.exec(item)?.[1]?.trim() ?? "";
    const link = linkRegex.exec(item)?.[1]?.trim() ?? "";
    const pubDate = pubDateRegex.exec(item)?.[1]?.trim() ?? "";

    if (title && link) {
      items.push({ title, link, pubDate, source, category });
    }
  }
  return items.slice(0, 8);
}

export async function GET() {
  const results: NewsItem[] = [];

  await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          next: { revalidate: 600 },
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        if (!res.ok) return;
        const xml = await res.text();
        const items = parseRSS(xml, feed.name, feed.category);
        results.push(...items);
      } catch {
        // skip failed feeds
      }
    })
  );

  const sorted = results.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  return NextResponse.json(sorted.slice(0, 20));
}
