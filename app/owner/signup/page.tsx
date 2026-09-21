"use client"

import Link from "next/link"
import { AuthShell } from "@/components/auth/auth-shell"
import { OwnerApplyForm } from "@/components/owner/owner-apply-form"

export default function OwnerSignupPage() {
  return (
    <AuthShell
      wide
      title="업주 입점 신청"
      subtitle="사업자 정보를 제출하면 본부 승인 전까지 pending 상태입니다. 승인 후에만 매장 대시보드에 들어갈 수 있습니다."
    >
      <OwnerApplyForm />
      <p className="mt-5 text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link href="/owner/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          업주 로그인
        </Link>
      </p>
    </AuthShell>
  )
}
