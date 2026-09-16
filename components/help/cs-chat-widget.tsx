"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import { CsChat } from "@/components/help/cs-chat"
import { useEuromart } from "@/lib/euromart-context"

export function CsChatWidget() {
  const { t } = useEuromart()
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="pointer-events-auto w-[min(100vw-2rem,24rem)] shadow-2xl">
          <CsChat compact />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-xl hover:bg-primary/90"
        aria-expanded={open}
        aria-label={open ? t("csClose") : t("csOpen")}
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <MessageCircle className="size-5" aria-hidden="true" />}
        <span className="hidden sm:inline">{open ? t("csClose") : t("csOpen")}</span>
      </button>
    </div>
  )
}
