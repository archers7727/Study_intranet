'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

const classFormSchema = z.object({
  name: z.string().min(1, '클래스명을 입력해주세요.'),
  description: z.string().optional(),
  cost: z.string().optional(),
  mainTeacherId: z.string().min(1, '담당 교사를 선택해주세요.'),
  assistantTeacherIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
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

interface Tag {
  id: string
  name: string
  color: string
}

export default function NewClassPage() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: '',
      description: '',
      cost: '',
      mainTeacherId: '',
      assistantTeacherIds: [],
      tagIds: [],
    },
  })

  useEffect(() => {
    fetchTeachers()
    fetchTags()
  }, [])

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

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (!response.ok) throw new Error('Failed to fetch tags')
      const data = await response.json()
      setTags(data.data || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const onSubmit = async (data: ClassFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
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
        throw new Error(error.error?.message || 'Failed to create class')
      }

      const result = await response.json()
      router.push(`/classes/${result.data.id}`)
    } catch (error: any) {
      console.error('Error creating class:', error)
      alert(error.message || '클래스 생성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/classes')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        클래스 목록으로
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>새 클래스 생성</CardTitle>
          <CardDescription>
            새로운 클래스를 생성하고 담당 교사를 지정하세요.
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

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/classes')}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '생성 중...' : '클래스 생성'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
