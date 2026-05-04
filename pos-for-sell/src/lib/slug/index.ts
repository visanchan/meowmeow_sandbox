// URL-slug generator. ASCII-folds, lowercases, strips diacritics, replaces
// non-alnum runs with single dashes, trims dashes from edges, clamps length.

export type SlugOpts = { maxLength?: number; fallback?: string };

export function generateSlug(input: string, opts: SlugOpts = {}): string {
  const max = opts.maxLength ?? 60;
  const fallback = opts.fallback ?? "brand";

  const ascii = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");

  const slug = ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/^-+|-+$/g, ""); // re-trim after slice

  return slug || fallback;
}

/** Returns base + numbered fallbacks ("brand", "brand-2", "brand-3", ...). */
export function generateSlugCandidates(input: string, count: number = 5): string[] {
  const base = generateSlug(input);
  const out = [base];
  let i = 2;
  while (out.length < count) {
    out.push(`${base}-${i++}`);
  }
  return out;
}
