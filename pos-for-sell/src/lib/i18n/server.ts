import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, isValidLang, LANG_COOKIE, type Lang } from "./types";
import { dictionaries, type Dict } from "./dictionaries";

export async function getLang(): Promise<Lang> {
  const c = await cookies();
  const v = c.get(LANG_COOKIE)?.value;
  return isValidLang(v) ? v : DEFAULT_LANG;
}

export async function getDict(): Promise<{ lang: Lang; t: Dict }> {
  const lang = await getLang();
  return { lang, t: dictionaries[lang] };
}
