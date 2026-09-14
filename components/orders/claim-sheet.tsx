"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CalendarX, ImagePlus, Loader2, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { fileClaim } from "@/app/actions/claims"
import { formatMoney } from "@/lib/format"
import type { ClaimReason } from "@/lib/claims-types"

export interface ClaimTarget {
  orderId: string
  orderItemId: string | null
  label: string
  amount: number
  currencyCode: string
}

interface LocalFile {
  file: File
  previewUrl: string
}

const REASONS: { value: ClaimReason; title: string; sub: string; Icon: typeof CalendarX }[] = [
  { value: "expired", title: "유통기한 경과", sub: "Expired product", Icon: CalendarX },
  { value: "spoiled", title: "변질 · 파손", sub: "Spoiled or damaged", Icon: AlertTriangle },
]

const MAX_FILES = 5
const MAX_BYTES = 5 * 1024 * 1024

export function ClaimSheet({
  target,
  userId,
  onClose,
}: {
  target: ClaimTarget | null
  userId: string
  onClose: () => void
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [reason, setReason] = useState<ClaimReason | null>(null)
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<LocalFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = target !== null

  function reset() {
    setReason(null)
    setDescription("")
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    setFiles([])
    setSubmitting(false)
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next && !submitting) {
      reset()
      onClose()
    }
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const picked = Array.from(e.target.files ?? [])
    const next: LocalFile[] = []
    for (const file of picked) {
      if (!file.type.startsWith("image/")) {
        setError("이미지 파일만 첨부할 수 있습니다.")
        continue
      }
      if (file.size > MAX_BYTES) {
        setError("사진당 최대 5MB까지 첨부할 수 있습니다.")
        continue
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) })
    }
    setFiles((prev) => [...prev, ...next].slice(0, MAX_FILES))
    if (fileRef.current) fileRef.current.value = ""
  }

  function removeFile(idx: number) {
    setFiles((prev) => {
      const copy = [...prev]
      const [removed] = copy.splice(idx, 1)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return copy
    })
  }

  async function handleSubmit() {
    if (!target || !reason) {
      setError("신고 사유를 선택해 주세요.")
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const paths: string[] = []

      // 증빙 사진을 <uid>/<claim-random>/... 경로로 업로드
      const folder = `${userId}/${crypto.randomUUID()}`
      for (const { file } of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
        const path = `${folder}/${crypto.randomUUID()}-${safeName}`
        const { error: upErr } = await supabase.storage.from("claim-evidence").upload(path, file, {
          contentType: file.type,
          upsert: false,
        })
        if (upErr) {
          console.log("[v0] evidence upload error:", upErr.message)
          setError("사진 업로드에 실패했습니다. 다시 시도해 주세요.")
          setSubmitting(false)
          return
        }
        paths.push(path)
      }

      const res = await fileClaim({
        orderId: target.orderId,
        orderItemId: target.orderItemId,
        reason,
        description,
        evidencePaths: paths,
      })

      if (!res.ok) {
        setError(res.error ?? "신고를 접수하지 못했습니다.")
        setSubmitting(false)
        return
      }

      reset()
      onClose()
      router.refresh()
    } catch (err) {
      console.log("[v0] claim submit exception:", (err as Error).message)
      setError("예기치 않은 오류가 발생했습니다.")
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md" showCloseButton={!submitting}>
        <SheetHeader className="border-b border-border">
          <SheetTitle>환불 신고 · Report a problem</SheetTitle>
          <SheetDescription>{target?.label}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-4">
          {target && (
            <div className="rounded-xl bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">예상 환불 금액 · Estimated refund</span>
              <span className="ml-2 font-bold tabular-nums">
                {formatMoney(target.amount, target.currencyCode)}
              </span>
            </div>
          )}

          <div>
            <Label className="mb-2 block text-sm font-semibold">신고 사유 · Reason</Label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map(({ value, title, sub, Icon }) => {
                const active = reason === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReason(value)}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                    aria-pressed={active}
                  >
                    <Icon className={`size-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">{title}</span>
                    <span className="text-xs text-muted-foreground">{sub}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="claim-desc" className="mb-2 block text-sm font-semibold">
              상세 설명 · Details <span className="font-normal text-muted-foreground">(선택)</span>
            </Label>
            <Textarea
              id="claim-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 문제가 있었는지 알려주세요."
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <Label className="mb-2 block text-sm font-semibold">
              증빙 사진 · Photo evidence{" "}
              <span className="font-normal text-muted-foreground">({files.length}/{MAX_FILES})</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {files.map((f, idx) => (
                <div key={f.previewUrl} className="relative size-20 overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.previewUrl || "/placeholder.svg"} alt="첨부 미리보기" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
                    aria-label="사진 삭제"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {files.length < MAX_FILES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <ImagePlus className="size-5" />
                  <span className="text-[10px]">사진 추가</span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPickFiles}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              유통기한 라벨이나 변질된 상태가 잘 보이도록 촬영해 주세요. 사진은 판매자·중재 관리자만 열람합니다.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">
              {error}
            </p>
          )}
        </div>

        <SheetFooter className="border-t border-border">
          <Button onClick={handleSubmit} disabled={submitting || !reason} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> 접수 중…
              </>
            ) : (
              "환불 신고 접수 · Submit"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            접수 후 판매자가 3영업일 이내 확인하며, 무응답 시 자동 환불됩니다.
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
