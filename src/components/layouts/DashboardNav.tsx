'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { RoleLevel } from '@/types'
import { User } from '@/types'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  ClipboardList,
  BookOpen,
  Tags,
  Settings,
  LucideIcon,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  minRole?: RoleLevel[]
}

const navItems: NavItem[] = [
  {
    title: '대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '학생 관리',
    href: '/students',
    icon: Users,
    minRole: ['ADMIN', 'SENIOR_TEACHER', 'TEACHER'],
  },
  {
    title: '클래스 관리',
    href: '/classes',
    icon: GraduationCap,
    minRole: ['ADMIN', 'SENIOR_TEACHER', 'TEACHER'],
  },
  {
    title: '세션 관리',
    href: '/sessions',
    icon: Calendar,
    minRole: ['ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT'],
  },
  {
    title: '과제 관리',
    href: '/assignments',
    icon: ClipboardList,
    minRole: ['ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT'],
  },
  {
    title: '학습 자료',
    href: '/materials',
    icon: BookOpen,
    minRole: ['ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT'],
  },
  {
    title: '태그 관리',
    href: '/tags',
    icon: Tags,
    minRole: ['ADMIN', 'SENIOR_TEACHER'],
  },
  {
    title: '설정',
    href: '/dashboard/settings',
    icon: Settings,
    minRole: ['ADMIN'],
  },
]

interface DashboardNavProps {
  user: User
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()

  const filteredNavItems = navItems.filter((item) => {
    if (!item.minRole) return true
    return item.minRole.includes(user.roleLevel)
  })

  return (
    <nav className="w-64 min-h-[calc(100vh-4rem)] border-r bg-slate-50/50 dark:bg-slate-900/50">
      <div className="p-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? 'text-primary-foreground' : 'text-slate-500 dark:text-slate-400')} />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
