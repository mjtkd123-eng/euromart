import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  // URL의 error 값은 신뢰할 수 없으므로 에러 코드 형태일 때만 표시합니다.
  const code = params?.error
  const isErrorCode = typeof code === "string" && /^[a-z0-9_]{1,64}$/.test(code)

  return (
    <AuthShell title="문제가 발생했습니다" subtitle="Something went wrong">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="size-14 text-destructive" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          {isErrorCode ? `오류 코드: ${code}` : "알 수 없는 오류가 발생했습니다."}
        </p>
        <Link
          href="/auth/login"
          className={cn(buttonVariants({ variant: "secondary" }), "mt-1 h-11 w-full rounded-full")}
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </AuthShell>
  )
}
