import { PortalLoginForm } from "@/components/auth/portal-login-form"
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/demo-admin-public"

export default function AdminLoginPage() {
  return (
    <PortalLoginForm
      portal="admin"
      title="플랫폼 관리자 로그인"
      subtitle="이 경로는 시드로 발급된 본부 계정만 사용할 수 있습니다. 공개 회원가입은 없습니다."
      demoHint={`데모 본부 관리자 (시드 전용)\n${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`}
      otherPortals={[
        { href: "/auth/login", label: "일반 회원 로그인" },
        { href: "/owner", label: "업주 로그인/신청" },
      ]}
    />
  )
}
