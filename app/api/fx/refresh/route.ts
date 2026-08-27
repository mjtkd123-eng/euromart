import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { getSessionProfile } from "@/lib/auth"
import { refreshFxRates } from "@/lib/fx"

export const dynamic = "force-dynamic"

/**
 * 환율 갱신 엔드포인트.
 * 두 가지 호출 경로를 허용합니다.
 *  1) 관리자 세션 — 대시보드의 "지금 갱신" 버튼
 *  2) Authorization: Bearer <CRON_SECRET> — Vercel Cron 스케줄
 */
async function authorize(): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = (await headers()).get("authorization")
    if (auth === `Bearer ${secret}`) return { ok: true }
  }

  const profile = await getSessionProfile()
  if (!profile) return { ok: false, status: 401, error: "로그인이 필요합니다." }
  if (profile.role !== "admin") return { ok: false, status: 403, error: "관리자 권한이 필요합니다." }
  return { ok: true }
}

export async function POST() {
  const auth = await authorize()
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  }

  const result = await refreshFxRates()

  if (result.ok) {
    revalidatePath("/admin")
    revalidatePath("/")
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}

// Vercel Cron은 GET으로 호출하므로 동일 처리를 노출합니다.
export async function GET() {
  return POST()
}
