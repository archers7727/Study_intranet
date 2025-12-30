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
import { Plus, Search } from 'lucide-react'

interface Student {
  id: string
  studentId: string
  name: string
  email: string
  school: string | null
  phone: string
  grade: string
  enrollmentStatus: 'ENROLLED' | 'WAITING' | 'LEFT'
  managementStatus: 'NORMAL' | 'CAUTION'
  classCount: number
  attendanceCount: number
  tags: Array<{ id: string; name: string; color: string }>
}

interface Pagination {
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    hasNext: false
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await fetch(`/api/students?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }

      const data = await response.json()
      setStudents(data.students)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [pagination.page, statusFilter])

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchStudents()
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
        return <Badge variant="default">정상</Badge>
      case 'CAUTION':
        return <Badge variant="destructive">주의</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">학생 관리</h1>
          <p className="text-muted-foreground">원생의 정보를 조회하고 관리합니다.</p>
        </div>
        <Button onClick={() => router.push('/students/new')}>
          <Plus className="mr-2 h-4 w-4" />
          학생 등록
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>학생 목록</CardTitle>
          <CardDescription>
            총 {pagination.total}명의 학생이 등록되어 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="이름 또는 학교명으로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="재원 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="ENROLLED">재원</SelectItem>
                <SelectItem value="WAITING">대기</SelectItem>
                <SelectItem value="LEFT">퇴원</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              로딩 중...
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              등록된 학생이 없습니다.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학생ID</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>학년</TableHead>
                    <TableHead>학교</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>재원 상태</TableHead>
                    <TableHead>관리 상태</TableHead>
                    <TableHead>수강 클래스</TableHead>
                    <TableHead>출석 횟수</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">
                        {student.studentId}
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>{student.school || '-'}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>
                        {getEnrollmentStatusBadge(student.enrollmentStatus)}
                      </TableCell>
                      <TableCell>
                        {getManagementStatusBadge(student.managementStatus)}
                      </TableCell>
                      <TableCell>{student.classCount}</TableCell>
                      <TableCell>{student.attendanceCount}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/students/${student.id}`)}
                        >
                          상세
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {pagination.total}명 중 {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}명 표시
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNext}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
