/** True when real Supabase keys are set (not the .env.example placeholders). */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  return url.startsWith("https://") && !url.includes("YOUR_PROJECT") && key.length > 20
}
