import { storage } from "../../storage";
import { fetchAllAiFeeds, filterLastWeek, weekOfMonday } from "./rss";
import { classifyTopics } from "./topics";

export async function runWeeklyFetch(): Promise<{ inserted: number; week: string }> {
  const week = weekOfMonday();
  const existing = await storage.getWeeklyNewsByWeek(week);
  if (existing.length >= 20) {
    console.log(`[news] Semana ${week} ya tiene ${existing.length} noticias, salteo`);
    return { inserted: 0, week };
  }

  const all = await fetchAllAiFeeds();
  const recent = filterLastWeek(all).slice(0, 40);

  const existingLinks = new Set(existing.map(n => n.link));
  let inserted = 0;

  for (const item of recent) {
    if (existingLinks.has(item.link)) continue;
    const topics = classifyTopics(`${item.title} ${item.summary}`);
    await storage.createWeeklyNews({
      weekOf: week,
      title: item.title,
      summary: item.summary,
      link: item.link,
      source: item.source,
      publishedAt: item.publishedAt ?? undefined,
      topics,
    });
    inserted++;
  }

  console.log(`[news] Semana ${week}: ${inserted} noticias nuevas insertadas`);
  return { inserted, week };
}
