import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">환영합니다, {user.name}님!</h1>
        <p className="mt-2 text-muted-foreground">
          {getRoleLabel(user.roleLevel)} 대시보드입니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">총 학생 수</CardTitle>
            <CardDescription>현재 재원 중인 학생</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0명</div>
            <p className="text-xs text-muted-foreground">데이터가 없습니다</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">진행 중인 클래스</CardTitle>
            <CardDescription>활성화된 클래스</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0개</div>
            <p className="text-xs text-muted-foreground">데이터가 없습니다</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">오늘의 세션</CardTitle>
            <CardDescription>오늘 예정된 수업</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0개</div>
            <p className="text-xs text-muted-foreground">데이터가 없습니다</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">미제출 과제</CardTitle>
            <CardDescription>마감 임박 과제</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0개</div>
            <p className="text-xs text-muted-foreground">데이터가 없습니다</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>시작하기</CardTitle>
          <CardDescription>Study Intranet의 주요 기능을 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">학생 관리</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                학생 등록, 출결 관리, 성적 추적 등 학생 관련 모든 기능을 제공합니다.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">클래스 관리</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                수업 생성, 교사 배정, 반복 일정 설정 등 클래스 운영을 관리합니다.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">세션 관리</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                캘린더 뷰, 출석 체크, 과제 부여 등 개별 수업을 관리합니다.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">태그 시스템</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                다중 태그 검색(AND/OR)으로 효율적인 데이터 관리가 가능합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
