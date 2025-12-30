import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/classes/[id] - 클래스 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        mainTeacher: {
          select: {
            id: true,
            name: true,
            phone: true,
            specialties: true,
            user: {
              select: {
                email: true,
                roleLevel: true,
              }
            }
          }
        },
        assistantTeachers: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                phone: true,
                user: {
                  select: {
                    email: true,
                  }
                }
              }
            }
          }
        },
        students: {
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
                user: {
                  select: {
                    email: true,
                  }
                },
                parent: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  }
                }
              }
            }
          },
          orderBy: {
            enrolledAt: 'desc'
          }
        },
        sessions: {
          include: {
            _count: {
              select: {
                attendances: true,
              }
            }
          },
          orderBy: {
            sessionDate: 'desc'
          },
          take: 10 // 최근 10개 세션만
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            students: true,
            sessions: true,
          }
        }
      }
    })

    if (!classData) {
      return NextResponse.json(
        { success: false, error: { message: 'Class not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: classData })
  } catch (error: any) {
    console.error('Class fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch class' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// PUT /api/classes/[id] - 클래스 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params

    // 권한 확인
    if (!['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(user.roleLevel)) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      cost,
      mainTeacherId,
      assistantTeacherIds,
      recurringSchedules,
      isActive,
      tagIds
    } = body

    // 클래스 존재 확인
    const existingClass = await prisma.class.findUnique({
      where: { id }
    })

    if (!existingClass) {
      return NextResponse.json(
        { success: false, error: { message: 'Class not found' } },
        { status: 404 }
      )
    }

    // 담당 교사 변경 시 존재 확인
    if (mainTeacherId && mainTeacherId !== existingClass.mainTeacherId) {
      const mainTeacher = await prisma.teacher.findUnique({
        where: { id: mainTeacherId }
      })

      if (!mainTeacher) {
        return NextResponse.json(
          { success: false, error: { message: 'Main teacher not found' } },
          { status: 404 }
        )
      }
    }

    // 트랜잭션으로 업데이트
    const updatedClass = await prisma.$transaction(async (tx) => {
      // 보조 교사 업데이트 (전체 삭제 후 재생성)
      if (assistantTeacherIds !== undefined) {
        await tx.classAssistant.deleteMany({
          where: { classId: id }
        })

        if (assistantTeacherIds.length > 0) {
          await tx.classAssistant.createMany({
            data: assistantTeacherIds.map((teacherId: string) => ({
              classId: id,
              teacherId
            }))
          })
        }
      }

      // 태그 업데이트 (전체 삭제 후 재생성)
      if (tagIds !== undefined) {
        await tx.classTag.deleteMany({
          where: { classId: id }
        })

        if (tagIds.length > 0) {
          await tx.classTag.createMany({
            data: tagIds.map((tagId: string) => ({
              classId: id,
              tagId
            }))
          })
        }
      }

      // 클래스 기본 정보 업데이트
      return tx.class.update({
        where: { id },
        data: {
          name: name !== undefined ? name : undefined,
          description: description !== undefined ? description : undefined,
          cost: cost !== undefined ? (cost ? parseFloat(cost) : null) : undefined,
          mainTeacherId: mainTeacherId !== undefined ? mainTeacherId : undefined,
          recurringSchedules: recurringSchedules !== undefined ? recurringSchedules : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
        },
        include: {
          mainTeacher: {
            select: {
              id: true,
              name: true,
              user: {
                select: {
                  email: true,
                  roleLevel: true,
                }
              }
            }
          },
          assistantTeachers: {
            include: {
              teacher: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          _count: {
            select: {
              students: true,
              sessions: true,
            }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      })
    })

    return NextResponse.json({ success: true, data: updatedClass })
  } catch (error: any) {
    console.error('Class update error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update class' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// DELETE /api/classes/[id] - 클래스 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params

    // 권한 확인 (관리자 또는 수석교사만)
    if (!['ADMIN', 'SENIOR_TEACHER'].includes(user.roleLevel)) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied' } },
        { status: 403 }
      )
    }

    // 클래스 존재 확인
    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            sessions: true,
          }
        }
      }
    })

    if (!existingClass) {
      return NextResponse.json(
        { success: false, error: { message: 'Class not found' } },
        { status: 404 }
      )
    }

    // 학생이나 세션이 있는 경우 삭제 대신 비활성화
    if (existingClass._count.students > 0 || existingClass._count.sessions > 0) {
      const deactivatedClass = await prisma.class.update({
        where: { id },
        data: { isActive: false }
      })

      return NextResponse.json({
        success: true,
        data: deactivatedClass,
        message: 'Class has been deactivated instead of deleted due to existing students or sessions'
      })
    }

    // 완전 삭제
    await prisma.class.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully'
    })
  } catch (error: any) {
    console.error('Class deletion error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete class' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
