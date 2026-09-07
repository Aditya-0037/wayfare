const LIST_LINE = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/;

export class NotStructuredError extends Error {}

/**
 * niche only handles markdown-style list input (bullet or numbered lines). Anything else
 * is outside its domain and it fails loudly rather than guessing at a summary.
 */
export function extractListItems(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const items = lines
    .map((line) => line.match(LIST_LINE)?.[1]?.trim())
    .filter((item): item is string => Boolean(item));

  if (items.length < 2) {
    throw new NotStructuredError(
      "niche only summarizes markdown-style lists (lines starting with -, *, or a number). " +
        "This input doesn't look like a list — try swift or deep instead.",
    );
  }
  return items;
}
