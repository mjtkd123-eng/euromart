import Link from "next/link"
import { redirect } from "next/navigation"
import { Package, ShoppingBag, UserRound } from "lucide-react"
import { getSessionProfile, homePathForRole } from "@/lib/auth"
import { signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const profile = await getSessionProfile()
  if (!profile) redirect("/auth/login?next=/account")
  if (profile.role !== "customer") redirect(homePathForRole(profile.role))

  return (
    <DashboardShell
      eyebrow="일반 회원"
      title={profile.fullName ? `${profile.fullName}님의 마이페이지` : "마이페이지"}
      subtitle="주문·배송 조회와 환불 접수는 여기서, 장보기는 쇼핑몰 홈에서 이어집니다."
      email={profile.email}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/"
          className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
        >
          <ShoppingBag className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-3 font-bold">쇼핑몰 홈</p>
          <p className="mt-1 text-sm text-muted-foreground">도시별 한국 식료품을 주문합니다.</p>
        </Link>
        <Link
          href="/orders"
          className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
        >
          <Package className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-3 font-bold">주문 내역</p>
          <p className="mt-1 text-sm text-muted-foreground">배송 상태와 환불 신고.</p>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-5">
          <UserRound className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-3 font-bold">계정</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">{profile.email}</p>
          <form action={signOut} className="mt-4">
            <Button type="submit" variant="outline" size="sm" className="rounded-full">
              로그아웃
            </Button>
          </form>
        </div>
      </div>
    </DashboardShell>
  )
}
