import { updateSession } from "@/lib/supabase/proxy"
import { type NextRequest, NextResponse } from "next/server"
import { decodeTenantSession, TENANT_COOKIE } from "@/lib/staff-session"

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request)
  const path = request.nextUrl.pathname
  const staff = await decodeTenantSession(request.cookies.get(TENANT_COOKIE)?.value)

  const gated =
    path.startsWith("/vendor") || path.startsWith("/admin") || path.startsWith("/ops")
  const allowedWhileMustChange =
    path.startsWith("/auth/change-password") ||
    path.startsWith("/api/auth/") ||
    path === "/vendor/login"

  if (staff?.mustChangePassword && gated && !allowedWhileMustChange) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/change-password"
    const redirect = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value))
    return redirect
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
