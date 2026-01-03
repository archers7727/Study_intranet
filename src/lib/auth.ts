import { cache } from 'react'
import { RoleLevel } from '@/types'
import { createSupabaseServerClient } from './supabase/server'
import { User } from '@/types'

// 서버사이드에서 현재 로그인한 사용자 가져오기
// getSession()은 쿠키에서 JWT를 읽기만 함 (네트워크 호출 없음 = 매우 빠름)
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createSupabaseServerClient()

    // getSession()은 로컬 쿠키에서 읽음 (네트워크 호출 없음)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return null
    }

    const authUser = session.user

    // JWT에서 사용자 정보 추출 (Prisma 호출 불필요)
    return {
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      roleLevel: (authUser.user_metadata?.roleLevel as RoleLevel) || 'STUDENT',
      createdAt: new Date(authUser.created_at),
      updatedAt: new Date(),
    } as User
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
})

// 권한 체크
export async function checkPermission(requiredRole: RoleLevel): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  const roleHierarchy: Record<RoleLevel, number> = {
    ADMIN: 0,
    SENIOR_TEACHER: 1,
    TEACHER: 2,
    ASSISTANT: 3,
    STUDENT: 4,
    PARENT: 5,
  }

  return roleHierarchy[user.roleLevel] <= roleHierarchy[requiredRole]
}

// 특정 권한 레벨인지 체크
export async function hasRole(role: RoleLevel): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.roleLevel === role
}

// 여러 권한 중 하나라도 가지고 있는지 체크
export async function hasAnyRole(roles: RoleLevel[]): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  return roles.includes(user.roleLevel)
}

// 학생 ID/비밀번호 자동 생성
export function generateStudentCredentials(name: string, phone: string, birthDate: Date, gender: 'MALE' | 'FEMALE'): {
  studentId: string
  password: string
} {
  // 학생 ID: 이름 + 연락처 끝 5자리
  const phoneLast5 = phone.replace(/[^0-9]/g, '').slice(-5)
  const studentId = `${name}${phoneLast5}`

  // 비밀번호: 생년월일 6자리(YYMMDD) + 성별코드(남:3, 여:4)
  const year = birthDate.getFullYear().toString().slice(-2)
  const month = (birthDate.getMonth() + 1).toString().padStart(2, '0')
  const day = birthDate.getDate().toString().padStart(2, '0')
  const genderCode = gender === 'MALE' ? '3' : '4'
  const password = `${year}${month}${day}${genderCode}`

  return { studentId, password }
}

// 학년 자동 계산 (한국 나이 기준)
export function calculateGrade(birthDate: Date): string {
  const today = new Date()
  const birthYear = birthDate.getFullYear()
  const currentYear = today.getFullYear()

  // 한국 나이 계산
  const koreanAge = currentYear - birthYear + 1

  // 초등학생: 8~13세 (1~6학년)
  if (koreanAge >= 8 && koreanAge <= 13) {
    const grade = koreanAge - 7
    return `초${grade}`
  }

  // 중학생: 14~16세 (1~3학년)
  if (koreanAge >= 14 && koreanAge <= 16) {
    const grade = koreanAge - 13
    return `중${grade}`
  }

  // 고등학생: 17~19세 (1~3학년)
  if (koreanAge >= 17 && koreanAge <= 19) {
    const grade = koreanAge - 16
    return `고${grade}`
  }

  // 기타
  return '미정'
}
