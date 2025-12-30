import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/classes - 클래스 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const teacherId = searchParams.get('teacherId')
    const isActive = searchParams.get('isActive')
    const tagId = searchParams.get('tagId')

    const whereClause: any = {}

    // 검색어 필터
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 담당 교사 필터
    if (teacherId) {
      whereClause.OR = [
        { mainTeacherId: teacherId },
        { assistantTeachers: { some: { teacherId } } }
      ]
    }

    // 활성 상태 필터
    if (isActive !== null && isActive !== undefined) {
      whereClause.isActive = isActive === 'true'
    }

    // 태그 필터
    if (tagId) {
      whereClause.tags = {
        some: { tagId }
      }
    }

    const classes = await prisma.class.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ success: true, data: classes })
  } catch (error: any) {
    console.error('Classes fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch classes' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// POST /api/classes - 새 클래스 생성
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    // 권한 확인 (선생님 이상만 클래스 생성 가능)
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
      assistantTeacherIds = [],
      recurringSchedules,
      tagIds = []
    } = body

    // 필수 필드 검증
    if (!name || !mainTeacherId) {
      return NextResponse.json(
        { success: false, error: { message: 'Name and main teacher are required' } },
        { status: 400 }
      )
    }

    // 담당 교사 존재 확인
    const mainTeacher = await prisma.teacher.findUnique({
      where: { id: mainTeacherId }
    })

    if (!mainTeacher) {
      return NextResponse.json(
        { success: false, error: { message: 'Main teacher not found' } },
        { status: 404 }
      )
    }

    // 클래스 생성
    const newClass = await prisma.class.create({
      data: {
        name,
        description: description || null,
        cost: cost ? parseFloat(cost) : null,
        mainTeacherId,
        recurringSchedules: recurringSchedules || null,
        isActive: true,
        assistantTeachers: assistantTeacherIds.length > 0 ? {
          create: assistantTeacherIds.map((teacherId: string) => ({
            teacherId
          }))
        } : undefined,
        tags: tagIds.length > 0 ? {
          create: tagIds.map((tagId: string) => ({
            tagId
          }))
        } : undefined
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

    return NextResponse.json({ success: true, data: newClass }, { status: 201 })
  } catch (error: any) {
    console.error('Class creation error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create class' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
