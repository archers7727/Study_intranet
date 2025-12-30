'use client'

import { useState } from 'react'
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
import { ArrowLeft, Upload } from 'lucide-react'

const materialFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  description: z.string().optional(),
  fileUrl: z.string().url('올바른 URL을 입력해주세요.'),
  fileType: z.string().optional(),
  fileSize: z.string().optional(),
})

type MaterialFormValues = z.infer<typeof materialFormSchema>

export default function NewMaterialPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      title: '',
      description: '',
      fileUrl: '',
      fileType: '',
      fileSize: '',
    },
  })

  const onSubmit = async (data: MaterialFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to create material')
      }

      const result = await response.json()
      router.push(`/materials/${result.data.id}`)
    } catch (error: any) {
      console.error('Error creating material:', error)
      alert(error.message || '자료 업로드에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/materials')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        자료 목록으로
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>자료 업로드</CardTitle>
          <CardDescription>
            새로운 학습 자료를 업로드하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목 *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 2학기 수학 교재" {...field} />
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
                        placeholder="자료에 대한 설명을 입력하세요..."
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
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>파일 URL *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/file.pdf"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      파일이 업로드된 URL을 입력하세요. (예: Google Drive, Dropbox 등)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fileType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>파일 타입</FormLabel>
                    <FormControl>
                      <Input placeholder="예: PDF, DOCX, MP4" {...field} />
                    </FormControl>
                    <FormDescription>
                      파일의 확장자나 타입을 입력하세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fileSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>파일 크기 (bytes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="예: 1024000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      파일 크기를 바이트 단위로 입력하세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/materials')}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isSubmitting ? '업로드 중...' : '자료 업로드'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
