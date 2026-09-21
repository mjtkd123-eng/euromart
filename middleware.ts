import { updateSession } from "@/lib/supabase/proxy"
import { type NextRequest, NextResponse } from "next/server"
import { decodeTenantSession, TENANT_COOKIE } from "@/lib/staff-session"
import { isAdminRole, isOwnerRole, loginPathForRole } from "@/lib/roles"

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => to.cookies.set(c.name, c.value))
  return to
}

function redirectTo(request: NextRequest, pathname: string, supabaseResponse: NextResponse) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ""
  if (pathname.includes("login") && request.nextUrl.pathname !== pathname) {
    url.searchParams.set("next", request.nextUrl.pathname)
  }
  return copyCookies(supabaseResponse, NextResponse.redirect(url))
}

function forbidden(request: NextRequest, supabaseResponse: NextResponse) {
  const url = request.nextUrl.clone()
  url.pathname = "/forbidden"
  url.search = ""
  url.searchParams.set("from", request.nextUrl.pathname)
  return copyCookies(supabaseResponse, NextResponse.redirect(url))
}

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request)
  const path = request.nextUrl.pathname
  const staff = await decodeTenantSession(request.cookies.get(TENANT_COOKIE)?.value)

  if (path === "/vendor/login" || path.startsWith("/vendor/login/")) {
    const url = request.nextUrl.clone()
    url.pathname = "/owner/login"
    return copyCookies(supabaseResponse, NextResponse.redirect(url))
  }
  if (path === "/vendor" || path === "/vendor/") {
    return redirectTo(request, "/owner/dashboard", supabaseResponse)
  }
  if (path.startsWith("/vendor/claims")) {
    const url = request.nextUrl.clone()
    url.pathname = path.replace("/vendor/claims", "/owner/claims")
    return copyCookies(supabaseResponse, NextResponse.redirect(url))
  }
  if (path === "/admin" || path === "/admin/") {
    return redirectTo(request, "/admin/dashboard", supabaseResponse)
  }

  const isOwnerLogin = path === "/owner/login" || path === "/owner/signup"
  const isAdminLogin = path === "/admin/login"
  const isCustomerAuth = path.startsWith("/auth/")
  const ownerGated = path.startsWith("/owner") && !isOwnerLogin && path !== "/owner/pending"
  const adminGated = path.startsWith("/admin") && !isAdminLogin
  const opsGated = path.startsWith("/ops")
  const apiAdmin = path.startsWith("/api/admin")
  const apiVendor = path.startsWith("/api/vendor")

  const allowedWhileMustChange =
    path.startsWith("/auth/change-password") ||
    path.startsWith("/api/auth/") ||
    isOwnerLogin ||
    isAdminLogin

  if (staff?.mustChangePassword && (ownerGated || adminGated || opsGated) && !allowedWhileMustChange) {
    return redirectTo(request, "/auth/change-password", supabaseResponse)
  }

  if (ownerGated) {
    if (!staff) return redirectTo(request, loginPathForRole("owner"), supabaseResponse)
    if (!isOwnerRole(staff.role)) return forbidden(request, supabaseResponse)
    if (staff.accountStatus === "pending") {
      return redirectTo(request, "/owner/pending", supabaseResponse)
    }
    if (staff.accountStatus === "rejected") {
      return redirectTo(request, "/owner/login", supabaseResponse)
    }
  }

  if (adminGated) {
    if (!staff) return redirectTo(request, loginPathForRole("admin"), supabaseResponse)
    if (!isAdminRole(staff.role)) return forbidden(request, supabaseResponse)
  }

  if (apiAdmin) {
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdminRole(staff.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (opsGated) {
    if (!staff) return redirectTo(request, loginPathForRole("owner"), supabaseResponse)
    if (!isOwnerRole(staff.role) && !isAdminRole(staff.role)) {
      return forbidden(request, supabaseResponse)
    }
    if (isOwnerRole(staff.role) && staff.accountStatus !== "active") {
      return redirectTo(request, "/owner/pending", supabaseResponse)
    }
  }

  if (apiVendor) {
    if (!staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!isOwnerRole(staff.role) && !isAdminRole(staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  if ((isOwnerLogin || isAdminLogin || isCustomerAuth) && staff && !staff.mustChangePassword) {
    // Logged-in users hitting a portal login for a *different* role still see the form.
    // Same-role login pages bounce to the matching home.
    if (isOwnerLogin && isOwnerRole(staff.role) && staff.accountStatus === "active") {
      return redirectTo(request, "/owner/dashboard", supabaseResponse)
    }
    if (isAdminLogin && isAdminRole(staff.role)) {
      return redirectTo(request, "/admin/dashboard", supabaseResponse)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
