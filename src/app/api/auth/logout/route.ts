import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: error.message,
        },
      }, { status: 400 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: '로그아웃되었습니다.',
      },
    }, { status: 200 })
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '로그아웃 중 오류가 발생했습니다.',
        details: error.message,
      },
    }, { status: 500 })
  }
}
