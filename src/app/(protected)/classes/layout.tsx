import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function ClassesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // 클래스 관리는 LV0-2만 접근 가능
  const canAccess = ['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(user?.roleLevel || '')
  if (!canAccess) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
