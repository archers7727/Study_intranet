import { NextRequest, NextResponse } from 'next/server'
import { RoleLevel } from '@prisma/client'
import { getCurrentUser } from './auth'
import { ApiResponse, ROLE_LEVEL_HIERARCHY } from '@/types'

// API Route에서 권한 체크
export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return {
      error: NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '로그인이 필요합니다.',
        },
      }, { status: 401 }),
      user: null,
    }
  }

  return { error: null, user }
}

// 특정 권한 이상 필요
export async function requireRole(request: NextRequest, requiredRole: RoleLevel) {
  const { error, user } = await requireAuth(request)

  if (error) {
    return { error, user: null }
  }

  if (!user) {
    return {
      error: NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '로그인이 필요합니다.',
        },
      }, { status: 401 }),
      user: null,
    }
  }

  const hasPermission = ROLE_LEVEL_HIERARCHY[user.roleLevel] <= ROLE_LEVEL_HIERARCHY[requiredRole]

  if (!hasPermission) {
    return {
      error: NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '권한이 부족합니다.',
        },
      }, { status: 403 }),
      user: null,
    }
  }

  return { error: null, user }
}

// 여러 권한 중 하나라도 만족하면 통과
export async function requireAnyRole(request: NextRequest, roles: RoleLevel[]) {
  const { error, user } = await requireAuth(request)

  if (error) {
    return { error, user: null }
  }

  if (!user) {
    return {
      error: NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '로그인이 필요합니다.',
        },
      }, { status: 401 }),
      user: null,
    }
  }

  const hasPermission = roles.includes(user.roleLevel)

  if (!hasPermission) {
    return {
      error: NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '권한이 부족합니다.',
        },
      }, { status: 403 }),
      user: null,
    }
  }

  return { error: null, user }
}
