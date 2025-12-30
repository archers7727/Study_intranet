import { NextRequest, NextResponse } from 'next/server'
import { requireAnyRole } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { calculateGrade } from '@/lib/auth'

// POST /api/search/by-tags - 태그 기반 검색
export async function POST(request: NextRequest) {
  try {
    await requireAnyRole(request, ['ADMIN', 'SENIOR_TEACHER', 'TEACHER'])

    const body = await request.json()
    const { tagIds, logic = 'AND', targetType } = body

    // 입력 검증
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '태그 ID 배열을 제공해주세요.' } },
        { status: 400 }
      )
    }

    if (!['AND', 'OR'].includes(logic)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '로직은 AND 또는 OR이어야 합니다.' } },
        { status: 400 }
      )
    }

    if (!['students', 'classes', 'materials', 'sessions'].includes(targetType)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '검색 대상은 students, classes, materials, sessions 중 하나여야 합니다.'
          }
        },
        { status: 400 }
      )
    }

    let results: any[] = []

    if (targetType === 'students') {
      if (logic === 'AND') {
        // 모든 태그를 포함하는 학생
        const students = await prisma.student.findMany({
          where: {
            AND: tagIds.map(tagId => ({
              tags: {
                some: { tagId }
              }
            }))
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            parent: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        })

        results = students.map(student => ({
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          phone: student.phone,
          school: student.school,
          grade: calculateGrade(student.birthDate),
          enrollmentStatus: student.enrollmentStatus,
          managementStatus: student.managementStatus,
          tags: student.tags.map(t => t.tag),
          parent: student.parent
        }))
      } else {
        // 하나라도 포함하는 학생
        const students = await prisma.student.findMany({
          where: {
            tags: {
              some: {
                tagId: {
                  in: tagIds
                }
              }
            }
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            parent: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        })

        results = students.map(student => ({
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          phone: student.phone,
          school: student.school,
          grade: calculateGrade(student.birthDate),
          enrollmentStatus: student.enrollmentStatus,
          managementStatus: student.managementStatus,
          tags: student.tags.map(t => t.tag),
          parent: student.parent
        }))
      }
    } else if (targetType === 'classes') {
      if (logic === 'AND') {
        const classes = await prisma.class.findMany({
          where: {
            AND: tagIds.map(tagId => ({
              tags: {
                some: { tagId }
              }
            }))
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            mainTeacher: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                students: true,
                sessions: true
              }
            }
          }
        })

        results = classes.map(cls => ({
          id: cls.id,
          name: cls.name,
          description: cls.description,
          cost: cls.cost,
          isActive: cls.isActive,
          mainTeacher: cls.mainTeacher,
          studentCount: cls._count.students,
          sessionCount: cls._count.sessions,
          tags: cls.tags.map(t => t.tag)
        }))
      } else {
        const classes = await prisma.class.findMany({
          where: {
            tags: {
              some: {
                tagId: {
                  in: tagIds
                }
              }
            }
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            mainTeacher: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                students: true,
                sessions: true
              }
            }
          }
        })

        results = classes.map(cls => ({
          id: cls.id,
          name: cls.name,
          description: cls.description,
          cost: cls.cost,
          isActive: cls.isActive,
          mainTeacher: cls.mainTeacher,
          studentCount: cls._count.students,
          sessionCount: cls._count.sessions,
          tags: cls.tags.map(t => t.tag)
        }))
      }
    } else if (targetType === 'materials') {
      if (logic === 'AND') {
        const materials = await prisma.material.findMany({
          where: {
            AND: tagIds.map(tagId => ({
              tags: {
                some: { tagId }
              }
            }))
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            uploadedBy: {
              select: {
                id: true,
                name: true,
                roleLevel: true
              }
            }
          }
        })

        results = materials
      } else {
        const materials = await prisma.material.findMany({
          where: {
            tags: {
              some: {
                tagId: {
                  in: tagIds
                }
              }
            }
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            uploadedBy: {
              select: {
                id: true,
                name: true,
                roleLevel: true
              }
            }
          }
        })

        results = materials
      }
    } else if (targetType === 'sessions') {
      if (logic === 'AND') {
        const sessions = await prisma.session.findMany({
          where: {
            AND: tagIds.map(tagId => ({
              tags: {
                some: { tagId }
              }
            }))
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            class: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            scheduledAt: 'desc'
          }
        })

        results = sessions
      } else {
        const sessions = await prisma.session.findMany({
          where: {
            tags: {
              some: {
                tagId: {
                  in: tagIds
                }
              }
            }
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            class: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            scheduledAt: 'desc'
          }
        })

        results = sessions
      }
    }

    return NextResponse.json({
      results,
      count: results.length,
      query: {
        tagIds,
        logic,
        targetType
      }
    })
  } catch (error: any) {
    console.error('Error searching by tags:', error)

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
