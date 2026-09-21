"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth/auth-shell"

const CITIES = [
  { slug: "vienna", label: "Vienna · 비엔나" },
  { slug: "budapest", label: "Budapest · 부다페스트" },
  { slug: "berlin", label: "Berlin · 베를린" },
  { slug: "paris", label: "Paris · 파리" },
  { slug: "prague", label: "Prague · 프라하" },
]

export default function OwnerSignupPage() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    repeat: "",
    storeName: "",
    legalName: "",
    businessNumber: "",
    citySlug: "vienna",
    address: "",
    phone: "",
    documentsNote: "",
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.repeat) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }
    setBusy(true)
    setError(null)
    const res = await fetch("/api/auth/owner/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? "입점 신청에 실패했습니다.")
      return
    }
    router.push(data.redirectTo ?? "/owner/pending")
  }

  return (
    <AuthShell
      wide
      title="업주 입점 신청"
      subtitle="사업자 정보를 제출하면 본부 승인 전까지 pending 상태입니다. 승인 후에만 매장 대시보드에 들어갈 수 있습니다."
    >
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="담당자 이름" id="fullName">
            <Input id="fullName" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className="h-11" />
          </Field>
          <Field label="이메일" id="email">
            <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className="h-11" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="비밀번호" id="password">
            <Input
              id="password"
              type="password"
              required
              minLength={10}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="h-11"
            />
          </Field>
          <Field label="비밀번호 확인" id="repeat">
            <Input
              id="repeat"
              type="password"
              required
              value={form.repeat}
              onChange={(e) => set("repeat", e.target.value)}
              className="h-11"
            />
          </Field>
        </div>
        <p className="text-[11px] text-muted-foreground">비밀번호는 10자 이상, 영문 대·소문자와 숫자를 포함해야 합니다.</p>
        <Field label="매장명" id="storeName">
          <Input id="storeName" required value={form.storeName} onChange={(e) => set("storeName", e.target.value)} className="h-11" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="상호 / 법인명" id="legalName">
            <Input id="legalName" required value={form.legalName} onChange={(e) => set("legalName", e.target.value)} className="h-11" />
          </Field>
          <Field label="사업자등록번호" id="businessNumber">
            <Input
              id="businessNumber"
              required
              value={form.businessNumber}
              onChange={(e) => set("businessNumber", e.target.value)}
              className="h-11"
              placeholder="ATU-12345678"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="도시" id="citySlug">
            <select
              id="citySlug"
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={form.citySlug}
              onChange={(e) => set("citySlug", e.target.value)}
            >
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="연락처" id="phone">
            <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-11" />
          </Field>
        </div>
        <Field label="매장 주소" id="address">
          <Input id="address" required value={form.address} onChange={(e) => set("address", e.target.value)} className="h-11" />
        </Field>
        <Field label="서류 · 메모" id="documentsNote">
          <Input
            id="documentsNote"
            value={form.documentsNote}
            onChange={(e) => set("documentsNote", e.target.value)}
            className="h-11"
            placeholder="사업자등록증, PL 보험 증서 제출 예정"
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="h-11 w-full rounded-full text-base" disabled={busy}>
          {busy ? "제출 중…" : "입점 신청 제출"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link href="/owner/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          업주 로그인
        </Link>
      </p>
    </AuthShell>
  )
}

function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
