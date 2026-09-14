import type { Lang } from "./i18n"

/** Help Center copy — Korean plus English; other UI languages fall back to English. */
export type HelpCopy = { ko: string; en: string }

export function helpText(copy: HelpCopy, lang: Lang): string {
  return lang === "ko" ? copy.ko : copy.en
}
