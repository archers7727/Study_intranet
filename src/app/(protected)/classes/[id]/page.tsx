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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Edit, UserPlus, UserMinus, Users, BookOpen, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ClassDetail {
  id: string
  name: string
  description: string | null
  cost: number | null
  isActive: boolean
  recurringSchedules: any
  mainTeacher: {
    id: string
    name: string
    phone: string | null
    user: {
      email: string
      roleLevel: string
    }
  }
  assistantTeachers: Array<{
    teacher: {
      id: string
      name: string
      phone: string | null
    }
  }>
  students: Array<{
    enrolledAt: string
    student: {
      id: string
      studentId: string
      name: string
      grade: string
      school: string | null
      enrollmentStatus: string
      managementStatus: string
    }
  }>
  sessions: Array<{
    id: string
    sessionDate: string
    startTime: string
    endTime: string
    status: string
    _count: {
      attendances: number
    }
  }>
  tags: Array<{
    tag: {
      id: string
      name: string
      color: string
    }
  }>
  _count: {
    students: number
    sessions: number
  }
}

interface Student {
  id: string
  studentId: string
  name: string
  grade: string
}

export default function ClassDetailPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.id as string

  const [classData, setClassData] = useState<ClassDetail | null>(null)
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)

  useEffect(() => {
    fetchClass()
    fetchAvailableStudents()
  }, [classId])

  const fetchClass = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/classes/${classId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch class')
      }

      const data = await response.json()
      setClassData(data.data)
    } catch (error) {
      console.error('Error fetching class:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableStudents = async () => {
    try {
      const response = await fetch('/api/students')

      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }

      const data = await response.json()
      setAvailableStudents(data.students || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleEnrollStudent = async () => {
    if (!selectedStudentId) return

    try {
      const response = await fetch(`/api/classes/${classId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: selectedStudentId }),
      })

      if (!response.ok) {
        throw new Error('Failed to enroll student')
      }

      setEnrollDialogOpen(false)
      setSelectedStudentId('')
      fetchClass()
    } catch (error) {
      console.error('Error enrolling student:', error)
      alert('학생 등록에 실패했습니다.')
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('이 학생을 클래스에서 제거하시겠습니까?')) return

    try {
      const response = await fetch(
        `/api/classes/${classId}/students?studentId=${studentId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to remove student')
      }

      fetchClass()
    } catch (error) {
      console.error('Error removing student:', error)
      alert('학생 제거에 실패했습니다.')
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const getEnrollmentStatusBadge = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return <Badge variant="success">재원</Badge>
      case 'WAITING':
        return <Badge variant="warning">대기</Badge>
      case 'LEFT':
        return <Badge variant="secondary">퇴원</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getManagementStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return <Badge variant="success">정상</Badge>
      case 'CAUTION':
        return <Badge variant="warning">주의</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getSessionStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline">예정</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="default">진행중</Badge>
      case 'COMPLETED':
        return <Badge variant="success">완료</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">취소</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8">로딩 중...</div>
  }

  if (!classData) {
    return <div className="container mx-auto py-8">클래스를 찾을 수 없습니다.</div>
  }

  return (
    <div className="container mx-auto py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/classes')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          클래스 목록으로
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{classData.name}</h1>
              {classData.isActive ? (
                <Badge variant="success">활성</Badge>
              ) : (
                <Badge variant="secondary">비활성</Badge>
              )}
            </div>
            {classData.description && (
              <p className="text-gray-600">{classData.description}</p>
            )}
          </div>
          <Button onClick={() => router.push(`/classes/${classId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            수정
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 통계 카드 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">수강생</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classData._count.students}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 세션</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classData._count.sessions}회</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">수강료</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(classData.cost)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 클래스 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>클래스 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">담당 교사</div>
              <div className="font-medium">{classData.mainTeacher.name}</div>
              <div className="text-sm text-gray-500">{classData.mainTeacher.user.email}</div>
            </div>
            {classData.assistantTeachers.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-1">보조 교사</div>
                {classData.assistantTeachers.map(({ teacher }) => (
                  <div key={teacher.id} className="font-medium">
                    {teacher.name}
                  </div>
                ))}
              </div>
            )}
            {classData.tags.length > 0 && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500 mb-2">태그</div>
                <div className="flex flex-wrap gap-2">
                  {classData.tags.map(({ tag }) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      style={{
                        borderColor: tag.color,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 수강생 목록 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>수강생 ({classData.students.length}명)</CardTitle>
            <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  학생 등록
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>학생 등록</DialogTitle>
                  <DialogDescription>
                    클래스에 등록할 학생을 선택하세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="학생 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents
                        .filter(
                          (s) =>
                            !classData.students.some(
                              (enrolled) => enrolled.student.id === s.id
                            )
                        )
                        .map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.studentId}) - {student.grade}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleEnrollStudent} className="w-full">
                    등록
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {classData.students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 수강생이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>학생 ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>학년</TableHead>
                  <TableHead>학교</TableHead>
                  <TableHead>재원 상태</TableHead>
                  <TableHead>관리 상태</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.students.map(({ student, enrolledAt }) => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/students/${student.id}`)}
                  >
                    <TableCell className="font-mono text-sm">
                      {student.studentId}
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.school || '-'}</TableCell>
                    <TableCell>
                      {getEnrollmentStatusBadge(student.enrollmentStatus)}
                    </TableCell>
                    <TableCell>
                      {getManagementStatusBadge(student.managementStatus)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(enrolledAt), 'PPP', { locale: ko })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStudent(student.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 최근 세션 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 세션</CardTitle>
          <CardDescription>최근 10개 세션</CardDescription>
        </CardHeader>
        <CardContent>
          {classData.sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 세션이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>시간</TableHead>
                  <TableHead>출석</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell>
                      {format(new Date(session.sessionDate), 'PPP', { locale: ko })}
                    </TableCell>
                    <TableCell>
                      {session.startTime} - {session.endTime}
                    </TableCell>
                    <TableCell>
                      {session._count.attendances} / {classData._count.students}
                    </TableCell>
                    <TableCell>{getSessionStatusBadge(session.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
