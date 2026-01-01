import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // 쿠키 저장용 배열
    const cookiesToSet: { name: string; value: string; options: any }[] = []

    // Supabase 클라이언트 생성
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookies) {
            cookies.forEach((cookie) => {
              cookiesToSet.push(cookie)
            })
          },
        },
      }
    )

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

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: '로그아웃되었습니다.',
      },
    }, { status: 200 })

    // 수집된 쿠키들을 응답에 설정
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    return response
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
