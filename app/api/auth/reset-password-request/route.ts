import { jsonError, jsonOk } from "@/lib/api"
import { requestPasswordReset } from "@/lib/tenant-auth"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { email?: string }
  try {
    body = (await request.json()) as { email?: string }
  } catch {
    return jsonError("Invalid JSON")
  }

  const email = body.email?.trim() ?? ""
  if (!email) return jsonError("이메일을 입력하세요.")

  const origin = new URL(request.url).origin
  await requestPasswordReset(email, origin)
  // Do not reveal whether the email exists.
  return jsonOk({
    ok: true,
    message: "해당 이메일이 업주 계정으로 등록되어 있으면 재설정 안내를 보냈습니다.",
  })
}
