import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * RLS를 우회하는 서비스 롤 클라이언트입니다.
 * 사용자 세션이 없는 신뢰된 서버 작업(크론 환율 갱신 등)에만 사용하세요.
 * 절대 클라이언트 컴포넌트에서 import하지 마세요.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.")

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
