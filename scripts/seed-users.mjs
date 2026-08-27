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

const users = [
  {
    email: "admin@keuromart.com",
    password: "EuroMart!2026",
    fullName: "본사 관리자",
    role: "admin",
    regionId: null,
  },
  {
    email: "budapest@keuromart.com",
    password: "EuroMart!2026",
    fullName: "부다페스트 점주",
    role: "vendor",
    regionId: "budapest",
  },
  {
    email: "berlin@kueromart.com".replace("kueromart", "keuromart"),
    password: "EuroMart!2026",
    fullName: "베를린 점주",
    role: "vendor",
    regionId: "berlin",
  },
  {
    email: "customer@keuromart.com",
    password: "EuroMart!2026",
    fullName: "김손님",
    role: "customer",
    regionId: null,
  },
]

for (const u of users) {
  // Find existing user by email
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const existing = list?.users?.find((x) => x.email === u.email)

  let userId = existing?.id

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    })
    if (error) {
      console.error(`[create failed] ${u.email}:`, error.message)
      continue
    }
    userId = data.user.id
    console.log(`[created] ${u.email}`)
  } else {
    await admin.auth.admin.updateUserById(userId, {
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    })
    console.log(`[updated] ${u.email}`)
  }

  const { error: pErr } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        region_id: u.regionId,
      },
      { onConflict: "id" },
    )

  if (pErr) console.error(`[profile failed] ${u.email}:`, pErr.message)
  else console.log(`  -> profile: role=${u.role} region=${u.regionId ?? "-"}`)
}

const { data: profiles } = await admin.from("profiles").select("email, role, region_id").order("role")
console.log("\nProfiles now:")
console.table(profiles)
