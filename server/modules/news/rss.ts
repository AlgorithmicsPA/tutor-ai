import { XMLParser } from "fast-xml-parser";

export interface RssItem {
  title: string;
  link: string;
  summary: string;
  publishedAt: Date | null;
  source: string;
}

export const AI_FEEDS: { name: string; url: string }[] = [
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
  { name: "MIT Tech Review AI", url: "https://www.technologyreview.com/feed/" },
  { name: "MarkTechPost", url: "https://www.marktechpost.com/feed/" },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "_t",
});

function stripHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim()
    .replace(/\s+/g, " ");
}

function pickText(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value._t === "string") return value._t;
  if (typeof value["#text"] === "string") return value["#text"];
  return String(value);
}

function pickLink(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const alt = value.find((v: any) => !v["@_rel"] || v["@_rel"] === "alternate");
    return alt?.["@_href"] || value[0]?.["@_href"] || pickText(value[0]);
  }
  return value["@_href"] || pickText(value);
}

async function fetchFeed(name: string, url: string, timeoutMs = 10000): Promise<RssItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TutorAINewsBot/1.0; +https://tutorai.duckdns.org)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) {
      console.warn(`[news] ${name}: HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const parsed = parser.parse(xml);

    let items: any[] = [];
    if (parsed?.rss?.channel?.item) {
      items = Array.isArray(parsed.rss.channel.item) ? parsed.rss.channel.item : [parsed.rss.channel.item];
    } else if (parsed?.feed?.entry) {
      items = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
    }

    return items.map((it: any): RssItem => {
      const title = stripHtml(pickText(it.title));
      const link = pickLink(it.link);
      const descRaw = it.description || it.summary || it["content:encoded"] || it.content || "";
      const summary = stripHtml(pickText(descRaw)).slice(0, 800);
      const dateStr = it.pubDate || it.published || it.updated || it["dc:date"] || null;
      const publishedAt = dateStr ? new Date(pickText(dateStr)) : null;
      return {
        title,
        link: typeof link === "string" ? link : "",
        summary,
        publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : null,
        source: name,
      };
    }).filter(it => it.title && it.link);
  } catch (err: any) {
    console.warn(`[news] ${name} falló: ${err.message}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAllAiFeeds(): Promise<RssItem[]> {
  const results = await Promise.all(AI_FEEDS.map(f => fetchFeed(f.name, f.url)));
  const flat = results.flat();
  // Ordenar por fecha desc, quitar duplicados por título
  const seen = new Set<string>();
  const deduped: RssItem[] = [];
  for (const item of flat.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))) {
    const key = item.title.toLowerCase().slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

export function filterLastWeek(items: RssItem[], now = new Date()): RssItem[] {
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return items.filter(it => !it.publishedAt || it.publishedAt.getTime() >= sevenDaysAgo);
}

export function weekOfMonday(date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Dom, 1=Lun
  const diff = (day === 0 ? -6 : 1 - day);
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
