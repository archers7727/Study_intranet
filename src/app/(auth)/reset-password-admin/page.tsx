'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminResetPasswordPage() {
  const [email, setEmail] = useState('admin@study.com')
  const [newPassword, setNewPassword] = useState('')
  const [result, setResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleReset() {
    if (!email || !newPassword) {
      setResult('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setResult('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      })

      const data = await response.json()

      if (data.success) {
        setResult('✅ 비밀번호가 성공적으로 재설정되었습니다!')
        setNewPassword('')
      } else {
        setResult(`❌ 오류: ${data.error?.message || '알 수 없는 오류'}`)
      }
    } catch (error: any) {
      setResult(`❌ 오류: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>관리자 비밀번호 재설정</CardTitle>
          <CardDescription>
            임시로 사용자의 비밀번호를 재설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">이메일</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm font-medium">새 비밀번호 (최소 6자)</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="최소 6자 이상"
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleReset} disabled={isLoading} className="w-full">
            {isLoading ? '재설정 중...' : '비밀번호 재설정'}
          </Button>
          {result && (
            <div className={`rounded-md p-3 text-sm ${
              result.startsWith('✅')
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}>
              {result}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
