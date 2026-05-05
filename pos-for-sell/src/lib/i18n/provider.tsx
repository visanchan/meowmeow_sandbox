"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Lang } from "./types";
import { dictionaries, type Dict } from "./dictionaries";

type Ctx = { lang: Lang; t: Dict };

const LangContext = createContext<Ctx | null>(null);

export function LangProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  const value: Ctx = { lang, t: dictionaries[lang] };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useT(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useT must be used inside <LangProvider>");
  return ctx;
}
