import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandler } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
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

    // Supabase로 로그인
    const supabase = await createSupabaseRouteHandler()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.session) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        },
      }, { status: 401 })
    }

    // Prisma에서 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: authData.user.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '사용자 정보를 찾을 수 없습니다.',
        },
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roleLevel: user.roleLevel,
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_in: authData.session.expires_in,
          expires_at: authData.session.expires_at,
          token_type: authData.session.token_type,
        },
      },
    }, { status: 200 })
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
