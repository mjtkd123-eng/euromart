"use client"

import { useEffect, useState } from "react"
import { detectLocale, translate, type Lang, type TransKey } from "./i18n"

/**
 * EuromartProvider 밖(인증 페이지 등)에서 사용하는 경량 번역 훅.
 *
 * 매장 컨텍스트가 없으므로 현지 언어("local")는 지원하지 않고,
 * 접속 위치·브라우저 언어 규칙에 따라 한국어 또는 영어만 판단합니다.
 * 서버 렌더 결과와 일치시키기 위해 첫 렌더는 항상 영어로 시작합니다.
 */
export function useDetectedLang() {
  const [lang, setLang] = useState<Lang>("en")

  useEffect(() => {
    const locale = detectLocale()
    setLang(locale === "ko" ? "ko" : "en")
  }, [])

  const t = (key: TransKey, params?: Record<string, string | number>) =>
    translate(key, lang, params)

  return { lang, t }
}
