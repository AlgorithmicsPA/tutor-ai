import { AVAILABLE_TOPICS } from "@shared/schema";

const TOPIC_KEYWORDS: Record<string, string[]> = {
  "modelos-generativos": ["gpt", "chatgpt", "claude", "gemini", "llama", "llm", "large language model", "generative", "transformer", "mistral", "deepseek", "grok"],
  "robotica": ["robot", "robotic", "humanoid", "boston dynamics", "tesla bot", "optimus", "figure ai"],
  "vision-artificial": ["image", "vision", "dall-e", "midjourney", "stable diffusion", "video generation", "sora", "veo", "flux"],
  "chatbots": ["chatbot", "assistant", "copilot", "alexa", "siri", "agent"],
  "ia-medicina": ["medic", "health", "drug", "cancer", "diagnos", "clinical", "biotech", "genome", "protein"],
  "ia-educacion": ["education", "student", "teach", "school", "tutor", "learning", "classroom"],
  "ia-juegos": ["game", "gaming", "npc", "minecraft", "nvidia ace"],
  "etica-ia": ["ethic", "bias", "safety", "alignment", "deepfake", "misinformation", "harm", "risk"],
  "open-source": ["open source", "open-source", "huggingface", "hugging face", "llama", "mistral", "apache", "mit license"],
  "empresas-ia": ["openai", "anthropic", "google deepmind", "meta ai", "microsoft", "xai", "perplexity", "mistral ai", "cohere"],
  "investigacion": ["paper", "research", "arxiv", "neurips", "icml", "iclr", "study", "benchmark"],
  "regulacion": ["regulation", "law", "eu ai act", "congress", "senate", "policy", "ftc", "lawsuit", "copyright"],
};

export function classifyTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const matches: string[] = [];
  for (const topic of AVAILABLE_TOPICS) {
    const keywords = TOPIC_KEYWORDS[topic] || [];
    if (keywords.some(kw => lower.includes(kw))) {
      matches.push(topic);
    }
  }
  return matches.length > 0 ? matches : ["investigacion"];
}

export function scoreNewsForUser(
  newsTopics: string[],
  userInterests: Array<{ topic: string; score: number }>,
): number {
  if (userInterests.length === 0) return 1; // sin intereses = todo igual
  let score = 0;
  for (const topic of newsTopics) {
    const match = userInterests.find(i => i.topic === topic);
    if (match) score += Math.max(1, match.score + 1);
  }
  return score;
}
