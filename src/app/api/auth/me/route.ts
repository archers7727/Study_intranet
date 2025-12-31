import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '로그인이 필요합니다.',
        },
      }, { status: 401 })
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
    }, { status: 200 })
  } catch (error: any) {
    console.error('Get current user error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '사용자 정보 조회 중 오류가 발생했습니다.',
        details: error.message,
      },
    }, { status: 500 })
  }
}
