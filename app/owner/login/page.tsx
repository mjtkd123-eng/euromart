import { PortalLoginForm } from "@/components/auth/portal-login-form"
import { DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD } from "@/lib/demo-admin-public"

export default function OwnerLoginPage() {
  return (
    <PortalLoginForm
      portal="owner"
      title="업주 파트너 로그인"
      subtitle="마트 업주 전용입니다. 일반 회원·플랫폼 관리자 로그인과 완전히 분리되어 있습니다."
      demoHint={`데모 업주 (비엔나 1호점만)\n${DEMO_OWNER_EMAIL} / ${DEMO_OWNER_PASSWORD}`}
      signupHref="/owner"
      signupLabel="입점 안내 · 신청"
      otherPortals={[
        { href: "/auth/login", label: "일반 회원 로그인" },
        { href: "/admin/login", label: "플랫폼 관리자 로그인" },
      ]}
    />
  )
}
