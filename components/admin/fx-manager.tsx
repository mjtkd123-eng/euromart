"use client"

import { useState, useTransition } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormNotice } from "@/components/vendor/form-notice"
import { upsertFxRate } from "@/app/actions/admin"
import type { AdminFxRate } from "@/lib/admin-server"

export function FxManager({ rates }: { rates: AdminFxRate[] }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [newRate, setNewRate] = useState({ base: rates[0]?.base ?? "EUR", quote: "", rate: "" })
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const key = (r: AdminFxRate) => `${r.base}/${r.quote}`

  function saveExisting(r: AdminFxRate) {
    const raw = drafts[key(r)]
    if (raw === undefined) return
    setNotice(null)
    startTransition(async () => {
      const res = await upsertFxRate({ base: r.base, quote: r.quote, rate: Number(raw) })
      if (res.ok) {
        setNotice({ tone: "success", text: `${key(r)} 환율이 갱신되었습니다.` })
        setDrafts((d) => {
          const next = { ...d }
          delete next[key(r)]
          return next
        })
      } else {
        setNotice({ tone: "error", text: res.error ?? "갱신에 실패했습니다." })
      }
    })
  }

  function refreshFromEcb() {
    setNotice(null)
    setRefreshing(true)
    void (async () => {
      try {
        const res = await fetch("/api/fx/refresh", { method: "POST" })
        const json = (await res.json()) as {
          ok: boolean
          updated?: number
          source?: string
          date?: string | null
          error?: string
          skipped?: string[]
        }
        if (json.ok) {
          const parts = [`${json.updated}개 통화를 갱신했습니다.`]
          if (json.date) parts.push(`ECB 기준일 ${json.date}.`)
          if (json.skipped?.length) parts.push(`미지원 통화 유지: ${json.skipped.join(", ")}.`)
          setNotice({ tone: "success", text: parts.join(" ") })
          router.refresh()
        } else {
          setNotice({
            tone: "error",
            text: json.error ?? "환율 갱신에 실패했습니다. 기존 값이 유지됩니다.",
          })
        }
      } catch {
        setNotice({ tone: "error", text: "환율 갱신 요청에 실패했습니다." })
      } finally {
        setRefreshing(false)
      }
    })()
  }

  function addRate() {
    setNotice(null)
    startTransition(async () => {
      const res = await upsertFxRate({
        base: newRate.base,
        quote: newRate.quote,
        rate: Number(newRate.rate),
      })
      if (res.ok) {
        setNotice({ tone: "success", text: "환율이 추가되었습니다." })
        setNewRate({ base: "KRW", quote: "", rate: "" })
      } else {
        setNotice({ tone: "error", text: res.error ?? "추가에 실패했습니다." })
      }
    })
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        각 매장은 현지 통화로 가격을 직접 설정하므로, 환율은 지역 간 가격 비교용 참고 지표로 사용됩니다.
      </p>

      {notice && <FormNotice tone={notice.tone}>{notice.text}</FormNotice>}

      <ul className="flex flex-col gap-2">
        {rates.map((r) => {
          const k = key(r)
          const dirty = drafts[k] !== undefined && Number(drafts[k]) !== r.rate
          return (
            <li
              key={k}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card p-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold text-foreground">
                  {r.base} → {r.quote}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.updatedAt
                    ? `${new Date(r.updatedAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })} 갱신`
                    : "갱신 기록 없음"}
                </p>
              </div>

              <Input
                type="number"
                step="any"
                min={0}
                aria-label={`${k} 환율`}
                value={drafts[k] ?? String(r.rate)}
                onChange={(e) => setDrafts({ ...drafts, [k]: e.target.value })}
                className="h-9 w-32 font-mono tabular-nums"
              />
              <Button
                size="sm"
                variant={dirty ? "default" : "outline"}
                disabled={pending || !dirty}
                onClick={() => saveExisting(r)}
                className="text-xs"
              >
                저장
              </Button>
            </li>
          )
        })}
      </ul>

      <div className="rounded-xl border border-dashed border-border bg-card p-4">
        <p className="text-sm font-bold text-foreground">환율 추가</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <div className="grid gap-1.5">
            <Label className="text-xs">기준</Label>
            <Input
              value={newRate.base}
              maxLength={3}
              className="uppercase"
              onChange={(e) => setNewRate({ ...newRate, base: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">대상</Label>
            <Input
              value={newRate.quote}
              maxLength={3}
              placeholder="PLN"
              className="uppercase"
              onChange={(e) => setNewRate({ ...newRate, quote: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">환율</Label>
            <Input
              type="number"
              step="any"
              min={0}
              placeholder="0.0031"
              value={newRate.rate}
              onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button
              size="sm"
              onClick={addRate}
              disabled={pending || !newRate.quote || !newRate.rate}
              className="w-full rounded-full"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              추가
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
