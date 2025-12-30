import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// 클라이언트 컴포넌트용 Supabase 클라이언트
export const createSupabaseClient = () => {
  return createClientComponentClient()
}

// 브라우저용 Supabase 클라이언트 (직접 생성)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
