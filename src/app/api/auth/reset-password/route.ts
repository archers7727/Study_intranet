import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

// 임시 비밀번호 재설정 API (개발 환경에서만 사용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newPassword } = body

    // 입력 검증
    if (!email || !newPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '이메일과 새 비밀번호를 입력해주세요.',
        },
      }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '비밀번호는 최소 6자 이상이어야 합니다.',
        },
      }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin()

    // 이메일로 사용자 찾기
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('List users error:', listError)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: '사용자 목록 조회 중 오류가 발생했습니다.',
          details: listError.message,
        },
      }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '해당 이메일의 사용자를 찾을 수 없습니다.',
        },
      }, { status: 404 })
    }

    // 비밀번호 재설정
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Update password error:', updateError)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: '비밀번호 재설정 중 오류가 발생했습니다.',
          details: updateError.message,
        },
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: '비밀번호가 성공적으로 재설정되었습니다.',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
    }, { status: 200 })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '비밀번호 재설정 중 오류가 발생했습니다.',
        details: error.message,
      },
    }, { status: 500 })
  }
}
