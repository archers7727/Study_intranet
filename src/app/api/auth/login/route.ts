import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '이메일과 비밀번호를 입력해주세요.',
        },
      }, { status: 400 })
    }

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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: authError?.message || '이메일 또는 비밀번호가 올바르지 않습니다.',
        },
      }, { status: 401 })
    }

    // JWT의 user_metadata에서 사용자 정보 추출 (Prisma 호출 불필요 = 빠름)
    const user = authData.user

    // 성공 응답 생성
    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          roleLevel: user.user_metadata?.roleLevel || 'STUDENT',
        },
        redirect: '/dashboard',
      },
    }, { status: 200 })

    // 수집된 쿠키들을 응답에 설정
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, {
        ...options,
        path: options?.path || '/',
        httpOnly: options?.httpOnly ?? true,
      })
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '로그인 중 오류가 발생했습니다.',
        details: error.message,
      },
    }, { status: 500 })
  }
}
