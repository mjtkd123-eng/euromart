"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, Clock, Languages, MessageCircle, Bot, CheckCircle2, Send } from "lucide-react"
import { CONTACT, INQUIRY_TOPICS } from "@/lib/help-center"

export function ContactView() {
  const [submitted, setSubmitted] = useState(false)
  const [topic, setTopic] = useState(INQUIRY_TOPICS[0].value)
  const [email, setEmail] = useState("")
  const [order, setOrder] = useState("")
  const [message, setMessage] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !message.trim()) return
    // 실제 접수(1:1 게시판/티켓) 연동은 이후 단계에서 연결됩니다.
    setSubmitted(true)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* 1:1 문의 폼 */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-bold">1:1 문의 남기기</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          문의 유형과 내용을 남겨 주시면 순차적으로 답변드립니다. {CONTACT.responseTime}
        </p>

        {submitted ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-6 py-10 text-center">
            <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
            <p className="text-sm font-bold text-foreground">문의가 접수되었습니다</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              입력하신 이메일({email})로 답변드리겠습니다. 확인을 위해 주문번호를 함께 남겨 주시면 처리가 빨라집니다.
            </p>
            <button
              onClick={() => {
                setSubmitted(false)
                setMessage("")
                setOrder("")
              }}
              className="mt-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
            >
              새 문의 작성
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="topic" className="text-sm font-medium">
                문의 유형
              </label>
              <select
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {INQUIRY_TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  이메일 <span className="text-destructive">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="답변 받을 이메일"
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="order" className="text-sm font-medium">
                  주문번호 <span className="text-muted-foreground">(선택)</span>
                </label>
                <input
                  id="order"
                  type="text"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  placeholder="예: KEM-20260825-0001"
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-sm font-medium">
                문의 내용 <span className="text-destructive">*</span>
              </label>
              <textarea
                id="message"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="문의하실 내용을 자세히 적어 주세요. 파손·변질 상품은 사진을 준비해 주시면 처리가 빨라집니다."
                className="resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Send className="size-4" aria-hidden="true" />
              문의 접수
            </button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              제출하신 정보는 문의 응대 목적으로만 사용되며, 개인정보 처리방침에 따라 처리됩니다.
            </p>
          </form>
        )}
      </section>

      {/* 상담 채널 안내 */}
      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Bot className="size-5 text-primary" aria-hidden="true" />
            실시간 챗봇 상담
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            배송·결제·환불 등 자주 묻는 질문은 챗봇이 즉시 안내합니다. 해결이 어려우면 상담원 연결로 이어집니다.
          </p>
          <Link
            href="/help/faq"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            자주 묻는 질문 보기
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="text-base font-bold">고객센터 안내</h2>
          <ul className="mt-3 flex flex-col gap-3 text-sm">
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium text-foreground">이메일</p>
                <p className="text-muted-foreground">{CONTACT.email}</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium text-foreground">상담 시간</p>
                <p className="text-muted-foreground">{CONTACT.hours}</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Languages className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-medium text-foreground">지원 언어</p>
                <p className="text-muted-foreground">{CONTACT.languages}</p>
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
