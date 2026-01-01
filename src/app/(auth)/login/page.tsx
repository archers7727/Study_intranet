'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { BookOpen, Mail, Lock, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email({ message: '올바른 이메일 주소를 입력해주세요.' }),
  password: z.string().min(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error?.message || '로그인에 실패했습니다.')
        return
      }

      // 로그인 성공 시 리다이렉트
      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setError('로그인 중 오류가 발생했습니다.')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Study Intranet</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            효율적인 학원 관리의<br />새로운 기준
          </h1>
          <p className="text-lg text-white/80">
            학생 관리, 수업 스케줄링, 과제 관리까지<br />
            모든 것을 한 곳에서 관리하세요.
          </p>
        </div>
        <p className="text-sm text-white/60">
          &copy; 2024 Study Intranet. All rights reserved.
        </p>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white dark:bg-slate-950">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex lg:hidden items-center justify-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Study Intranet</span>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">로그인</CardTitle>
              <CardDescription>
                Study Intranet 계정으로 로그인하세요
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">이메일</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="example@email.com"
                            className="pl-10 h-11"
                            {...field}
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">비밀번호</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            className="pl-10 h-11"
                            {...field}
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      로그인 중...
                    </>
                  ) : (
                    '로그인'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                계정이 없으신가요?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  회원가입
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
