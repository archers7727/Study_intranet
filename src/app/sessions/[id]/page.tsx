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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowLeft, Edit, Calendar, Clock, MapPin, Users, CheckCircle, File, FileText, Plus, Download, X } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface SessionDetail {
  id: string
  sessionDate: string
  startTime: string
  endTime: string
  location: string | null
  status: string
  notes: string | null
  class: {
    id: string
    name: string
    mainTeacher: {
      id: string
      name: string
      phone: string | null
    }
    students: Array<{
      student: {
        id: string
        studentId: string
        name: string
        grade: string
        enrollmentStatus: string
      }
    }>
  }
  createdBy: {
    id: string
    name: string
  }
  attendances: Array<{
    id: string
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
    notes: string | null
    checkedAt: string
    student: {
      id: string
      studentId: string
      name: string
      grade: string
    }
    checkedBy: {
      id: string
      name: string
    } | null
  }>
  assignments: Array<{
    id: string
    title: string
    dueDate: string
    _count: {
      submissions: number
    }
  }>
  materials: Array<{
    addedAt: string
    material: {
      id: string
      title: string
      description: string | null
      fileUrl: string
      fileType: string | null
      fileSize: number | null
      createdBy: {
        id: string
        name: string
      }
    }
  }>
  tags: Array<{
    tag: {
      id: string
      name: string
      color: string
    }
  }>
}

interface Material {
  id: string
  title: string
  fileType: string | null
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

export default function SessionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [attendanceMap, setAttendanceMap] = useState<Map<string, AttendanceStatus>>(new Map())
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([])
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false)

  useEffect(() => {
    fetchSession()
    fetchAvailableMaterials()
  }, [sessionId])

  const fetchSession = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch session')
      }

      const data = await response.json()
      setSession(data.data)

      // 기존 출석 데이터로 맵 초기화
      const map = new Map<string, AttendanceStatus>()
      data.data.attendances.forEach((att: any) => {
        map.set(att.student.id, att.status)
      })
      setAttendanceMap(map)
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(new Map(attendanceMap.set(studentId, status)))
  }

  const handleSaveAttendance = async () => {
    setSaving(true)
    try {
      const attendances = Array.from(attendanceMap.entries()).map(([studentId, status]) => ({
        studentId,
        status,
        notes: null
      }))

      const response = await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendances }),
      })

      if (!response.ok) {
        throw new Error('Failed to save attendance')
      }

      await fetchSession()
      alert('출석이 저장되었습니다.')
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('출석 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const fetchAvailableMaterials = async () => {
    try {
      const response = await fetch('/api/materials')
      if (!response.ok) throw new Error('Failed to fetch materials')
      const data = await response.json()
      setAvailableMaterials(data.data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const handleAddMaterial = async () => {
    if (!selectedMaterialId) return

    try {
      const response = await fetch(`/api/sessions/${sessionId}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ materialId: selectedMaterialId }),
      })

      if (!response.ok) {
        throw new Error('Failed to add material')
      }

      setMaterialDialogOpen(false)
      setSelectedMaterialId('')
      await fetchSession()
    } catch (error) {
      console.error('Error adding material:', error)
      alert('자료 추가에 실패했습니다.')
    }
  }

  const handleRemoveMaterial = async (materialId: string) => {
    if (!confirm('이 자료를 세션에서 제거하시겠습니까?')) return

    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/materials?materialId=${materialId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to remove material')
      }

      await fetchSession()
    } catch (error) {
      console.error('Error removing material:', error)
      alert('자료 제거에 실패했습니다.')
    }
  }

  const getStatusBadge = (status: string) => {
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

  const getAttendanceStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success">출석</Badge>
      case 'ABSENT':
        return <Badge variant="destructive">결석</Badge>
      case 'LATE':
        return <Badge variant="warning">지각</Badge>
      case 'EXCUSED':
        return <Badge variant="secondary">사유결석</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getAttendanceRate = () => {
    if (!session) return 0
    const totalStudents = session.class.students.length
    if (totalStudents === 0) return 0
    const presentCount = session.attendances.filter(
      (att) => att.status === 'PRESENT'
    ).length
    return Math.round((presentCount / totalStudents) * 100)
  }

  if (loading) {
    return <div className="container mx-auto py-8">로딩 중...</div>
  }

  if (!session) {
    return <div className="container mx-auto py-8">세션을 찾을 수 없습니다.</div>
  }

  return (
    <div className="container mx-auto py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/sessions')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          세션 목록으로
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{session.class.name}</h1>
              {getStatusBadge(session.status)}
            </div>
            <p className="text-gray-600">
              {format(new Date(session.sessionDate), 'PPP', { locale: ko })} •{' '}
              {session.startTime} - {session.endTime}
            </p>
          </div>
          <Button onClick={() => router.push(`/sessions/${sessionId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            수정
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 통계 카드 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">출석률</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAttendanceRate()}%</div>
            <p className="text-xs text-muted-foreground">
              {session.attendances.length} / {session.class.students.length}명 출석
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">과제</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.assignments.length}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">장소</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.location || '-'}</div>
          </CardContent>
        </Card>
      </div>

      {/* 세션 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>세션 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">담당 교사</div>
              <div className="font-medium">{session.class.mainTeacher.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">생성자</div>
              <div className="font-medium">{session.createdBy.name}</div>
            </div>
            {session.notes && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500 mb-1">메모</div>
                <div className="font-medium">{session.notes}</div>
              </div>
            )}
            {session.tags.length > 0 && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500 mb-2">태그</div>
                <div className="flex flex-wrap gap-2">
                  {session.tags.map(({ tag }) => (
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

      {/* 출석 관리 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>출석 체크</CardTitle>
            <Button onClick={handleSaveAttendance} disabled={saving}>
              {saving ? '저장 중...' : '출석 저장'}
            </Button>
          </div>
          <CardDescription>
            학생별 출석 상태를 선택하고 저장하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session.class.students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 학생이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>학생 ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>학년</TableHead>
                  <TableHead>출석 상태</TableHead>
                  <TableHead>체크 시간</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.class.students.map(({ student }) => {
                  const attendance = session.attendances.find(
                    (att) => att.student.id === student.id
                  )
                  const currentStatus = attendanceMap.get(student.id) || 'PRESENT'

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">
                        {student.studentId}
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>
                        <Select
                          value={currentStatus}
                          onValueChange={(value) =>
                            handleAttendanceChange(student.id, value as AttendanceStatus)
                          }
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRESENT">출석</SelectItem>
                            <SelectItem value="ABSENT">결석</SelectItem>
                            <SelectItem value="LATE">지각</SelectItem>
                            <SelectItem value="EXCUSED">사유결석</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {attendance ? (
                          <div className="text-sm text-gray-500">
                            {format(new Date(attendance.checkedAt), 'PPp', { locale: ko })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">미체크</div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 학습 자료 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>학습 자료 ({session.materials.length})</CardTitle>
            <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  자료 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>자료 추가</DialogTitle>
                  <DialogDescription>
                    세션에 추가할 자료를 선택하세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                    <SelectTrigger>
                      <SelectValue placeholder="자료 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMaterials
                        .filter(
                          (m) =>
                            !session.materials.some(
                              (sm) => sm.material.id === m.id
                            )
                        )
                        .map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.title} {material.fileType && `(${material.fileType})`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddMaterial} className="w-full">
                    추가
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {session.materials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              추가된 자료가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>업로드자</TableHead>
                  <TableHead>추가일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.materials.map(({ material, addedAt }) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{material.title}</span>
                      </div>
                      {material.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {material.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{material.fileType || '파일'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {material.createdBy.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(addedAt), 'PPP', { locale: ko })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(material.fileUrl, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMaterial(material.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 과제 목록 */}
      {session.assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>과제 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>마감일</TableHead>
                  <TableHead>제출</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>
                      {format(new Date(assignment.dueDate), 'PPP', { locale: ko })}
                    </TableCell>
                    <TableCell>
                      {assignment._count.submissions} /{' '}
                      {session.class.students.length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
