const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

export function leadSummary(text: string, sentenceCount = 2): string {
  const sentences = text.trim().split(SENTENCE_SPLIT).filter(Boolean);
  return sentences.slice(0, sentenceCount).join(" ").trim();
}
