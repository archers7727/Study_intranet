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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Edit, Calendar, Clock, FileText, Users, CheckCircle, Download } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { ko } from 'date-fns/locale'

interface AssignmentDetail {
  id: string
  title: string
  description: string | null
  dueDate: string
  maxScore: number | null
  session: {
    id: string
    sessionDate: string
    startTime: string
    endTime: string
    class: {
      id: string
      name: string
      mainTeacher: {
        id: string
        name: string
      }
    }
  }
  createdBy: {
    id: string
    name: string
  }
  submissions: Array<{
    id: string
    status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED'
    submittedAt: string | null
    fileUrl: string | null
    score: number | null
    feedback: string | null
    gradedAt: string | null
    student: {
      id: string
      studentId: string
      name: string
    }
    gradedBy: {
      id: string
      name: string
    } | null
  }>
  tags: Array<{
    tag: {
      id: string
      name: string
      color: string
    }
  }>
}

export default function AssignmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [score, setScore] = useState<string>('')
  const [feedback, setFeedback] = useState<string>('')
  const [grading, setGrading] = useState(false)

  useEffect(() => {
    fetchAssignment()
  }, [assignmentId])

  const fetchAssignment = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch assignment')
      }

      const data = await response.json()
      setAssignment(data.data)
    } catch (error) {
      console.error('Error fetching assignment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return

    setGrading(true)
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedSubmission.student.id,
          score: score ? parseInt(score) : null,
          feedback,
          action: 'grade'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to grade submission')
      }

      await fetchAssignment()
      setGradeDialogOpen(false)
      setSelectedSubmission(null)
      setScore('')
      setFeedback('')
      alert('채점이 완료되었습니다.')
    } catch (error) {
      console.error('Error grading submission:', error)
      alert('채점에 실패했습니다.')
    } finally {
      setGrading(false)
    }
  }

  const openGradeDialog = (submission: any) => {
    setSelectedSubmission(submission)
    setScore(submission.score?.toString() || '')
    setFeedback(submission.feedback || '')
    setGradeDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOT_SUBMITTED':
        return <Badge variant="outline">미제출</Badge>
      case 'SUBMITTED':
        return <Badge variant="default">제출완료</Badge>
      case 'GRADED':
        return <Badge variant="success">채점완료</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getSubmissionStats = () => {
    if (!assignment) return { total: 0, submitted: 0, graded: 0, notSubmitted: 0 }

    const total = assignment.submissions.length
    const submitted = assignment.submissions.filter(s => s.status === 'SUBMITTED').length
    const graded = assignment.submissions.filter(s => s.status === 'GRADED').length
    const notSubmitted = assignment.submissions.filter(s => s.status === 'NOT_SUBMITTED').length

    return { total, submitted, graded, notSubmitted }
  }

  if (loading) {
    return <div className="container mx-auto py-8">로딩 중...</div>
  }

  if (!assignment) {
    return <div className="container mx-auto py-8">과제를 찾을 수 없습니다.</div>
  }

  const stats = getSubmissionStats()
  const isOverdue = isPast(new Date(assignment.dueDate))

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

      {/* 과제 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">{assignment.title}</CardTitle>
              <CardDescription>
                {assignment.session.class.name} | 담당: {assignment.createdBy.name}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/assignments/${assignment.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                수정
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">세션 날짜</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  {format(new Date(assignment.session.sessionDate), 'PPP', { locale: ko })}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">세션 시간</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>
                  {assignment.session.startTime} - {assignment.session.endTime}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">마감일</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                  {format(new Date(assignment.dueDate), 'PPP', { locale: ko })}
                </span>
                {isOverdue && (
                  <Badge variant="destructive">기한초과</Badge>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">만점</div>
              <div>
                {assignment.maxScore ? `${assignment.maxScore}점` : '점수 없음'}
              </div>
            </div>

            {assignment.description && (
              <div className="col-span-2">
                <div className="text-sm text-gray-500 mb-1">설명</div>
                <div className="text-sm">{assignment.description}</div>
              </div>
            )}

            {assignment.tags.length > 0 && (
              <div className="col-span-2">
                <div className="text-sm text-gray-500 mb-1">태그</div>
                <div className="flex flex-wrap gap-1">
                  {assignment.tags.map(({ tag }) => (
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

      {/* 제출 현황 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>제출 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">전체</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
              <div className="text-sm text-gray-500">제출완료</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
              <div className="text-sm text-gray-500">채점완료</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.notSubmitted}</div>
              <div className="text-sm text-gray-500">미제출</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 제출물 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>제출물 목록</CardTitle>
          <CardDescription>학생들의 과제 제출 현황</CardDescription>
        </CardHeader>
        <CardContent>
          {assignment.submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              제출물이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>학생</TableHead>
                  <TableHead>학번</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>제출일시</TableHead>
                  <TableHead>파일</TableHead>
                  <TableHead>점수</TableHead>
                  <TableHead>피드백</TableHead>
                  <TableHead>채점자</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignment.submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.student.name}
                    </TableCell>
                    <TableCell>{submission.student.studentId}</TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>
                      {submission.submittedAt ? (
                        <span className="text-sm">
                          {format(new Date(submission.submittedAt), 'PPP HH:mm', { locale: ko })}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.fileUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(submission.fileUrl!, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          다운로드
                        </Button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.score !== null ? (
                        <span className="font-medium">{submission.score}점</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.feedback ? (
                        <div className="max-w-xs truncate text-sm">
                          {submission.feedback}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.gradedBy ? (
                        <span className="text-sm">{submission.gradedBy.name}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.status !== 'NOT_SUBMITTED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openGradeDialog(submission)}
                        >
                          {submission.status === 'GRADED' ? '재채점' : '채점'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 채점 Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>과제 채점</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.student.name} 학생의 과제를 채점합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">점수</label>
              <Input
                type="number"
                placeholder={assignment.maxScore ? `${assignment.maxScore}점 만점` : '점수 입력'}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                max={assignment.maxScore || undefined}
              />
            </div>
            <div>
              <label className="text-sm font-medium">피드백</label>
              <Textarea
                placeholder="학생에게 전달할 피드백을 입력하세요..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setGradeDialogOpen(false)}
                disabled={grading}
              >
                취소
              </Button>
              <Button
                onClick={handleGradeSubmission}
                disabled={grading}
              >
                {grading ? '저장 중...' : '채점 완료'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
