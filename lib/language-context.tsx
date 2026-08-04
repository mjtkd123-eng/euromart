"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { type Lang, type Dict, translations } from "./i18n"

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** 현재 언어의 UI 사전 */
  t: Dict
}

const LanguageContext = createContext<LanguageContextValue | null>(null)
const STORAGE_KEY = "budapest-mart-lang"

function isLang(v: unknown): v is Lang {
  return v === "KR" || v === "HU" || v === "EN"
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("KR")

  // localStorage 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (isLang(raw)) setLangState(raw)
    } catch {
      // ignore
    }
  }, [])

  function setLang(next: Lang) {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
    // <html lang> 속성도 갱신해 접근성/SEO에 반영
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "KR" ? "ko" : next === "HU" ? "hu" : "en"
    }
  }

  // 초기 lang 속성 동기화
  useEffect(() => {
    document.documentElement.lang = lang === "KR" ? "ko" : lang === "HU" ? "hu" : "en"
  }, [lang])

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: translations[lang] }),
    [lang],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}
