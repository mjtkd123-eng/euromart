import { jsonError, jsonOk } from "@/lib/api"
import { registerCustomer } from "@/lib/tenant-auth"
import { homePathForRole } from "@/lib/roles"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { email?: string; password?: string; fullName?: string }
  try {
    body = (await request.json()) as { email?: string; password?: string; fullName?: string }
  } catch {
    return jsonError("Invalid JSON")
  }

  const email = body.email?.trim() ?? ""
  const password = body.password ?? ""
  const fullName = body.fullName?.trim() ?? ""
  if (!email || !password || !fullName) return jsonError("이름, 이메일, 비밀번호를 모두 입력하세요.")

  const result = await registerCustomer({ email, password, fullName })
  if ("error" in result) return jsonError(result.error, 400)

  return jsonOk({
    ok: true,
    role: "customer",
    needsEmailConfirm: result.needsEmailConfirm,
    redirectTo: result.needsEmailConfirm ? "/auth/sign-up-success" : homePathForRole("customer"),
  })
}
