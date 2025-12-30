import { NextRequest, NextResponse } from 'next/server'
import { RoleLevel } from '@/types'
import { getCurrentUser } from './auth'
import { ApiResponse, ROLE_LEVEL_HIERARCHY } from '@/types'

// API Route에서 권한 체크
export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return { user }
}

// 특정 권한 이상 필요
export async function requireRole(request: NextRequest, requiredRole: RoleLevel) {
  const { user } = await requireAuth(request)

  const hasPermission = ROLE_LEVEL_HIERARCHY[user.roleLevel] <= ROLE_LEVEL_HIERARCHY[requiredRole]

  if (!hasPermission) {
    throw new Error('Forbidden')
  }

  return { user }
}

// 여러 권한 중 하나라도 만족하면 통과
export async function requireAnyRole(request: NextRequest, roles: RoleLevel[]) {
  const { user } = await requireAuth(request)

  const hasPermission = roles.includes(user.roleLevel)

  if (!hasPermission) {
    throw new Error('Forbidden')
  }

  return { user }
}
