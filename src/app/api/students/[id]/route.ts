import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAnyRole, requireRole } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { calculateGrade } from '@/lib/auth'

// GET /api/students/:id - 학생 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const studentId = params.id

    // 학생 정보 조회
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            phone: true,
            relation: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        enrollments: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                isActive: true
              }
            }
          }
        },
        attendances: {
          include: {
            session: {
              select: {
                id: true,
                scheduledAt: true,
                class: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50
        },
        submissions: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                dueDate: true,
                maxScore: true
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        statusLogs: {
          include: {
            changedBy: {
              select: {
                name: true,
                roleLevel: true
              }
            }
          },
          orderBy: {
            changedAt: 'desc'
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '학생을 찾을 수 없습니다.' } },
        { status: 404 }
      )
    }

    // 권한 체크: LV0-2는 전체, LV4-5는 본인/자녀만
    const canViewAll = ['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(user.roleLevel)

    if (!canViewAll) {
      if (user.roleLevel === 'STUDENT' && student.userId !== user.id) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } },
          { status: 403 }
        )
      } else if (user.roleLevel === 'PARENT') {
        const parent = await prisma.parents.findUnique({
          where: { userId: user.id },
          include: { students: true }
        })

        if (!parent || !parent.students.some(s => s.id === studentId)) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } },
            { status: 403 }
          )
        }
      }
    }

    // 출석률 계산
    const totalAttendances = student.attendances.length
    const presentCount = student.attendances.filter(a => a.status === 'PRESENT').length
    const attendanceRate = totalAttendances > 0 ? (presentCount / totalAttendances) * 100 : 0

    return NextResponse.json({
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.user.email,
        birthDate: student.birthDate,
        gender: student.gender,
        school: student.school,
        phone: student.phone,
        grade: calculateGrade(student.birthDate),
        enrollmentStatus: student.enrollmentStatus,
        managementStatus: student.managementStatus,
        parent: student.parent,
        tags: student.tags.map(t => t.tag),
        enrollments: student.enrollments,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      },
      attendanceRate,
      attendances: student.attendances.map(a => ({
        id: a.id,
        status: a.status,
        notes: a.notes,
        sessionDate: a.session.scheduledAt,
        className: a.session.class.name,
        createdAt: a.createdAt
      })),
      assignments: student.submissions.map(s => ({
        id: s.id,
        assignmentId: s.assignmentId,
        title: s.assignment.title,
        status: s.status,
        score: s.score,
        maxScore: s.assignment.maxScore,
        submittedAt: s.submittedAt,
        dueDate: s.assignment.dueDate
      })),
      statusLogs: student.statusLogs
    })
  } catch (error: any) {
    console.error('Error fetching student:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    )
  }
}

// PATCH /api/students/:id - 학생 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAnyRole(request, ['ADMIN', 'SENIOR_TEACHER'])

    const studentId = params.id
    const body = await request.json()
    const { name, school, phone, enrollmentStatus, managementStatus, parentId, tags } = body

    // 학생 존재 확인
    const existingStudent = await prisma.students.findUnique({
      where: { id: studentId }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '학생을 찾을 수 없습니다.' } },
        { status: 404 }
      )
    }

    // 업데이트 데이터 준비
    const updateData: any = {}
    if (name) updateData.name = name
    if (school !== undefined) updateData.school = school
    if (phone) updateData.phone = phone
    if (enrollmentStatus) updateData.enrollmentStatus = enrollmentStatus
    if (managementStatus) updateData.managementStatus = managementStatus
    if (parentId !== undefined) updateData.parentId = parentId

    // 태그 업데이트
    if (tags !== undefined) {
      // 기존 태그 삭제 후 새로 추가
      await prisma.studentTags.deleteMany({
        where: { studentId }
      })

      if (tags.length > 0) {
        await prisma.studentTags.createMany({
          data: tags.map((tagId: string) => ({
            studentId,
            tagId
          }))
        })
      }
    }

    // 학생 정보 업데이트
    const student = await prisma.students.update({
      where: { id: studentId },
      data: updateData,
      include: {
        parent: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json({
      student: {
        ...student,
        tags: student.tags.map(t => t.tag),
        grade: calculateGrade(student.birthDate)
      }
    })
  } catch (error: any) {
    console.error('Error updating student:', error)

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

// DELETE /api/students/:id - 학생 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN')

    const studentId = params.id

    // 학생 존재 확인
    const student = await prisma.students.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '학생을 찾을 수 없습니다.' } },
        { status: 404 }
      )
    }

    // 관련 데이터 삭제 (cascade)
    await prisma.students.delete({
      where: { id: studentId }
    })

    // Supabase 인증 사용자도 삭제 (선택사항)
    // const supabase = createClient()
    // await supabase.auth.admin.deleteUser(student.userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting student:', error)

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
