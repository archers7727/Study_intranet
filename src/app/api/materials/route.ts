import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/materials - 학습 자료 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const fileType = searchParams.get('fileType')
    const tagId = searchParams.get('tagId')
    const sessionId = searchParams.get('sessionId')

    const whereClause: any = {}

    // 검색어 필터
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 파일 타입 필터
    if (fileType) {
      whereClause.fileType = fileType
    }

    // 태그 필터
    if (tagId) {
      whereClause.tags = {
        some: { tagId }
      }
    }

    // 세션 필터
    if (sessionId) {
      whereClause.sessions = {
        some: { sessionId }
      }
    }

    const materials = await prisma.material.findMany({
      where: whereClause,
      include: {
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
        _count: {
          select: {
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

    return NextResponse.json({ success: true, data: materials })
  } catch (error: any) {
    console.error('Materials fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch materials' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// POST /api/materials - 새 학습 자료 생성
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    // 권한 확인 (교사 이상만 자료 생성 가능)
    if (!['ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT'].includes(user.roleLevel)) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      fileUrl,
      fileType,
      fileSize,
      tagIds = []
    } = body

    // 필수 필드 검증
    if (!title || !fileUrl) {
      return NextResponse.json(
        { success: false, error: { message: 'Title and file URL are required' } },
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

    // 자료 생성
    const material = await prisma.material.create({
      data: {
        title,
        description: description || null,
        fileUrl,
        fileType: fileType || null,
        fileSize: fileSize ? parseInt(fileSize) : null,
        createdById: teacher.id,
        tags: tagIds.length > 0 ? {
          create: tagIds.map((tagId: string) => ({
            tagId
          }))
        } : undefined
      },
      include: {
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
        _count: {
          select: {
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

    return NextResponse.json({ success: true, data: material }, { status: 201 })
  } catch (error: any) {
    console.error('Material creation error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create material' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
