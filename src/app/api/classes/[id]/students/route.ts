import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// POST /api/classes/[id]/students - 학생 등록
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id: classId } = await params

    // 권한 확인
    if (!['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(user.roleLevel)) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: { message: 'Student ID is required' } },
        { status: 400 }
      )
    }

    // 클래스 존재 확인
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    })

    if (!classData) {
      return NextResponse.json(
        { success: false, error: { message: 'Class not found' } },
        { status: 404 }
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

    // 이미 등록되어 있는지 확인
    const existingEnrollment = await prisma.classStudent.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: { message: 'Student is already enrolled in this class' } },
        { status: 400 }
      )
    }

    // 학생 등록
    const enrollment = await prisma.classStudent.create({
      data: {
        classId,
        studentId
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            grade: true,
            school: true,
            enrollmentStatus: true,
            managementStatus: true,
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: enrollment }, { status: 201 })
  } catch (error: any) {
    console.error('Student enrollment error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to enroll student' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// DELETE /api/classes/[id]/students - 학생 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id: classId } = await params

    // 권한 확인
    if (!['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(user.roleLevel)) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: { message: 'Student ID is required' } },
        { status: 400 }
      )
    }

    // 등록 확인
    const enrollment = await prisma.classStudent.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: { message: 'Student is not enrolled in this class' } },
        { status: 404 }
      )
    }

    // 학생 제거
    await prisma.classStudent.delete({
      where: {
        classId_studentId: {
          classId,
          studentId
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Student removed from class successfully'
    })
  } catch (error: any) {
    console.error('Student removal error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to remove student' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
