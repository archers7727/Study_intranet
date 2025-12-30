import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/assignments/[id] - 과제 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            sessionDate: true,
            startTime: true,
            endTime: true,
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
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          }
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                studentId: true,
              }
            },
            gradedBy: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: { message: 'Assignment not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: assignment })
  } catch (error: any) {
    console.error('Assignment fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch assignment' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// PUT /api/assignments/[id] - 과제 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params

    // 권한 확인 (교사 이상만 수정 가능)
    if (!['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(user.roleLevel)) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      dueDate,
      maxScore,
      tagIds
    } = body

    // 과제 존재 확인
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id }
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: { message: 'Assignment not found' } },
        { status: 404 }
      )
    }

    // 과제 수정
    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        title: title || existingAssignment.title,
        description: description !== undefined ? description : existingAssignment.description,
        dueDate: dueDate ? new Date(dueDate) : existingAssignment.dueDate,
        maxScore: maxScore !== undefined ? (maxScore ? parseInt(maxScore) : null) : existingAssignment.maxScore,
        tags: tagIds !== undefined ? {
          deleteMany: {},
          create: tagIds.map((tagId: string) => ({
            tagId
          }))
        } : undefined
      },
      include: {
        session: {
          select: {
            id: true,
            sessionDate: true,
            class: {
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
            submissions: true,
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: assignment })
  } catch (error: any) {
    console.error('Assignment update error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update assignment' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// DELETE /api/assignments/[id] - 과제 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params

    // 권한 확인 (교사 이상만 삭제 가능)
    if (!['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(user.roleLevel)) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied' } },
        { status: 403 }
      )
    }

    // 과제 존재 확인
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: { message: 'Assignment not found' } },
        { status: 404 }
      )
    }

    // 제출물이 있는 경우 경고 (삭제는 허용하되 경고 메시지 포함)
    if (assignment._count.submissions > 0) {
      await prisma.assignment.delete({
        where: { id }
      })

      return NextResponse.json({
        success: true,
        data: { message: `Assignment deleted (had ${assignment._count.submissions} submissions)` }
      })
    }

    // 과제 삭제
    await prisma.assignment.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Assignment deleted successfully' }
    })
  } catch (error: any) {
    console.error('Assignment deletion error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete assignment' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
