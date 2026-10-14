import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** env가 없으면 null — 앱은 Supabase 없이도 빌드·실행된다. */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
