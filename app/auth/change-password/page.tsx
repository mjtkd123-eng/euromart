import { redirect } from "next/navigation"
import { readTenantSession } from "@/lib/tenant-auth"
import { ChangePasswordForm } from "@/components/auth/change-password-form"

export const dynamic = "force-dynamic"

export default async function ChangePasswordPage() {
  const session = await readTenantSession()
  if (!session) redirect("/vendor/login?next=/auth/change-password")

  return (
    <ChangePasswordForm
      email={session.email}
      firstLogin={session.mustChangePassword}
      role={session.role}
    />
  )
}
