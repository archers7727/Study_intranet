import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, GraduationCap, Calendar, ClipboardList, BookOpen, Tags, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
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

  const statsCards = [
    {
      title: '총 학생 수',
      description: '현재 재원 중인 학생',
      value: '0명',
      icon: Users,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      title: '진행 중인 클래스',
      description: '활성화된 클래스',
      value: '0개',
      icon: GraduationCap,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
    },
    {
      title: '오늘의 세션',
      description: '오늘 예정된 수업',
      value: '0개',
      icon: Calendar,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    },
    {
      title: '미제출 과제',
      description: '마감 임박 과제',
      value: '0개',
      icon: ClipboardList,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
    },
  ]

  const quickLinks = [
    {
      title: '학생 관리',
      description: '학생 등록, 출결 관리, 성적 추적 등 학생 관련 모든 기능을 제공합니다.',
      icon: Users,
      href: '/students',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: '클래스 관리',
      description: '수업 생성, 교사 배정, 반복 일정 설정 등 클래스 운영을 관리합니다.',
      icon: GraduationCap,
      href: '/classes',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      title: '세션 관리',
      description: '캘린더 뷰, 출석 체크, 과제 부여 등 개별 수업을 관리합니다.',
      icon: Calendar,
      href: '/sessions',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      title: '학습 자료',
      description: '학습 자료 업로드 및 관리, 태그 기반 검색을 지원합니다.',
      icon: BookOpen,
      href: '/materials',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">환영합니다, {user.name}님!</h1>
        <p className="text-muted-foreground">
          {getRoleLabel(user.roleLevel)} 대시보드입니다. 오늘의 현황을 확인하세요.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>빠른 시작</span>
          </CardTitle>
          <CardDescription>Study Intranet의 주요 기능을 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group rounded-xl border p-5 transition-all duration-200 hover:shadow-md hover:border-primary/50 ${link.bgColor}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-2.5 bg-white dark:bg-slate-900 shadow-sm ${link.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        {link.title}
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
