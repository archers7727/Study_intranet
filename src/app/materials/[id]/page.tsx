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
import { ArrowLeft, Download, File, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface MaterialDetail {
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
    phone: string | null
    user: {
      email: string
    }
  }
  sessions: Array<{
    addedAt: string
    session: {
      id: string
      sessionDate: string
      startTime: string
      endTime: string
      class: {
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

export default function MaterialDetailPage() {
  const router = useRouter()
  const params = useParams()
  const materialId = params.id as string

  const [material, setMaterial] = useState<MaterialDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMaterial()
  }, [materialId])

  const fetchMaterial = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/materials/${materialId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch material')
      }

      const data = await response.json()
      setMaterial(data.data)
    } catch (error) {
      console.error('Error fetching material:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 자료를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to delete material')
      }

      router.push('/materials')
    } catch (error: any) {
      console.error('Error deleting material:', error)
      alert(error.message || '자료 삭제에 실패했습니다.')
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return <div className="container mx-auto py-8">로딩 중...</div>
  }

  if (!material) {
    return <div className="container mx-auto py-8">자료를 찾을 수 없습니다.</div>
  }

  return (
    <div className="container mx-auto py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/materials')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          자료 목록으로
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{material.title}</h1>
            {material.description && (
              <p className="text-gray-600">{material.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => window.open(material.fileUrl, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              다운로드
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
          </div>
        </div>
      </div>

      {/* 자료 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>자료 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">파일 타입</div>
              <div className="font-medium flex items-center gap-2">
                <File className="h-4 w-4 text-gray-400" />
                {material.fileType || '알 수 없음'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">파일 크기</div>
              <div className="font-medium">{formatFileSize(material.fileSize)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">업로드자</div>
              <div className="font-medium">{material.createdBy.name}</div>
              <div className="text-xs text-gray-500">{material.createdBy.user.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">업로드일</div>
              <div className="font-medium">
                {format(new Date(material.createdAt), 'PPP', { locale: ko })}
              </div>
            </div>
            {material.tags.length > 0 && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500 mb-2">태그</div>
                <div className="flex flex-wrap gap-2">
                  {material.tags.map(({ tag }) => (
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

      {/* 연결된 세션 */}
      <Card>
        <CardHeader>
          <CardTitle>사용된 세션 ({material.sessions.length})</CardTitle>
          <CardDescription>
            이 자료가 사용된 수업 세션 목록
          </CardDescription>
        </CardHeader>
        <CardContent>
          {material.sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 세션에 추가되지 않았습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>시간</TableHead>
                  <TableHead>클래스</TableHead>
                  <TableHead>추가일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {material.sessions.map(({ session, addedAt }) => (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/sessions/${session.id}`)}
                  >
                    <TableCell>
                      {format(new Date(session.sessionDate), 'PPP', { locale: ko })}
                    </TableCell>
                    <TableCell>
                      {session.startTime} - {session.endTime}
                    </TableCell>
                    <TableCell className="font-medium">
                      {session.class.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(addedAt), 'PPP', { locale: ko })}
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
