import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardHeader } from '@/components/layouts/DashboardHeader'
import { DashboardNav } from '@/components/layouts/DashboardNav'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardNav user={user} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
