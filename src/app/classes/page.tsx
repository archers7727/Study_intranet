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
import { Plus, Search, Users, BookOpen } from 'lucide-react'

interface Class {
  id: string
  name: string
  description: string | null
  cost: number | null
  isActive: boolean
  mainTeacher: {
    id: string
    name: string
    user: {
      email: string
      roleLevel: string
    }
  }
  assistantTeachers: Array<{
    teacher: {
      id: string
      name: string
    }
  }>
  _count: {
    students: number
    sessions: number
  }
  tags: Array<{
    tag: {
      id: string
      name: string
      color: string
    }
  }>
}

export default function ClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter === 'active') params.append('isActive', 'true')
      if (statusFilter === 'inactive') params.append('isActive', 'false')

      const response = await fetch(`/api/classes?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }

      const data = await response.json()
      setClasses(data.data || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [statusFilter])

  const handleSearch = () => {
    fetchClasses()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">클래스 관리</h1>
        <p className="text-gray-600">클래스를 관리하고 수강생을 등록하세요</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>클래스 목록</CardTitle>
              <CardDescription>전체 {classes.length}개 클래스</CardDescription>
            </div>
            <Button onClick={() => router.push('/classes/new')}>
              <Plus className="mr-2 h-4 w-4" />
              새 클래스
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 검색 및 필터 */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="클래스명 또는 설명 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="max-w-sm"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 클래스 목록 테이블 */}
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              클래스가 없습니다. 새 클래스를 생성하세요.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>클래스명</TableHead>
                  <TableHead>담당 교사</TableHead>
                  <TableHead>수강생</TableHead>
                  <TableHead>세션</TableHead>
                  <TableHead>수강료</TableHead>
                  <TableHead>태그</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem) => (
                  <TableRow
                    key={classItem.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/classes/${classItem.id}`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{classItem.name}</div>
                        {classItem.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {classItem.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{classItem.mainTeacher.name}</div>
                        {classItem.assistantTeachers.length > 0 && (
                          <div className="text-xs text-gray-500">
                            +{classItem.assistantTeachers.length} 보조
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{classItem._count.students}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span>{classItem._count.sessions}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(classItem.cost)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {classItem.tags.slice(0, 2).map(({ tag }) => (
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
                        {classItem.tags.length > 2 && (
                          <Badge variant="outline">
                            +{classItem.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {classItem.isActive ? (
                        <Badge variant="success">활성</Badge>
                      ) : (
                        <Badge variant="secondary">비활성</Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/classes/${classItem.id}/edit`)}
                      >
                        수정
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
