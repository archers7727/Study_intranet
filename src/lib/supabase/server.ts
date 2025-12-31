import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// 서버 컴포넌트용 Supabase 클라이언트 (async - Next.js 15 compatible)
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()
  return createServerComponentClient({ cookies: async () => cookieStore })
}

// Route Handler용 Supabase 클라이언트 (async - Next.js 15 compatible)
export const createSupabaseRouteHandler = async () => {
  const cookieStore = await cookies()
  return createRouteHandlerClient({ cookies: async () => cookieStore })
}

// Service Role 클라이언트 (관리자 권한)
export const createSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
