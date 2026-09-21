import Link from "next/link"
import { Clock3 } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { getSessionProfile } from "@/lib/auth"
import { isOwnerRole } from "@/lib/roles"

export const dynamic = "force-dynamic"

export default async function OwnerPendingPage() {
  const profile = await getSessionProfile()
  const isPendingOwner = profile && isOwnerRole(profile.role) && profile.accountStatus === "pending"

  return (
    <AuthShell
      title="승인 대기 중"
      subtitle="입점 신청이 본부에 전달되었습니다. 관리자가 사업자 정보를 검토하기 전까지 매장 대시보드에 들어갈 수 없습니다."
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
          <Clock3 className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground">
          {isPendingOwner
            ? `${profile.email ?? "계정"} 상태는 pending 입니다.`
            : "신청 직후 또는 업주 로그인 후 이 화면이 표시됩니다."}
        </p>
        <div className="flex w-full flex-col gap-2">
          <Button asChild className="h-11 w-full rounded-full">
            <Link href="/owner/login">업주 로그인</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full rounded-full">
            <Link href="/">쇼핑몰로 돌아가기</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}
