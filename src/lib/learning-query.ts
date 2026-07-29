export function normalizeLearningQuery(value: string) {
  return value
    .trim()
    .replace(/^i\s+want\s+to\s+learn(?:\s+about)?\s+/i, "")
    .trim();
}
