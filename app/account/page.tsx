import { redirect } from "next/navigation"
import { getSessionProfile, homePathForRole } from "@/lib/auth"

export const dynamic = "force-dynamic"

// 로그인 후 역할에 맞는 화면으로 라우팅합니다.
export default async function AccountRouter() {
  const profile = await getSessionProfile()
  if (!profile) redirect("/auth/login")
  redirect(homePathForRole(profile.role))
}
