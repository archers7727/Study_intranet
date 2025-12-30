import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAnyRole } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET /api/tags - 태그 목록 조회
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const sortBy = searchParams.get('sortBy') || 'name'
    const search = searchParams.get('search') || ''

    let whereClause: any = {}

    // 카테고리 필터
    if (category) {
      whereClause.category = category
    }

    // 검색
    if (search) {
      whereClause.name = {
        contains: search
      }
    }

    // 정렬 옵션
    let orderBy: any = {}
    if (sortBy === 'usageCount') {
      // 사용량순 정렬은 집계 후 처리
      orderBy = { name: 'asc' }
    } else {
      orderBy = { [sortBy]: 'asc' }
    }

    // 태그 목록 조회
    const tags = await prisma.tag.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            students: true,
            classes: true,
            sessions: true,
            materials: true
          }
        }
      },
      orderBy
    })

    // 각 태그의 총 사용량 계산
    const tagsWithUsage = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      category: tag.category,
      description: tag.description,
      usageCount:
        tag._count.students +
        tag._count.classes +
        tag._count.sessions +
        tag._count.materials,
      breakdown: {
        students: tag._count.students,
        classes: tag._count.classes,
        sessions: tag._count.sessions,
        materials: tag._count.materials
      },
      createdAt: tag.createdAt
    }))

    // 사용량순 정렬
    if (sortBy === 'usageCount') {
      tagsWithUsage.sort((a, b) => b.usageCount - a.usageCount)
    }

    return NextResponse.json({ tags: tagsWithUsage })
  } catch (error: any) {
    console.error('Error fetching tags:', error)

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

// POST /api/tags - 태그 생성
export async function POST(request: NextRequest) {
  try {
    await requireAnyRole(request, ['ADMIN', 'SENIOR_TEACHER'])

    const body = await request.json()
    const { name, color, category, description } = body

    // 입력 검증
    if (!name || !color) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '태그 이름과 색상은 필수입니다.' } },
        { status: 400 }
      )
    }

    // 중복 확인
    const existingTag = await prisma.tag.findUnique({
      where: { name }
    })

    if (existingTag) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: '이미 존재하는 태그 이름입니다.' } },
        { status: 409 }
      )
    }

    // 태그 생성
    const tag = await prisma.tag.create({
      data: {
        name,
        color,
        category: category || null,
        description: description || null
      }
    })

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating tag:', error)

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
