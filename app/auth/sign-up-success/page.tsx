import Link from "next/link"
import { MailCheck } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <AuthShell title="가입을 확인해 주세요" subtitle="Check your inbox to confirm">
      <div className="flex flex-col items-center gap-4 text-center">
        <MailCheck className="size-14 text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground text-pretty">
          입력하신 이메일로 인증 링크를 보냈습니다. 링크를 클릭하여 가입을 완료한 뒤 로그인해 주세요.
        </p>
        <Button asChild className="mt-1 h-11 w-full rounded-full">
          <Link href="/auth/login">로그인하러 가기</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
