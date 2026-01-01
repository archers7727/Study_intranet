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
import { Plus, Calendar, FileText, Users, CheckCircle } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string
  maxScore: number | null
  session: {
    id: string
    sessionDate: string
    class: {
      id: string
      name: string
    }
  }
  createdBy: {
    id: string
    name: string
  }
  _count: {
    submissions: number
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

export default function AssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')

  useEffect(() => {
    fetchClasses()
    fetchAssignments()
  }, [classFilter])

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

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (classFilter !== 'all') params.append('classId', classFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/assignments?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }

      const data = await response.json()
      setAssignments(data.data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchAssignments()
  }

  const isOverdue = (dueDate: string) => {
    return isPast(new Date(dueDate))
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">과제 관리</h1>
        <p className="text-gray-600">학생들의 과제를 관리하고 채점하세요</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>과제 목록</CardTitle>
              <CardDescription>전체 {assignments.length}개 과제</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 필터 */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="과제 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-xs"
              />
              <Button onClick={handleSearch} variant="secondary">
                검색
              </Button>

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
            </div>
          </div>

          {/* 과제 목록 테이블 */}
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              과제가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>과제명</TableHead>
                  <TableHead>클래스</TableHead>
                  <TableHead>세션 날짜</TableHead>
                  <TableHead>마감일</TableHead>
                  <TableHead>만점</TableHead>
                  <TableHead>제출</TableHead>
                  <TableHead>담당교사</TableHead>
                  <TableHead>태그</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow
                    key={assignment.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/assignments/${assignment.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{assignment.title}</div>
                          {assignment.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">
                              {assignment.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{assignment.session.class.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {format(new Date(assignment.session.sessionDate), 'PPP', { locale: ko })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className={`text-sm ${isOverdue(assignment.dueDate) ? 'text-red-500 font-medium' : ''}`}>
                          {format(new Date(assignment.dueDate), 'PPP', { locale: ko })}
                        </span>
                        {isOverdue(assignment.dueDate) && (
                          <Badge variant="destructive">기한초과</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.maxScore ? (
                        <span>{assignment.maxScore}점</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{assignment._count.submissions}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{assignment.createdBy.name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {assignment.tags.slice(0, 2).map(({ tag }) => (
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
                        {assignment.tags.length > 2 && (
                          <Badge variant="outline">
                            +{assignment.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/assignments/${assignment.id}`)}
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
