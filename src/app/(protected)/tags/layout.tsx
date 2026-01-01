import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function TagsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // 태그 관리는 LV0-1만 접근 가능
  const canAccess = ['ADMIN', 'SENIOR_TEACHER'].includes(user?.roleLevel || '')
  if (!canAccess) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
