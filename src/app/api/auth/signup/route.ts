import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { RoleLevel } from '@/types'
import { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, roleLevel = 'STUDENT' as RoleLevel } = body

    // 입력 검증
    if (!email || !password || !name) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '이메일, 비밀번호, 이름은 필수입니다.',
        },
      }, { status: 400 })
    }

    // Supabase Admin 클라이언트로 사용자 생성
    const supabaseAdmin = createSupabaseAdmin()

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        roleLevel,
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: authError?.message || '회원가입 중 오류가 발생했습니다.',
        },
      }, { status: 400 })
    }

    // users 테이블에 사용자 정보 저장 및 교사 프로필 생성
    try {
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          name,
          roleLevel,
        },
      })

      // 교사 역할인 경우 Teacher 프로필 생성
      if (['ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT'].includes(roleLevel)) {
        await prisma.teacher.create({
          data: {
            userId: user.id,
            name: user.name,
            specialties: [], // 초기값은 빈 배열
          },
        })
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
        },
      }, { status: 201 })
    } catch (prismaError: any) {
      // users 테이블 생성 실패 시 Supabase 사용자 삭제
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: '사용자 정보 저장 중 오류가 발생했습니다.',
          details: prismaError.message,
        },
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '서버 오류가 발생했습니다.',
        details: error.message,
      },
    }, { status: 500 })
  }
}
