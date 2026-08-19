/**
 * Shared answer normalization helpers for quiz logic.
 *
 * These functions intentionally focus on Kurmanji Latin-script answers. They
 * tolerate common learner input differences (diacritics, punctuation, repeated
 * spaces, and slash/comma-separated variants) without changing the displayed
 * canonical answer.
 */

const VARIANT_SEPARATOR = /\s*(?:\/|,|;|\bor\b|\ban\b)\s*/i;

function normalizeQuizAnswer(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ç]/g, 'c')
    .replace(/[ê]/g, 'e')
    .replace(/[î]/g, 'i')
    .replace(/[ş]/g, 's')
    .replace(/[û]/g, 'u')
    .replace(/[’'`´]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAnswerVariants(answer: string): string[] {
  const cleaned = answer.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const variants = cleaned
    .split(VARIANT_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);

  return Array.from(new Set([cleaned, ...variants]));
}

export function getPrimaryAnswerVariant(answer: string): string {
  return getAnswerVariants(answer)[1] || getAnswerVariants(answer)[0] || answer.trim();
}

/** Damerau–Levenshtein distance capped at 2 (early exit) — small and fast. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1); // transposition
      }
    }
  }
  return dp[m][n];
}

export function isQuizAnswerAccepted(typed: string, correctAnswer: string): boolean {
  const normalizedTyped = normalizeQuizAnswer(typed);
  if (!normalizedTyped) return false;

  return getAnswerVariants(correctAnswer).some((variant) => {
    const normalizedVariant = normalizeQuizAnswer(variant);
    if (normalizedTyped === normalizedVariant) return true;

    // WRITING QUIZ fuzzy tolerance: one slipped/swapped letter is forgiven on
    // longer words (5+ chars after normalization) — but only past the first
    // letter, because Kurmanji has real minimal pairs that differ exactly
    // there (Bapîr/Dapîr, Bav/Nav). Short words stay fully strict.
    if (
      normalizedVariant.length >= 5 &&
      !normalizedVariant.includes(' ') &&
      normalizedTyped[0] === normalizedVariant[0]
    ) {
      return editDistance(normalizedTyped, normalizedVariant) <= 1;
    }
    return false;
  });
}

export function toLetterPuzzleAnswer(answer: string): string {
  return getPrimaryAnswerVariant(answer)
    .toLowerCase()
    .replace(/[^a-zçêîşû]/g, '');
}
