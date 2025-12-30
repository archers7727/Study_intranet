'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Copy, Check } from 'lucide-react'

const studentSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다.'),
  birthDate: z.string().min(1, '생년월일을 입력해주세요.'),
  gender: z.enum(['MALE', 'FEMALE'], {
    required_error: '성별을 선택해주세요.'
  }),
  school: z.string().optional(),
  phone: z.string().min(10, '올바른 연락처를 입력해주세요.'),
  parentId: z.string().optional(),
})

type StudentFormData = z.infer<typeof studentSchema>

interface GeneratedCredentials {
  studentId: string
  password: string
}

export default function NewStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [credentials, setCredentials] = useState<GeneratedCredentials | null>(null)
  const [copied, setCopied] = useState<{ id: boolean; password: boolean }>({
    id: false,
    password: false
  })

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      birthDate: '',
      gender: undefined,
      school: '',
      phone: '',
      parentId: ''
    }
  })

  const onSubmit = async (data: StudentFormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          school: data.school || null,
          parentId: data.parentId || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || '학생 등록에 실패했습니다.')
      }

      const result = await response.json()

      // 생성된 학생 ID와 비밀번호 표시
      setCredentials({
        studentId: result.generatedStudentId,
        password: result.generatedPassword
      })
      setShowCredentials(true)
    } catch (error: any) {
      console.error('Error creating student:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: 'id' | 'password') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(prev => ({ ...prev, [field]: true }))
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [field]: false }))
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDialogClose = () => {
    setShowCredentials(false)
    router.push('/students')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>학생 등록</CardTitle>
          <CardDescription>
            새로운 학생 정보를 입력해주세요. 학생 ID와 초기 비밀번호는 자동으로 생성됩니다.
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
                    <FormLabel>이름 *</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>생년월일 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      학년은 생년월일을 기준으로 자동 계산됩니다.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>성별 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="성별 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MALE">남</SelectItem>
                        <SelectItem value="FEMALE">여</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      초기 비밀번호 생성에 사용됩니다.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처 *</FormLabel>
                    <FormControl>
                      <Input placeholder="01012345678" {...field} />
                    </FormControl>
                    <FormDescription>
                      학생 ID 생성에 사용됩니다. (끝 5자리)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>학교</FormLabel>
                    <FormControl>
                      <Input placeholder="서울초등학교" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? '등록 중...' : '학생 등록'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={showCredentials} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학생 등록 완료</DialogTitle>
            <DialogDescription>
              아래 정보를 학생에게 안내해주세요. 최초 로그인 시 비밀번호를 변경할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {credentials && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">학생 ID (이메일)</label>
                <div className="flex gap-2">
                  <Input
                    value={`${credentials.studentId}@student.local`}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(`${credentials.studentId}@student.local`, 'id')}
                  >
                    {copied.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">초기 비밀번호</label>
                <div className="flex gap-2">
                  <Input
                    value={credentials.password}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(credentials.password, 'password')}
                  >
                    {copied.password ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  비밀번호는 생년월일 6자리 + 성별 코드(남:3, 여:4)로 생성됩니다.
                </p>
              </div>

              <Button onClick={handleDialogClose} className="w-full mt-4">
                확인
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
