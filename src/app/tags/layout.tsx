import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardHeader } from '@/components/layouts/DashboardHeader'
import { DashboardNav } from '@/components/layouts/DashboardNav'

export const dynamic = 'force-dynamic'

export default async function TagsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // 태그 관리는 LV0-1만 접근 가능
  const canAccess = ['ADMIN', 'SENIOR_TEACHER'].includes(user.roleLevel)
  if (!canAccess) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardNav user={user} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
