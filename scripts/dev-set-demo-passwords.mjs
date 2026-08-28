// 개발 전용: 데모 계정에 알려진 비밀번호를 설정해 로컬 테스트를 가능하게 합니다.
import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("[v0] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
const PASSWORD = "euromart123!"
const emails = ["admin@keuromart.com", "customer@keuromart.com", "berlin@keuromart.com", "budapest@keuromart.com"]

const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
if (error) {
  console.error("[v0] listUsers error", error.message)
  process.exit(1)
}

for (const email of emails) {
  const user = data.users.find((u) => u.email === email)
  if (!user) {
    console.log("[v0] not found:", email)
    continue
  }
  const { error: uErr } = await admin.auth.admin.updateUserById(user.id, {
    password: PASSWORD,
    email_confirm: true,
  })
  console.log(uErr ? `[v0] FAIL ${email}: ${uErr.message}` : `[v0] OK ${email}`)
}
console.log("[v0] done. password =", PASSWORD)
