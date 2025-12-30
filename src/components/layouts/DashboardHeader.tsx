'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User } from '@/types'

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getRoleLabel = (roleLevel: string) => {
    const labels: Record<string, string> = {
      ADMIN: '관리자',
      SENIOR_TEACHER: '수석교사',
      TEACHER: '일반교사',
      ASSISTANT: '보조교사',
      STUDENT: '학생',
      PARENT: '학부모',
    }
    return labels[roleLevel] || roleLevel
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Study Intranet</h1>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {getRoleLabel(user.roleLevel)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  )
}
