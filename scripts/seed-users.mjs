import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = "EuroMart!2026"

// Vendor scoping lives on regions.vendor_id — profiles has no region column.
const users = [
  { email: "admin@keuromart.com", fullName: "본사 관리자", role: "admin", regionId: null },
  { email: "budapest@keuromart.com", fullName: "부다페스트 점주", role: "vendor", regionId: "budapest" },
  { email: "berlin@keuromart.com", fullName: "베를린 점주", role: "vendor", regionId: "berlin" },
  { email: "customer@keuromart.com", fullName: "김손님", role: "customer", regionId: null },
]

const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })

for (const u of users) {
  const existing = list?.users?.find((x) => x.email === u.email)
  let userId = existing?.id

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    })
    if (error) {
      console.error(`[create failed] ${u.email}: ${error.message}`)
      continue
    }
    userId = data.user.id
    console.log(`[created] ${u.email}`)
  } else {
    await admin.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    })
    console.log(`[updated] ${u.email}`)
  }

  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: userId, email: u.email, full_name: u.fullName, role: u.role }, { onConflict: "id" })

  if (pErr) {
    console.error(`  -> profile failed: ${pErr.message}`)
    continue
  }

  if (u.regionId) {
    const { error: rErr } = await admin.from("regions").update({ vendor_id: userId }).eq("id", u.regionId)
    if (rErr) console.error(`  -> region link failed: ${rErr.message}`)
    else console.log(`  -> role=${u.role}, owns region "${u.regionId}"`)
  } else {
    console.log(`  -> role=${u.role}`)
  }
}

const { data: rows } = await admin
  .from("profiles")
  .select("email, role, regions(id, city)")
  .order("role")

console.log("\nAccounts (password for all: " + PASSWORD + ")")
console.table(
  (rows ?? []).map((r) => ({
    email: r.email,
    role: r.role,
    region: r.regions?.[0]?.city ?? "-",
  })),
)
