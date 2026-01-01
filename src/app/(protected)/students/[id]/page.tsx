'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface Student {
  id: string
  studentId: string
  name: string
  email: string
  birthDate: string
  gender: string
  school: string | null
  phone: string
  grade: string
  enrollmentStatus: string
  managementStatus: string
  parent: {
    id: string
    name: string
    phone: string
    relation: string
  } | null
  tags: Array<{ id: string; name: string; color: string }>
  enrollments: Array<{
    id: string
    class: {
      id: string
      name: string
      isActive: boolean
    }
  }>
}

interface Attendance {
  id: string
  status: string
  notes: string | null
  sessionDate: string
  className: string
  createdAt: string
}

interface Assignment {
  id: string
  assignmentId: string
  title: string
  status: string
  score: number | null
  maxScore: number | null
  submittedAt: string | null
  dueDate: string
}

interface StatusLog {
  id: string
  previousStatus: string
  newStatus: string
  reason: string
  changedAt: string
  changedBy: {
    name: string
    roleLevel: string
  }
}

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [attendanceRate, setAttendanceRate] = useState<number>(0)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudent()
  }, [studentId])

  const fetchStudent = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/students/${studentId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch student')
      }

      const data = await response.json()
      setStudent(data.student)
      setAttendanceRate(data.attendanceRate)
      setAttendances(data.attendances)
      setAssignments(data.assignments)
      setStatusLogs(data.statusLogs)
    } catch (error) {
      console.error('Error fetching student:', error)
      alert('학생 정보를 불러오는데 실패했습니다.')
      router.push('/students')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 이 학생을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete student')
      }

      alert('학생이 삭제되었습니다.')
      router.push('/students')
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('학생 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">학생을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{student.name}</h1>
            <p className="text-muted-foreground">학생 ID: {student.studentId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            수정
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">이메일</p>
                <p className="font-medium">{student.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">학년</p>
                <p className="font-medium">{student.grade}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">학교</p>
                <p className="font-medium">{student.school || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">연락처</p>
                <p className="font-medium">{student.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">재원 상태</p>
                <div>
                  {student.enrollmentStatus === 'ENROLLED' && <Badge variant="success">재원</Badge>}
                  {student.enrollmentStatus === 'WAITING' && <Badge variant="warning">대기</Badge>}
                  {student.enrollmentStatus === 'LEFT' && <Badge variant="secondary">퇴원</Badge>}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">관리 상태</p>
                <div>
                  {student.managementStatus === 'NORMAL' && <Badge variant="default">정상</Badge>}
                  {student.managementStatus === 'CAUTION' && <Badge variant="destructive">주의</Badge>}
                </div>
              </div>
            </div>

            {student.parent && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">보호자</p>
                <div className="space-y-1">
                  <p className="font-medium">{student.parent.name} ({student.parent.relation})</p>
                  <p className="text-sm text-muted-foreground">{student.parent.phone}</p>
                </div>
              </div>
            )}

            {student.tags.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">태그</p>
                <div className="flex flex-wrap gap-2">
                  {student.tags.map(tag => (
                    <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color }}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>통계</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">출석률</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{attendanceRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">
                  ({attendances.filter(a => a.status === 'PRESENT').length}/{attendances.length})
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">수강 클래스</p>
              <p className="text-2xl font-bold">{student.enrollments.length}개</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">과제</p>
              <p className="text-2xl font-bold">{assignments.length}건</p>
              <p className="text-sm text-muted-foreground mt-1">
                미제출: {assignments.filter(a => a.status === 'NOT_SUBMITTED').length}건
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>수강 클래스</CardTitle>
          <CardDescription>현재 수강 중인 클래스 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {student.enrollments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">수강 중인 클래스가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {student.enrollments.map(enrollment => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{enrollment.class.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {enrollment.class.isActive ? '진행 중' : '종료'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/classes/${enrollment.class.id}`)}
                  >
                    상세
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 출석 기록</CardTitle>
          <CardDescription>최근 50건의 출석 기록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">출석 기록이 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>클래스</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.slice(0, 10).map(attendance => (
                  <TableRow key={attendance.id}>
                    <TableCell>
                      {format(new Date(attendance.sessionDate), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell>{attendance.className}</TableCell>
                    <TableCell>
                      {attendance.status === 'PRESENT' ? (
                        <Badge variant="success">출석</Badge>
                      ) : (
                        <Badge variant="destructive">결석</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {attendance.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>과제 현황</CardTitle>
          <CardDescription>제출한 과제 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">과제가 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>과제명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>점수</TableHead>
                  <TableHead>제출일</TableHead>
                  <TableHead>마감일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.slice(0, 10).map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>
                      {assignment.status === 'SUBMITTED' && <Badge>제출</Badge>}
                      {assignment.status === 'NOT_SUBMITTED' && <Badge variant="destructive">미제출</Badge>}
                      {assignment.status === 'GRADED' && <Badge variant="success">채점완료</Badge>}
                    </TableCell>
                    <TableCell>
                      {assignment.score !== null
                        ? `${assignment.score}/${assignment.maxScore}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {assignment.submittedAt
                        ? format(new Date(assignment.submittedAt), 'yyyy-MM-dd')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(assignment.dueDate), 'yyyy-MM-dd')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {statusLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>상태 변경 이력</CardTitle>
            <CardDescription>관리 상태 변경 기록입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusLogs.map(log => (
                <div key={log.id} className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{log.previousStatus}</Badge>
                      <span>→</span>
                      <Badge>{log.newStatus}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{log.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      변경자: {log.changedBy.name} ({log.changedBy.roleLevel}) •{' '}
                      {format(new Date(log.changedAt), 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
