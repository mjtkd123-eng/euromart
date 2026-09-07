"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, Clock, Languages, MessageCircle, Bot, CheckCircle2, Send } from "lucide-react"
import { CONTACT, INQUIRY_TOPICS, helpText } from "@/lib/help-center"
import { useEuromart } from "@/lib/euromart-context"

export function ContactView() {
  const { lang, t } = useEuromart()
  const [submitted, setSubmitted] = useState(false)
  const [topic, setTopic] = useState(INQUIRY_TOPICS[0].value)
  const [email, setEmail] = useState("")
  const [order, setOrder] = useState("")
  const [message, setMessage] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !message.trim()) return
    setSubmitted(true)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold">{t("contactFormTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("contactFormDesc")} {helpText(CONTACT.responseTime, lang)}
        </p>

        {submitted ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-6 py-10 text-center">
            <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
            <p className="text-sm font-bold text-foreground">{t("inquiryReceived")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t("inquiryReceivedDesc", { email })}</p>
            <button
              onClick={() => {
                setSubmitted(false)
                setMessage("")
                setOrder("")
              }}
              className="mt-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
            >
              {t("newInquiry")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="topic" className="text-sm font-medium">
                {t("inquiryTopic")}
              </label>
              <select
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {INQUIRY_TOPICS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {helpText(item.label, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  {t("emailLabel")} <span className="text-destructive">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="order" className="text-sm font-medium">
                  {t("orderNumber")} <span className="text-muted-foreground">{t("optional")}</span>
                </label>
                <input
                  id="order"
                  type="text"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  placeholder={t("orderPlaceholder")}
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-sm font-medium">
                {t("messageLabel")} <span className="text-destructive">*</span>
              </label>
              <textarea
                id="message"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder={t("messagePlaceholder")}
                className="resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Send className="size-4" aria-hidden="true" />
              {t("submitInquiry")}
            </button>
            <p className="text-xs leading-relaxed text-muted-foreground">{t("contactPrivacyNote")}</p>
          </form>
        )}
      </section>

      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Bot className="size-5 text-primary" aria-hidden="true" />
            {t("chatbotTitle")}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("chatbotDesc")}</p>
          <Link
            href="/help/faq"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            {t("viewFaq")}
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="text-base font-bold">{t("supportInfo")}</h2>
          <ul className="mt-3 flex flex-col gap-3 text-sm">
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium text-foreground">{t("email")}</p>
                <p className="text-muted-foreground">{CONTACT.email}</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium text-foreground">{t("supportHours")}</p>
                <p className="text-muted-foreground">{helpText(CONTACT.hours, lang)}</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Languages className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium text-foreground">{t("supportLanguages")}</p>
                <p className="text-muted-foreground">{CONTACT.languages}</p>
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
