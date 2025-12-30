import { RoleLevel } from '@prisma/client'

// 사용자 타입
export interface User {
  id: string
  email: string
  name: string
  roleLevel: RoleLevel
  createdAt: Date
  updatedAt: Date
}

// 세션 타입
export interface Session {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: User
}

// 인증 응답 타입
export interface AuthResponse {
  user: User | null
  session: Session | null
  error?: string
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

// 페이지네이션 타입
export interface Pagination {
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrevious: boolean
}

// 권한 레벨별 숫자 매핑 (권한 체크용)
export const ROLE_LEVEL_HIERARCHY: Record<RoleLevel, number> = {
  ADMIN: 0,
  SENIOR_TEACHER: 1,
  TEACHER: 2,
  ASSISTANT: 3,
  STUDENT: 4,
  PARENT: 5,
}

// 권한 체크 헬퍼
export const hasPermission = (userRole: RoleLevel, requiredRole: RoleLevel): boolean => {
  return ROLE_LEVEL_HIERARCHY[userRole] <= ROLE_LEVEL_HIERARCHY[requiredRole]
}
