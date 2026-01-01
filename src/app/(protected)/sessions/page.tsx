'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Users, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Session {
  id: string
  sessionDate: string
  startTime: string
  endTime: string
  location: string | null
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  class: {
    id: string
    name: string
    mainTeacher: {
      id: string
      name: string
    }
    _count: {
      students: number
    }
  }
  createdBy: {
    id: string
    name: string
  }
  _count: {
    attendances: number
    assignments: number
  }
  tags: Array<{
    tag: {
      id: string
      name: string
      color: string
    }
  }>
}

interface Class {
  id: string
  name: string
}

export default function SessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    fetchClasses()
    fetchSessions()
  }, [classFilter, statusFilter])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      if (!response.ok) throw new Error('Failed to fetch classes')
      const data = await response.json()
      setClasses(data.data || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (classFilter !== 'all') params.append('classId', classFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/sessions?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setSessions(data.data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateFilter = () => {
    fetchSessions()
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

  const getAttendanceRate = (session: Session) => {
    if (session.class._count.students === 0) return 0
    return Math.round((session._count.attendances / session.class._count.students) * 100)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">세션 관리</h1>
        <p className="text-gray-600">수업 세션을 관리하고 출석을 체크하세요</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>세션 목록</CardTitle>
              <CardDescription>전체 {sessions.length}개 세션</CardDescription>
            </div>
            <Button onClick={() => router.push('/sessions/new')}>
              <Plus className="mr-2 h-4 w-4" />
              새 세션
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 필터 */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="클래스 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 클래스</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="SCHEDULED">예정</SelectItem>
                  <SelectItem value="IN_PROGRESS">진행중</SelectItem>
                  <SelectItem value="COMPLETED">완료</SelectItem>
                  <SelectItem value="CANCELLED">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[180px]"
              />
              <span className="text-sm text-gray-500">-</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[180px]"
              />
              <Button onClick={handleDateFilter} variant="secondary">
                적용
              </Button>
            </div>
          </div>

          {/* 세션 목록 테이블 */}
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              세션이 없습니다. 새 세션을 생성하세요.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>시간</TableHead>
                  <TableHead>클래스</TableHead>
                  <TableHead>장소</TableHead>
                  <TableHead>출석률</TableHead>
                  <TableHead>과제</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>태그</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/sessions/${session.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {format(new Date(session.sessionDate), 'PPP', { locale: ko })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{session.class.name}</div>
                        <div className="text-xs text-gray-500">
                          {session.class.mainTeacher.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{session.location || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>
                          {session._count.attendances} / {session.class._count.students}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({getAttendanceRate(session)}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {session._count.assignments > 0 ? (
                        <Badge variant="outline">{session._count.assignments}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {session.tags.slice(0, 2).map(({ tag }) => (
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
                        {session.tags.length > 2 && (
                          <Badge variant="outline">
                            +{session.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/sessions/${session.id}`)}
                      >
                        상세
                      </Button>
                    </TableCell>
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
