"use server";

import { cookies } from "next/headers";
import { LANG_COOKIE, isValidLang } from "./types";

export async function setLangAction(next: string): Promise<void> {
  if (!isValidLang(next)) return;
  const c = await cookies();
  c.set(LANG_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false, // accessible to JS so the client switcher feels instant
  });
}
