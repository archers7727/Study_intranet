import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/sessions - 세션 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    const whereClause: any = {}

    // 클래스 필터
    if (classId) {
      whereClause.classId = classId
    }

    // 날짜 범위 필터
    if (startDate && endDate) {
      whereClause.sessionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (startDate) {
      whereClause.sessionDate = {
        gte: new Date(startDate),
      }
    } else if (endDate) {
      whereClause.sessionDate = {
        lte: new Date(endDate),
      }
    }

    // 상태 필터
    if (status) {
      whereClause.status = status
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
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
            },
            _count: {
              select: {
                students: true,
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
      },
      orderBy: {
        sessionDate: 'desc'
      }
    })

    return NextResponse.json({ success: true, data: sessions })
  } catch (error: any) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch sessions' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// POST /api/sessions - 새 세션 생성
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    // 권한 확인 (교사 이상만 세션 생성 가능)
    if (!['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(user.roleLevel)) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      classId,
      sessionDate,
      startTime,
      endTime,
      location,
      notes,
      tagIds = []
    } = body

    // 필수 필드 검증
    if (!classId || !sessionDate || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: { message: 'Class, date, and time are required' } },
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

    // 세션 생성
    const session = await prisma.session.create({
      data: {
        classId,
        sessionDate: new Date(sessionDate),
        startTime,
        endTime,
        location: location || null,
        notes: notes || null,
        status: 'SCHEDULED',
        createdById: teacher.id,
        tags: tagIds.length > 0 ? {
          create: tagIds.map((tagId: string) => ({
            tagId
          }))
        } : undefined
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

    return NextResponse.json({ success: true, data: session }, { status: 201 })
  } catch (error: any) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create session' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
