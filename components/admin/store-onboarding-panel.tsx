"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormNotice } from "@/components/vendor/form-notice"
import { Building2, KeyRound, Mail, ShieldCheck } from "lucide-react"

type Application = {
  id: string
  storeName: string
  legalName: string
  businessNumber: string
  citySlug: string
  contactEmail: string
  contactName: string
  documentsNote: string
  status: string
  rejectionReason: string | null
}

type StoreRow = {
  id: string
  name: string
  businessNumber: string
  status: string
  ownerUserId: string
  citySlug: string
}

type OwnerRow = {
  id: string
  email: string
  fullName: string
  storeId: string | null
  mustChangePassword: boolean
}

type Issued = {
  email: string
  temporaryPassword: string
  inviteUrl: string
  storeId: string
}

export function StoreOnboardingPanel() {
  const [applications, setApplications] = useState<Application[]>([])
  const [stores, setStores] = useState<StoreRow[]>([])
  const [owners, setOwners] = useState<OwnerRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [issued, setIssued] = useState<Issued | null>(null)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    storeName: "",
    legalName: "",
    businessNumber: "",
    citySlug: "budapest",
    address: "",
    ownerEmail: "",
    ownerName: "",
    applicationId: "" as string | "",
  })

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/stores")
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "목록을 불러오지 못했습니다.")
      return
    }
    setApplications(data.applications ?? [])
    setStores(data.stores ?? [])
    setOwners(data.owners ?? [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function fillFrom(app: Application) {
    setForm({
      storeName: app.storeName,
      legalName: app.legalName,
      businessNumber: app.businessNumber,
      citySlug: app.citySlug,
      address: "",
      ownerEmail: app.contactEmail,
      ownerName: app.contactName,
      applicationId: app.id,
    })
    setIssued(null)
    setOk("서류 내용을 발급 폼에 채웠습니다. 검토 후 계정을 발급하세요.")
    setError(null)
  }

  async function reject(id: string) {
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/admin/applications/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "서류 미비" }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "반려 실패")
      return
    }
    setOk("서류를 반려했습니다.")
    await load()
  }

  async function issue(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setIssued(null)
    const res = await fetch("/api/admin/stores/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        applicationId: form.applicationId || null,
      }),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "발급 실패")
      return
    }
    setIssued({
      email: data.email,
      temporaryPassword: data.temporaryPassword,
      inviteUrl: data.inviteUrl,
      storeId: data.storeId,
    })
    setOk(data.notice)
    setForm({
      storeName: "",
      legalName: "",
      businessNumber: "",
      citySlug: "budapest",
      address: "",
      ownerEmail: "",
      ownerName: "",
      applicationId: "",
    })
    await load()
  }

  const pending = applications.filter((a) => a.status === "submitted" || a.status === "under_review")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          업주는 셀프 가입할 수 없습니다. 오프라인 서류를 검토한 뒤 여기서 매장과 업주 계정을 만듭니다.
          임시 비밀번호는 <strong>지금 한 번만</strong> 보이며, 저장소에는 bcrypt 해시만 남습니다.
        </p>
      </div>

      {error && <FormNotice tone="error">{error}</FormNotice>}
      {ok && <FormNotice tone="success">{ok}</FormNotice>}

      {issued && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
          <p className="flex items-center gap-2 text-sm font-bold">
            <KeyRound className="size-4" aria-hidden="true" />
            오프라인 인계용 임시 비밀번호 (재조회 불가)
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">업주 이메일</dt>
              <dd className="font-mono">{issued.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">임시 비밀번호</dt>
              <dd className="font-mono text-base font-bold">{issued.temporaryPassword}</dd>
            </div>
          </dl>
          <p className="mt-3 break-all text-xs text-muted-foreground">설정 링크: {issued.inviteUrl}</p>
        </div>
      )}

      <section>
        <h2 className="text-base font-bold">대기 중인 입점 서류</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {pending.length === 0 && (
            <li className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              심사 대기 서류가 없습니다.
            </li>
          )}
          {pending.map((app) => (
            <li key={app.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{app.storeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.legalName} · {app.businessNumber} · {app.citySlug}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {app.contactName} · {app.contactEmail}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{app.documentsNote}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void reject(app.id)}>
                    반려
                  </Button>
                  <Button type="button" size="sm" disabled={busy} onClick={() => fillFrom(app)}>
                    검토 후 발급
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-bold">매장 + 업주 계정 발급</h2>
        <form onSubmit={(e) => void issue(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="storeName">매장명</Label>
            <Input id="storeName" required value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="legalName">상호 (법인명)</Label>
            <Input id="legalName" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz">사업자등록번호</Label>
            <Input id="biz" required value={form.businessNumber} onChange={(e) => setForm({ ...form, businessNumber: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">도시 슬러그</Label>
            <Input id="city" value={form.citySlug} onChange={(e) => setForm({ ...form, citySlug: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="addr">주소</Label>
            <Input id="addr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ownerName">업주 이름</Label>
            <Input id="ownerName" required value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ownerEmail">업주 이메일</Label>
            <Input id="ownerEmail" type="email" required value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy} className="h-10">
              {busy ? "발급 중…" : "계정 발급 · 안내 메일 생성"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Building2 className="size-4" aria-hidden="true" />
          발급된 매장
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {stores.length === 0 && (
            <li className="text-sm text-muted-foreground">아직 발급된 매장이 없습니다.</li>
          )}
          {stores.map((s) => {
            const owner = owners.find((o) => o.id === s.ownerUserId)
            return (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.businessNumber} · {owner?.email ?? "—"}
                    {owner?.mustChangePassword ? " · 최초 로그인 대기" : ""}
                  </p>
                </div>
                <Badge variant="secondary">{s.status}</Badge>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="size-3.5" aria-hidden="true" />
          비밀번호 컬럼은 없습니다. 소유자 목록에도 해시·평문이 노출되지 않습니다.
        </p>
      </section>
    </div>
  )
}
