import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold">Study Intranet</h1>
          <Link href="/login">
            <Button>로그인</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          태그 기반 교육 관리 시스템
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          학원 및 교육 기관을 위한 올인원 관리 플랫폼
          <br />
          학생, 클래스, 세션, 과제를 효율적으로 관리하세요
        </p>
        <div className="mt-10 flex gap-4">
          <Link href="/login">
            <Button size="lg">시작하기</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <h2 className="text-center text-3xl font-bold mb-12">주요 기능</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>학생 관리</CardTitle>
              <CardDescription>등록, 출결, 과제 현황, 성적 추적</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 자동 ID/비밀번호 생성</li>
                <li>• 학년 자동 계산</li>
                <li>• 보호자 연동</li>
                <li>• 태그 기반 분류</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>클래스 관리</CardTitle>
              <CardDescription>수업 생성, 교사 배정, 반복 일정</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 주/보조 교사 배정</li>
                <li>• 클래스 복사 기능</li>
                <li>• 반복 일정 설정</li>
                <li>• 비용 관리</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>세션 관리</CardTitle>
              <CardDescription>캘린더 뷰, 출석, 과제 부여</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 월/주/일 캘린더 뷰</li>
                <li>• 실시간 출석 체크</li>
                <li>• 과제 부여 및 관리</li>
                <li>• 수업 자료 연동</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>태그 시스템</CardTitle>
              <CardDescription>다중 태그 검색 (AND/OR)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 커스텀 컬러 설정</li>
                <li>• 사용량 추적</li>
                <li>• 정교한 검색</li>
                <li>• 대시보드 통계</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* RBAC Section */}
      <section className="container py-24">
        <h2 className="text-center text-3xl font-bold mb-12">6단계 권한 관리</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {[
            { level: 'LV0', role: '관리자', desc: '시스템 전체 제어' },
            { level: 'LV1', role: '수석교사', desc: '클래스 생성, 태그 관리' },
            { level: 'LV2', role: '일반교사', desc: '세션, 과제, 출결 관리' },
            { level: 'LV3', role: '보조교사', desc: '출결 체크, 자료 열람' },
            { level: 'LV4', role: '학생', desc: '과제 제출, 자료 열람' },
            { level: 'LV5', role: '학부모', desc: '자녀 정보 모니터링' },
          ].map((item) => (
            <div key={item.level} className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {item.level}
                </span>
                <h3 className="font-semibold">{item.role}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 Study Intranet. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
