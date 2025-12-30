import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/sessions/[id] - 세션 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            mainTeacher: {
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
            },
            students: {
              include: {
                student: {
                  select: {
                    id: true,
                    studentId: true,
                    name: true,
                    grade: true,
                    enrollmentStatus: true,
                  }
                }
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                email: true,
              }
            }
          }
        },
        attendances: {
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                name: true,
                grade: true,
              }
            },
            checkedBy: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            checkedAt: 'desc'
          }
        },
        assignments: {
          include: {
            _count: {
              select: {
                submissions: true,
              }
            }
          }
        },
        materials: {
          include: {
            material: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          },
          orderBy: {
            addedAt: 'desc'
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: 'Session not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: session })
  } catch (error: any) {
    console.error('Session fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch session' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// PUT /api/sessions/[id] - 세션 수정
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
      sessionDate,
      startTime,
      endTime,
      location,
      status,
      notes,
      tagIds
    } = body

    // 세션 존재 확인
    const existingSession = await prisma.session.findUnique({
      where: { id }
    })

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: { message: 'Session not found' } },
        { status: 404 }
      )
    }

    // 트랜잭션으로 업데이트
    const updatedSession = await prisma.$transaction(async (tx) => {
      // 태그 업데이트
      if (tagIds !== undefined) {
        await tx.sessionTag.deleteMany({
          where: { sessionId: id }
        })

        if (tagIds.length > 0) {
          await tx.sessionTag.createMany({
            data: tagIds.map((tagId: string) => ({
              sessionId: id,
              tagId
            }))
          })
        }
      }

      // 세션 기본 정보 업데이트
      return tx.session.update({
        where: { id },
        data: {
          sessionDate: sessionDate ? new Date(sessionDate) : undefined,
          startTime: startTime !== undefined ? startTime : undefined,
          endTime: endTime !== undefined ? endTime : undefined,
          location: location !== undefined ? location : undefined,
          status: status !== undefined ? status : undefined,
          notes: notes !== undefined ? notes : undefined,
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              mainTeacher: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              attendances: true,
              assignments: true,
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

    return NextResponse.json({ success: true, data: updatedSession })
  } catch (error: any) {
    console.error('Session update error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update session' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// DELETE /api/sessions/[id] - 세션 삭제
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

    // 세션 존재 확인
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendances: true,
            assignments: true,
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: 'Session not found' } },
        { status: 404 }
      )
    }

    // 출석이나 과제가 있는 경우 취소 상태로 변경
    if (session._count.attendances > 0 || session._count.assignments > 0) {
      const cancelledSession = await prisma.session.update({
        where: { id },
        data: { status: 'CANCELLED' }
      })

      return NextResponse.json({
        success: true,
        data: cancelledSession,
        message: 'Session has been cancelled instead of deleted due to existing attendance or assignments'
      })
    }

    // 완전 삭제
    await prisma.session.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    })
  } catch (error: any) {
    console.error('Session deletion error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete session' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
