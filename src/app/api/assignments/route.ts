import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/assignments - 과제 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const classId = searchParams.get('classId')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const studentId = searchParams.get('studentId')

    const whereClause: any = {}

    // 세션 필터
    if (sessionId) {
      whereClause.sessionId = sessionId
    }

    // 클래스 필터
    if (classId) {
      whereClause.session = {
        classId
      }
    }

    // 검색 필터
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
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
        submissions: studentId ? {
          where: {
            studentId
          }
        } : false,
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    })

    return NextResponse.json({ success: true, data: assignments })
  } catch (error: any) {
    console.error('Assignments fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch assignments' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// POST /api/assignments - 새 과제 생성
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    // 권한 확인 (교사 이상만 과제 생성 가능)
    if (!['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(user.roleLevel)) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      sessionId,
      title,
      description,
      dueDate,
      maxScore,
      tagIds = []
    } = body

    // 필수 필드 검증
    if (!sessionId || !title || !dueDate) {
      return NextResponse.json(
        { success: false, error: { message: 'Session, title, and due date are required' } },
        { status: 400 }
      )
    }

    // 세션 존재 확인
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: 'Session not found' } },
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

    // 과제 생성
    const assignment = await prisma.assignment.create({
      data: {
        sessionId,
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        maxScore: maxScore ? parseInt(maxScore) : null,
        createdById: teacher.id,
        tags: tagIds.length > 0 ? {
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

    return NextResponse.json({ success: true, data: assignment }, { status: 201 })
  } catch (error: any) {
    console.error('Assignment creation error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create assignment' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
