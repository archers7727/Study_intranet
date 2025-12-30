'use client'

import { useState, useEffect } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, BarChart3 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

interface Tag {
  id: string
  name: string
  color: string
  category: string | null
  description: string | null
  usageCount: number
  breakdown: {
    students: number
    classes: number
    sessions: number
    materials: number
  }
}

interface Stats {
  totalTags: number
  totalTaggedItems: number
  untaggedCount: {
    total: number
    students: number
    classes: number
    sessions: number
    materials: number
  }
  avgTagsPerItem: number
  topTags: Array<{
    id: string
    name: string
    color: string
    usageCount: number
  }>
}

const tagSchema = z.object({
  name: z.string().min(1, '태그 이름은 필수입니다.'),
  color: z.string().min(1, '색상은 필수입니다.'),
  category: z.string().optional(),
  description: z.string().optional(),
})

type TagFormData = z.infer<typeof tagSchema>

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [showStats, setShowStats] = useState(false)

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      color: '#3B82F6',
      category: '',
      description: ''
    }
  })

  useEffect(() => {
    fetchTags()
    fetchStats()
  }, [])

  const fetchTags = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)

      const response = await fetch(`/api/tags?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch tags')

      const data = await response.json()
      setTags(data.tags)
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tags/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSearch = () => {
    fetchTags()
  }

  const handleCreate = () => {
    setEditingTag(null)
    form.reset({
      name: '',
      color: '#3B82F6',
      category: '',
      description: ''
    })
    setShowDialog(true)
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    form.reset({
      name: tag.name,
      color: tag.color,
      category: tag.category || '',
      description: tag.description || ''
    })
    setShowDialog(true)
  }

  const handleDelete = async (tag: Tag) => {
    if (tag.usageCount > 0) {
      alert(`이 태그는 ${tag.usageCount}개의 항목에서 사용 중입니다. 먼저 연결을 해제해주세요.`)
      return
    }

    if (!confirm(`"${tag.name}" 태그를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/tags/${tag.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete tag')

      alert('태그가 삭제되었습니다.')
      fetchTags()
      fetchStats()
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('태그 삭제에 실패했습니다.')
    }
  }

  const onSubmit = async (data: TagFormData) => {
    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags'
      const method = editingTag ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          category: data.category || null,
          description: data.description || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || '태그 저장에 실패했습니다.')
      }

      alert(editingTag ? '태그가 수정되었습니다.' : '태그가 생성되었습니다.')
      setShowDialog(false)
      fetchTags()
      fetchStats()
    } catch (error: any) {
      console.error('Error saving tag:', error)
      alert(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">태그 관리</h1>
          <p className="text-muted-foreground">시스템 전체에서 사용되는 태그를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowStats(!showStats)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            통계
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            태그 생성
          </Button>
        </div>
      </div>

      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">총 태그 수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTags}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">총 태그된 항목</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTaggedItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">미지정 항목</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.untaggedCount.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                학생: {stats.untaggedCount.students}, 클래스: {stats.untaggedCount.classes}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">평균 태그 수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgTagsPerItem}</div>
              <p className="text-xs text-muted-foreground mt-1">항목당 평균</p>
            </CardContent>
          </Card>

          {stats.topTags.length > 0 && (
            <Card className="md:col-span-2 lg:col-span-4">
              <CardHeader>
                <CardTitle>인기 태그 TOP 5</CardTitle>
                <CardDescription>가장 많이 사용된 태그입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {stats.topTags.map((tag, index) => (
                    <div key={tag.id} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <Badge
                        variant="outline"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({tag.usageCount})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>태그 목록</CardTitle>
          <CardDescription>총 {tags.length}개의 태그가 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="태그 이름으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              태그가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>태그</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>사용량</TableHead>
                  <TableHead>상세</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{tag.category || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {tag.description || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{tag.usageCount}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      학생: {tag.breakdown.students} | 클래스: {tag.breakdown.classes} |
                      세션: {tag.breakdown.sessions} | 자료: {tag.breakdown.materials}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tag)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tag)}
                          disabled={tag.usageCount > 0}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? '태그 수정' : '새 태그 만들기'}
            </DialogTitle>
            <DialogDescription>
              태그 정보를 입력해주세요. 색상은 태그 표시에 사용됩니다.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>태그 이름 *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 수학" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>색상 *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="color" {...field} className="w-20 h-10" />
                      </FormControl>
                      <Input value={field.value} readOnly className="flex-1" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 과목" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Input placeholder="태그 설명" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  취소
                </Button>
                <Button type="submit">
                  {editingTag ? '수정' : '생성'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
