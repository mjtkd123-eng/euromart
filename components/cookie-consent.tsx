"use client"

import { useEffect, useState } from "react"
import { Cookie } from "lucide-react"

const STORAGE_KEY = "cookie-consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 이미 선택한 사용자에게는 다시 노출하지 않음
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const decide = (value: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // 저장 실패 시에도 배너는 닫음
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="쿠키 사용 동의"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Cookie className="size-5" aria-hidden="true" />
          </span>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            이 웹사이트는 최상의 경험을 보장하기 위해 쿠키를 사용합니다. 계속 이용하시면 쿠키 사용에 동의하는 것으로
            간주됩니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={() => decide("declined")}
            className="rounded-lg bg-primary/90 px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary"
          >
            거부
          </button>
          <button
            onClick={() => decide("configured")}
            className="rounded-lg bg-primary/90 px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary"
          >
            구성
          </button>
          <button
            onClick={() => decide("accepted-all")}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-colors hover:brightness-95 sm:min-w-44"
          >
            모든 쿠키 허용
          </button>
        </div>
      </div>
    </div>
  )
}
