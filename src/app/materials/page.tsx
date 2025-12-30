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
import { Plus, Search, File, Download, FileText, FileImage, FileVideo, FileArchive } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Material {
  id: string
  title: string
  description: string | null
  fileUrl: string
  fileType: string | null
  fileSize: number | null
  createdAt: string
  createdBy: {
    id: string
    name: string
    user: {
      email: string
    }
  }
  _count: {
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

export default function MaterialsPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all')

  useEffect(() => {
    fetchMaterials()
  }, [fileTypeFilter])

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (fileTypeFilter !== 'all') params.append('fileType', fileTypeFilter)

      const response = await fetch(`/api/materials?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch materials')
      }

      const data = await response.json()
      setMaterials(data.data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchMaterials()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-4 w-4 text-gray-400" />

    const type = fileType.toLowerCase()
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
    if (type.includes('image') || type.includes('png') || type.includes('jpg'))
      return <FileImage className="h-4 w-4 text-blue-500" />
    if (type.includes('video')) return <FileVideo className="h-4 w-4 text-purple-500" />
    if (type.includes('zip') || type.includes('rar'))
      return <FileArchive className="h-4 w-4 text-yellow-500" />

    return <File className="h-4 w-4 text-gray-400" />
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">학습 자료</h1>
        <p className="text-gray-600">수업 자료를 업로드하고 관리하세요</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>자료 목록</CardTitle>
              <CardDescription>전체 {materials.length}개 자료</CardDescription>
            </div>
            <Button onClick={() => router.push('/materials/new')}>
              <Plus className="mr-2 h-4 w-4" />
              자료 업로드
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 검색 및 필터 */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="자료명 또는 설명 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="max-w-sm"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="파일 타입" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 타입</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">이미지</SelectItem>
                <SelectItem value="video">비디오</SelectItem>
                <SelectItem value="document">문서</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 자료 목록 테이블 */}
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              자료가 없습니다. 새 자료를 업로드하세요.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>파일</TableHead>
                  <TableHead>크기</TableHead>
                  <TableHead>업로드자</TableHead>
                  <TableHead>세션</TableHead>
                  <TableHead>태그</TableHead>
                  <TableHead>업로드일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow
                    key={material.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/materials/${material.id}`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{material.title}</div>
                        {material.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {material.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(material.fileType)}
                        <span className="text-sm">{material.fileType || '파일'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatFileSize(material.fileSize)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{material.createdBy.name}</div>
                        <div className="text-xs text-gray-500">
                          {material.createdBy.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {material._count.sessions > 0 ? (
                        <Badge variant="outline">{material._count.sessions}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {material.tags.slice(0, 2).map(({ tag }) => (
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
                        {material.tags.length > 2 && (
                          <Badge variant="outline">
                            +{material.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(material.createdAt), 'PPP', { locale: ko })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(material.fileUrl, '_blank')}
                      >
                        <Download className="h-4 w-4" />
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
