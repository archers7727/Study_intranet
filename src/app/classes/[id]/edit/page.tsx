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
import { Switch } from '@/components/ui/switch'
import { ArrowLeft } from 'lucide-react'

const classFormSchema = z.object({
  name: z.string().min(1, '클래스명을 입력해주세요.'),
  description: z.string().optional(),
  cost: z.string().optional(),
  mainTeacherId: z.string().min(1, '담당 교사를 선택해주세요.'),
  isActive: z.boolean(),
})

type ClassFormValues = z.infer<typeof classFormSchema>

interface Teacher {
  id: string
  name: string
  user: {
    email: string
    roleLevel: string
  }
}

export default function EditClassPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.id as string

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: '',
      description: '',
      cost: '',
      mainTeacherId: '',
      isActive: true,
    },
  })

  useEffect(() => {
    fetchTeachers()
    fetchClass()
  }, [classId])

  const fetchClass = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`)
      if (!response.ok) throw new Error('Failed to fetch class')
      const data = await response.json()

      const classData = data.data
      form.reset({
        name: classData.name,
        description: classData.description || '',
        cost: classData.cost ? classData.cost.toString() : '',
        mainTeacherId: classData.mainTeacher.id,
        isActive: classData.isActive,
      })
      setLoading(false)
    } catch (error) {
      console.error('Error fetching class:', error)
      alert('클래스 정보를 불러오는데 실패했습니다.')
      router.push('/classes')
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers')
      if (!response.ok) throw new Error('Failed to fetch teachers')
      const data = await response.json()
      setTeachers(data.data || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const onSubmit = async (data: ClassFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          cost: data.cost ? parseFloat(data.cost) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to update class')
      }

      router.push(`/classes/${classId}`)
    } catch (error: any) {
      console.error('Error updating class:', error)
      alert(error.message || '클래스 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 클래스를 삭제하시겠습니까? 수강생이나 세션이 있는 경우 비활성화됩니다.')) {
      return
    }

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to delete class')
      }

      router.push('/classes')
    } catch (error: any) {
      console.error('Error deleting class:', error)
      alert(error.message || '클래스 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8">로딩 중...</div>
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => router.push(`/classes/${classId}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        클래스 상세로
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>클래스 수정</CardTitle>
          <CardDescription>
            클래스 정보를 수정하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>클래스명 *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 초등 수학 기초반" {...field} />
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
                        placeholder="클래스에 대한 설명을 입력하세요..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>수강료 (원)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="예: 300000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      월 단위 수강료를 입력하세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mainTeacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>담당 교사 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="담당 교사를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers
                          .filter((t) =>
                            ['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(
                              t.user.roleLevel
                            )
                          )
                          .map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} ({teacher.user.roleLevel})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">활성 상태</FormLabel>
                      <FormDescription>
                        비활성화하면 클래스가 목록에서 숨겨집니다.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
                    onClick={() => router.push(`/classes/${classId}`)}
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
