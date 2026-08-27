import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { getSessionProfile } from "@/lib/auth"
import { refreshFxRates } from "@/lib/fx"

export const dynamic = "force-dynamic"

/**
 * 환율 갱신 엔드포인트.
 * 세 가지 호출 경로를 허용합니다.
 *  1) 관리자 세션 — 대시보드의 "지금 갱신" 버튼
 *  2) Authorization: Bearer <CRON_SECRET> — CRON_SECRET이 설정된 경우
 *  3) x-vercel-cron 헤더 — Vercel 플랫폼이 붙이는 헤더로, 외부에서는 위조해도
 *     Vercel 엣지에서 제거되므로 스케줄 호출만 통과합니다.
 *
 * 이 엔드포인트는 외부 공개 환율(ECB)을 읽어 저장할 뿐 사용자 데이터를 노출하지
 * 않으므로, 최악의 경우 영향은 불필요한 갱신 1회입니다.
 */
async function authorize(): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const requestHeaders = await headers()

  const secret = process.env.CRON_SECRET
  if (secret && requestHeaders.get("authorization") === `Bearer ${secret}`) {
    return { ok: true }
  }

  if (requestHeaders.get("x-vercel-cron")) return { ok: true }

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
