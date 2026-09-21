import { jsonError, jsonOk } from "@/lib/api"
import { registerOwner } from "@/lib/tenant-auth"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: {
    email?: string
    password?: string
    fullName?: string
    storeName?: string
    legalName?: string
    businessNumber?: string
    citySlug?: string
    address?: string
    phone?: string
    documentsNote?: string
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return jsonError("Invalid JSON")
  }

  const result = await registerOwner({
    email: body.email ?? "",
    password: body.password ?? "",
    fullName: body.fullName ?? "",
    storeName: body.storeName ?? "",
    legalName: body.legalName ?? "",
    businessNumber: body.businessNumber ?? "",
    citySlug: body.citySlug ?? "budapest",
    address: body.address ?? "",
    phone: body.phone ?? "",
    documentsNote: body.documentsNote ?? "",
  })
  if ("error" in result) return jsonError(result.error, 400)

  return jsonOk({
    ok: true,
    role: "owner",
    accountStatus: "pending",
    redirectTo: "/owner/pending",
  })
}
