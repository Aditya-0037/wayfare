const SENTENCE_SPLIT = /(?<=[.!?])\s+/;
const WORD_SPLIT = /[^a-z0-9']+/i;
const STOPWORDS = new Set(
  "a an the and or but if then else for of to in on at by with from as is are was were be been being this that these those it its it's not no do does did have has had will would could should can may might i you he she we they".split(
    " ",
  ),
);

function wordsOf(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .split(WORD_SPLIT)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * Frequency-based extractive summarization (Luhn-style): score each sentence by the combined
 * document-wide frequency of its significant words, normalized by length so long sentences
 * don't win purely on word count, then keep the top-scoring sentences in their original order.
 */
export function deepSummary(text: string): string {
  const sentences = text.trim().split(SENTENCE_SPLIT).filter(Boolean);
  if (sentences.length <= 2) return sentences.join(" ").trim();

  const frequency = new Map<string, number>();
  for (const sentence of sentences) {
    for (const word of wordsOf(sentence)) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }
  }

  const scored = sentences.map((sentence, index) => {
    const words = wordsOf(sentence);
    const score = words.reduce((sum, w) => sum + (frequency.get(w) ?? 0), 0) / Math.max(words.length, 1);
    return { index, sentence, score };
  });

  const keepCount = Math.min(Math.max(Math.round(sentences.length * 0.3), 2), 8);
  const kept = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, keepCount)
    .sort((a, b) => a.index - b.index);

  return kept.map((s) => s.sentence).join(" ");
}
