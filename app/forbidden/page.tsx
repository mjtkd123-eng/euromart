import Link from "next/link"
import { ShieldOff } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const { from } = await searchParams
  const target = from?.startsWith("/") ? from : ""
  const ownerArea = target.startsWith("/owner") || target.startsWith("/vendor")
  const adminArea = target.startsWith("/admin")

  return (
    <AuthShell
      title="403 · 접근 권한이 없습니다"
      subtitle="로그인한 계정의 역할로는 이 영역에 들어갈 수 없습니다. 일반 회원, 업주, 플랫폼 관리자 포털은 서로 분리되어 있습니다."
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldOff className="size-6" aria-hidden="true" />
        </span>
        {target && <p className="break-all text-xs text-muted-foreground">{target}</p>}
        <div className="flex w-full flex-col gap-2">
          {ownerArea && (
            <Button asChild className="h-11 w-full rounded-full">
              <Link href="/owner/login">업주 로그인</Link>
            </Button>
          )}
          {adminArea && (
            <Button asChild className="h-11 w-full rounded-full">
              <Link href="/admin/login">관리자 로그인</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="h-11 w-full rounded-full">
            <Link href="/auth/login">일반 회원 로그인</Link>
          </Button>
          <Button asChild variant="ghost" className="h-10 w-full rounded-full">
            <Link href="/">쇼핑몰 홈</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}
