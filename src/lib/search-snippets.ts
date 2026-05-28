function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function shouldUsePhraseSearch(query: string, exact = false) {
  const cleaned = normalizeWhitespace(query);
  if (!cleaned) return false;
  return exact || cleaned.includes(" ");
}

export function getSearchTerms(query: string, exact = false) {
  const cleaned = normalizeWhitespace(query);
  if (!cleaned) return [];
  return shouldUsePhraseSearch(cleaned, exact) ? [cleaned] : Array.from(new Set(cleaned.split(/\s+/).filter(Boolean)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findFirstMatchIndex(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  const indexes = terms
    .map((term) => lower.indexOf(term.toLowerCase()))
    .filter((index) => index >= 0);
  return indexes.length ? Math.min(...indexes) : -1;
}

export function buildSentenceSnippet(text: string, query: string, exact = false) {
  const normalized = normalizeWhitespace(text);
  const terms = getSearchTerms(query, exact);
  if (!normalized || !terms.length) return normalized;

  const firstMatch = findFirstMatchIndex(normalized, terms);
  if (firstMatch < 0) return normalized;

  const sentenceStart = Math.max(
    normalized.lastIndexOf(". ", firstMatch),
    normalized.lastIndexOf("! ", firstMatch),
    normalized.lastIndexOf("? ", firstMatch),
  );
  const sentenceEndCandidates = [
    normalized.indexOf(". ", firstMatch),
    normalized.indexOf("! ", firstMatch),
    normalized.indexOf("? ", firstMatch),
  ].filter((index) => index >= 0);
  const sentenceEnd = sentenceEndCandidates.length ? Math.min(...sentenceEndCandidates) + 1 : -1;

  let start = sentenceStart >= 0 ? sentenceStart + 2 : Math.max(0, firstMatch - 90);
  let end = sentenceEnd >= 0 ? sentenceEnd : Math.min(normalized.length, firstMatch + 180);

  if (sentenceStart < 0) {
    const nextSpace = normalized.indexOf(" ", start);
    if (nextSpace > 0 && nextSpace - start < 12) start = nextSpace + 1;
  }

  if (sentenceEnd < 0) {
    const previousSpace = normalized.lastIndexOf(" ", end);
    if (previousSpace > firstMatch) end = previousSpace;
  }

  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalized.length ? "..." : "";
  return `${prefix}${normalized.slice(start, end).trim()}${suffix}`;
}

export function getHighlightRegex(query: string, exact = false) {
  const terms = getSearchTerms(query, exact).sort((a, b) => b.length - a.length);
  if (!terms.length) return null;
  return new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
}
