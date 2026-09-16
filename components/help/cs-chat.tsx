"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Bot, Headphones, Send, User } from "lucide-react"
import { useEuromart } from "@/lib/euromart-context"
import type { CsChatTurn, CsLang, QuickReplyId } from "@/lib/cs-types"

interface ChatMessage {
  id: string
  role: "bot" | "user"
  text: string
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function CsChat({ compact = false }: { compact?: boolean }) {
  const { lang, t } = useEuromart()
  const csLang: CsLang = lang
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [quick, setQuick] = useState<{ id: QuickReplyId; label: string }[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [escalate, setEscalate] = useState(false)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/cs/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: true, lang: csLang }),
    })
      .then((r) => r.json())
      .then((turn: CsChatTurn) => {
        if (cancelled) return
        setMessages([{ id: "welcome", role: "bot", text: turn.reply }])
        setQuick(turn.quickReplies)
      })
      .catch(() => {
        if (!cancelled) {
          setMessages([{ id: "welcome", role: "bot", text: t("csFallbackHello") }])
        }
      })
    return () => {
      cancelled = true
    }
    // Restart greeting when UI language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csLang])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" })
  }, [messages, busy])

  async function send(text: string, quickReplyId?: QuickReplyId) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setInput("")
    setBusy(true)
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: trimmed }])
    try {
      const res = await fetch("/api/cs/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          quickReplyId,
          lastOrderId,
          lang: csLang,
        }),
      })
      const turn = (await res.json()) as CsChatTurn & { error?: string }
      if (!res.ok || turn.error) {
        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: "bot", text: t("csSendError") },
        ])
        return
      }
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, role: "bot", text: turn.reply }])
      setQuick(turn.quickReplies)
      setEscalate(Boolean(turn.escalate))
      if (turn.lastOrderId !== undefined) setLastOrderId(turn.lastOrderId)
    } catch {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: "bot", text: t("csSendError") }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-card ${
        compact ? "h-[min(28rem,70vh)]" : "min-h-[28rem] sm:min-h-[32rem]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="size-4" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold">{t("csTitle")}</p>
            <p className="text-[11px] text-muted-foreground">{t("csSubtitle")}</p>
          </div>
        </div>
        <Link
          href="/help/contact#human-agent"
          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
        >
          <Headphones className="size-3.5" aria-hidden="true" />
          {t("csHumanShort")}
        </Link>
      </div>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "bot" && (
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-3.5" aria-hidden="true" />
              </span>
            )}
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted text-foreground"
              }`}
            >
              {renderBold(m.text)}
            </div>
            {m.role === "user" && (
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                <User className="size-3.5" aria-hidden="true" />
              </span>
            )}
          </div>
        ))}
        {busy && <p className="pl-9 text-xs text-muted-foreground">{t("csTyping")}</p>}
      </div>

      {escalate && (
        <div className="border-t border-border bg-primary/5 px-4 py-2.5">
          <Link
            href="/help/contact#human-agent"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Headphones className="size-4" aria-hidden="true" />
            {t("csHuman")}
          </Link>
        </div>
      )}

      {quick.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
          {quick.map((q) => (
            <button
              key={q.id}
              type="button"
              disabled={busy}
              onClick={() => send(q.label, q.id)}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
      >
        <label htmlFor="cs-chat-input" className="sr-only">
          {t("csInputLabel")}
        </label>
        <input
          id="cs-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("csPlaceholder")}
          className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          aria-label={t("csSend")}
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
