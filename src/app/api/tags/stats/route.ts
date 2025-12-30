import { NextRequest, NextResponse } from 'next/server'
import { requireAnyRole } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET /api/tags/stats - 태그 사용량 통계
export async function GET(request: NextRequest) {
  try {
    await requireAnyRole(request, ['ADMIN', 'SENIOR_TEACHER'])

    // 총 태그 수
    const totalTags = await prisma.tags.count()

    // 모든 태그와 사용량
    const tags = await prisma.tags.findMany({
      include: {
        _count: {
          select: {
            students: true,
            classes: true,
            sessions: true,
            materials: true
          }
        }
      }
    })

    // 태그별 총 사용량 계산
    const tagsWithUsage = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
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
      }
    }))

    // 총 태그된 항목 수
    const totalTaggedItems = tagsWithUsage.reduce(
      (sum, tag) => sum + tag.usageCount,
      0
    )

    // 태그 미지정 항목 수 계산
    const [
      totalStudents,
      totalClasses,
      totalSessions,
      totalMaterials,
      taggedStudents,
      taggedClasses,
      taggedSessions,
      taggedMaterials
    ] = await Promise.all([
      prisma.students.count(),
      prisma.classes.count(),
      prisma.sessions.count(),
      prisma.materials.count(),
      prisma.students.count({
        where: {
          tags: {
            some: {}
          }
        }
      }),
      prisma.classes.count({
        where: {
          tags: {
            some: {}
          }
        }
      }),
      prisma.sessions.count({
        where: {
          tags: {
            some: {}
          }
        }
      }),
      prisma.materials.count({
        where: {
          tags: {
            some: {}
          }
        }
      })
    ])

    const untaggedCount = {
      students: totalStudents - taggedStudents,
      classes: totalClasses - taggedClasses,
      sessions: totalSessions - taggedSessions,
      materials: totalMaterials - taggedMaterials,
      total:
        totalStudents +
        totalClasses +
        totalSessions +
        totalMaterials -
        (taggedStudents + taggedClasses + taggedSessions + taggedMaterials)
    }

    // 항목당 평균 태그 수
    const totalItems =
      totalStudents + totalClasses + totalSessions + totalMaterials
    const avgTagsPerItem = totalItems > 0 ? totalTaggedItems / totalItems : 0

    // TOP 5 태그 (사용량 기준)
    const topTags = tagsWithUsage
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)

    // 카테고리별 통계
    const categoryStats: Record<string, number> = {}
    tags.forEach(tag => {
      const category = tag.category || '미분류'
      categoryStats[category] = (categoryStats[category] || 0) + 1
    })

    return NextResponse.json({
      totalTags,
      totalTaggedItems,
      untaggedCount,
      avgTagsPerItem: Number(avgTagsPerItem.toFixed(2)),
      topTags,
      categoryStats,
      breakdown: {
        totalStudents,
        totalClasses,
        totalSessions,
        totalMaterials,
        taggedStudents,
        taggedClasses,
        taggedSessions,
        taggedMaterials
      }
    })
  } catch (error: any) {
    console.error('Error fetching tag stats:', error)

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
