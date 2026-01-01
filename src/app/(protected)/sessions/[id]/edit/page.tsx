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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

const sessionFormSchema = z.object({
  sessionDate: z.string().min(1, '날짜를 입력해주세요.'),
  startTime: z.string().min(1, '시작 시간을 입력해주세요.'),
  endTime: z.string().min(1, '종료 시간을 입력해주세요.'),
  location: z.string().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
})

type SessionFormValues = z.infer<typeof sessionFormSchema>

export default function EditSessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      sessionDate: '',
      startTime: '',
      endTime: '',
      location: '',
      status: 'SCHEDULED',
      notes: '',
    },
  })

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)
      if (!response.ok) throw new Error('Failed to fetch session')
      const data = await response.json()

      const sessionData = data.data
      form.reset({
        sessionDate: sessionData.sessionDate.split('T')[0],
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        location: sessionData.location || '',
        status: sessionData.status,
        notes: sessionData.notes || '',
      })
      setLoading(false)
    } catch (error) {
      console.error('Error fetching session:', error)
      alert('세션 정보를 불러오는데 실패했습니다.')
      router.push('/sessions')
    }
  }

  const onSubmit = async (data: SessionFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to update session')
      }

      router.push(`/sessions/${sessionId}`)
    } catch (error: any) {
      console.error('Error updating session:', error)
      alert(error.message || '세션 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 세션을 삭제하시겠습니까? 출석이나 과제가 있는 경우 취소 상태로 변경됩니다.')) {
      return
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to delete session')
      }

      router.push('/sessions')
    } catch (error: any) {
      console.error('Error deleting session:', error)
      alert(error.message || '세션 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8">로딩 중...</div>
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => router.push(`/sessions/${sessionId}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        세션 상세로
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>세션 수정</CardTitle>
          <CardDescription>
            세션 정보를 수정하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="sessionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>날짜 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>시작 시간 *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>종료 시간 *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>장소</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 3층 수학교실" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상태 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SCHEDULED">예정</SelectItem>
                        <SelectItem value="IN_PROGRESS">진행중</SelectItem>
                        <SelectItem value="COMPLETED">완료</SelectItem>
                        <SelectItem value="CANCELLED">취소</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>메모</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="세션에 대한 메모를 입력하세요..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      수업 준비사항이나 특이사항을 기록하세요.
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
                  삭제
                </Button>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/sessions/${sessionId}`)}
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
