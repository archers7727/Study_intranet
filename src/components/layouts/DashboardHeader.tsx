'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User } from '@/types'
import { LogOut, BookOpen } from 'lucide-react'

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

  const getRoleBadgeColor = (roleLevel: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      SENIOR_TEACHER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      TEACHER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      ASSISTANT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      STUDENT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      PARENT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return colors[roleLevel] || 'bg-gray-100 text-gray-700'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Study Intranet</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(user.roleLevel)}`}>
              {getRoleLabel(user.roleLevel)}
            </span>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">로그아웃</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
