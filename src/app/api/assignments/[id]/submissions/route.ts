import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// POST /api/assignments/[id]/submissions - 과제 제출 또는 채점
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id: assignmentId } = await params

    const body = await request.json()
    const {
      studentId,
      fileUrl,
      score,
      feedback,
      action = 'submit' // 'submit' or 'grade'
    } = body

    // 과제 존재 확인
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: { message: 'Assignment not found' } },
        { status: 404 }
      )
    }

    if (action === 'submit') {
      // 학생이 과제 제출
      if (!studentId) {
        return NextResponse.json(
          { success: false, error: { message: 'Student ID is required' } },
          { status: 400 }
        )
      }

      // 학생 존재 확인
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      })

      if (!student) {
        return NextResponse.json(
          { success: false, error: { message: 'Student not found' } },
          { status: 404 }
        )
      }

      // 제출물 생성 또는 업데이트
      const submission = await prisma.submission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId
          }
        },
        update: {
          status: 'SUBMITTED',
          fileUrl: fileUrl || null,
          submittedAt: new Date()
        },
        create: {
          assignmentId,
          studentId,
          status: 'SUBMITTED',
          fileUrl: fileUrl || null,
          submittedAt: new Date()
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              studentId: true
            }
          },
          gradedBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return NextResponse.json({ success: true, data: submission })
    } else if (action === 'grade') {
      // 교사가 과제 채점
      if (!['ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT'].includes(user.roleLevel)) {
        return NextResponse.json(
          { success: false, error: { message: 'Permission denied' } },
          { status: 403 }
        )
      }

      if (!studentId) {
        return NextResponse.json(
          { success: false, error: { message: 'Student ID is required' } },
          { status: 400 }
        )
      }

      // 교사 정보 조회
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id }
      })

      if (!teacher) {
        return NextResponse.json(
          { success: false, error: { message: 'Teacher profile not found' } },
          { status: 404 }
        )
      }

      // 제출물 존재 확인
      const existingSubmission = await prisma.submission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId
          }
        }
      })

      if (!existingSubmission) {
        return NextResponse.json(
          { success: false, error: { message: 'Submission not found' } },
          { status: 404 }
        )
      }

      // 제출물 채점
      const submission = await prisma.submission.update({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId
          }
        },
        data: {
          status: 'GRADED',
          score: score !== undefined ? (score !== null ? parseInt(score) : null) : undefined,
          feedback: feedback !== undefined ? feedback : undefined,
          gradedAt: new Date(),
          gradedById: teacher.id
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              studentId: true
            }
          },
          gradedBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return NextResponse.json({ success: true, data: submission })
    } else {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid action' } },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Submission error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to process submission' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// GET /api/assignments/[id]/submissions - 제출물 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id: assignmentId } = await params

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const whereClause: any = {
      assignmentId
    }

    if (status) {
      whereClause.status = status
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true
          }
        },
        gradedBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    return NextResponse.json({ success: true, data: submissions })
  } catch (error: any) {
    console.error('Submissions fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch submissions' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
