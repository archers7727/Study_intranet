import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/teachers - 교사 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const roleLevel = searchParams.get('roleLevel')

    const whereClause: any = {}

    // 검색어 필터
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 역할 레벨 필터
    if (roleLevel) {
      whereClause.user = {
        roleLevel
      }
    }

    const teachers = await prisma.teacher.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            roleLevel: true,
          }
        },
        _count: {
          select: {
            mainClasses: true,
            assistantClasses: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ success: true, data: teachers })
  } catch (error: any) {
    console.error('Teachers fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch teachers' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
