export type Lang = "en" | "th";

export const LANG_COOKIE = "pos-for-sell-lang";
export const DEFAULT_LANG: Lang = "en";

export function isValidLang(s: unknown): s is Lang {
  return s === "en" || s === "th";
}
