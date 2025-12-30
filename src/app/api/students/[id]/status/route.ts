import { NextRequest, NextResponse } from 'next/server'
import { requireAnyRole } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// POST /api/students/:id/status - 학생 관리 상태 변경
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAnyRole(request, ['ADMIN', 'SENIOR_TEACHER'])

    const { id } = await params
    const studentId = id
    const body = await request.json()
    const { newStatus, reason } = body

    // 입력 검증
    if (!newStatus || !['NORMAL', 'CAUTION'].includes(newStatus)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효한 상태를 입력해주세요.' } },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '변경 사유를 입력해주세요.' } },
        { status: 400 }
      )
    }

    // 학생 존재 확인
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '학생을 찾을 수 없습니다.' } },
        { status: 404 }
      )
    }

    // 상태가 동일하면 변경하지 않음
    if (student.managementStatus === newStatus) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '이미 해당 상태입니다.' } },
        { status: 400 }
      )
    }

    // 트랜잭션으로 학생 상태 업데이트 + 로그 생성
    const result = await prisma.$transaction(async (tx) => {
      // 학생 상태 업데이트
      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: {
          managementStatus: newStatus
        },
        include: {
          parent: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      })

      // 상태 변경 로그 생성
      const statusLog = await tx.statusLog.create({
        data: {
          studentId,
          previousStatus: student.managementStatus,
          newStatus,
          reason,
          changedById: user.id
        },
        include: {
          changedBy: {
            select: {
              name: true
            }
          }
        }
      })

      return { updatedStudent, statusLog }
    })

    return NextResponse.json({
      student: {
        ...result.updatedStudent,
        tags: result.updatedStudent.tags.map(t => t.tag)
      },
      statusLog: result.statusLog
    })
  } catch (error: any) {
    console.error('Error updating student status:', error)

    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    )
  }
}
