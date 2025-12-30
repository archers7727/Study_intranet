'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { RoleLevel } from '@prisma/client'
import { User } from '@/types'

interface NavItem {
  title: string
  href: string
  minRole?: RoleLevel[]
}

const navItems: NavItem[] = [
  {
    title: '대시보드',
    href: '/dashboard',
  },
  {
    title: '학생 관리',
    href: '/students',
    minRole: ['ADMIN', 'SENIOR_TEACHER', 'TEACHER'],
  },
  {
    title: '클래스 관리',
    href: '/dashboard/classes',
    minRole: ['ADMIN', 'SENIOR_TEACHER', 'TEACHER'],
  },
  {
    title: '세션 관리',
    href: '/dashboard/sessions',
    minRole: ['ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT'],
  },
  {
    title: '태그 관리',
    href: '/dashboard/tags',
    minRole: ['ADMIN', 'SENIOR_TEACHER'],
  },
  {
    title: '설정',
    href: '/dashboard/settings',
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
    <nav className="w-64 border-r bg-muted/10 p-4">
      <ul className="space-y-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'block rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}
              >
                {item.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
