import Link from "next/link"
import { ShieldCheck, AlertTriangle, MessageCircle } from "lucide-react"
import { RETURNS_POLICY, CONTACT } from "@/lib/help-center"

export function ReturnsPolicyView() {
  return (
    <div className="flex flex-col gap-6">
      {/* EU 권리 요약 배너 */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          K-EuroMart는 <span className="font-semibold text-foreground">EU 소비자권리지침(2011/83/EU)</span>을 준수합니다.
          아래 안내는 이용자의 법정 권리를 보완하는 것으로, 소비자의 법적 권리를 제한하지 않습니다.
        </p>
      </div>

      {/* 정책 블록 */}
      <div className="flex flex-col gap-4">
        {RETURNS_POLICY.map((block, i) => (
          <section
            key={i}
            className={`rounded-2xl border p-5 ${
              block.emphasis ? "border-primary/40 bg-primary/5" : "border-border bg-card"
            }`}
          >
            <h2 className="flex items-center gap-2 text-base font-bold">
              {block.emphasis && (
                <AlertTriangle className="size-4 shrink-0 text-primary" aria-hidden="true" />
              )}
              {block.heading}
            </h2>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{block.body}</p>
            {block.points && (
              <ul className="mt-3 flex flex-col gap-2">
                {block.points.map((p, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* 접수 안내 */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold">환불·교환을 신청하시겠어요?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            주문번호와 상품 사진(파손·변질 시)을 준비해 1:1 문의로 접수하면 빠르게 도와드립니다.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">고객센터 {CONTACT.email} · {CONTACT.hours}</p>
        </div>
        <Link
          href="/help/contact"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          환불·교환 문의
        </Link>
      </div>
    </div>
  )
}
