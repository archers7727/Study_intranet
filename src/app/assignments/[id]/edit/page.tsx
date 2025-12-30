'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ArrowLeft } from 'lucide-react'

const assignmentFormSchema = z.object({
  title: z.string().min(1, '과제명을 입력해주세요.'),
  description: z.string().optional(),
  dueDate: z.string().min(1, '마감일을 입력해주세요.'),
  maxScore: z.string().optional(),
})

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>

export default function EditAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      maxScore: '',
    },
  })

  useEffect(() => {
    fetchAssignment()
  }, [assignmentId])

  const fetchAssignment = async () => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`)
      if (!response.ok) throw new Error('Failed to fetch assignment')
      const data = await response.json()

      const assignment = data.data
      form.reset({
        title: assignment.title,
        description: assignment.description || '',
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
        maxScore: assignment.maxScore ? assignment.maxScore.toString() : '',
      })
      setLoading(false)
    } catch (error) {
      console.error('Error fetching assignment:', error)
      alert('과제 정보를 불러오는데 실패했습니다.')
      router.push('/assignments')
    }
  }

  const onSubmit = async (data: AssignmentFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          maxScore: data.maxScore ? parseInt(data.maxScore) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to update assignment')
      }

      router.push(`/assignments/${assignmentId}`)
    } catch (error: any) {
      console.error('Error updating assignment:', error)
      alert(error.message || '과제 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 과제를 삭제하시겠습니까? 제출된 과제도 함께 삭제됩니다.')) {
      return
    }

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to delete assignment')
      }

      router.push('/assignments')
    } catch (error: any) {
      console.error('Error deleting assignment:', error)
      alert(error.message || '과제 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8">로딩 중...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        뒤로 가기
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>과제 수정</CardTitle>
          <CardDescription>과제 정보를 수정합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>과제명 *</FormLabel>
                    <FormControl>
                      <Input placeholder="과제 제목을 입력하세요" {...field} />
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
                      <Textarea
                        placeholder="과제 설명을 입력하세요"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      과제에 대한 상세 설명을 입력하세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>마감일 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      과제 제출 마감일을 설정하세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>만점</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="예: 100"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      과제의 만점을 입력하세요 (선택사항).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  과제 삭제
                </Button>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
