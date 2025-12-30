import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// POST /api/sessions/[id]/attendance - 출석 체크 (일괄 또는 개별)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id: sessionId } = await params

    // 권한 확인
    if (!['ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT'].includes(user.roleLevel)) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { attendances } = body // attendances: [{ studentId, status, notes }]

    if (!attendances || !Array.isArray(attendances)) {
      return NextResponse.json(
        { success: false, error: { message: 'Attendances array is required' } },
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

    // 출석 체크 (upsert 사용 - 이미 있으면 업데이트, 없으면 생성)
    const results = await Promise.all(
      attendances.map(async (att: any) => {
        return prisma.attendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId,
              studentId: att.studentId
            }
          },
          update: {
            status: att.status,
            notes: att.notes || null,
            checkedById: teacher.id,
            checkedAt: new Date(),
          },
          create: {
            sessionId,
            studentId: att.studentId,
            status: att.status,
            notes: att.notes || null,
            checkedById: teacher.id,
          },
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                name: true,
                grade: true,
              }
            }
          }
        })
      })
    )

    return NextResponse.json({ success: true, data: results })
  } catch (error: any) {
    console.error('Attendance check error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to check attendance' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// GET /api/sessions/[id]/attendance - 출석 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id: sessionId } = await params

    const attendances = await prisma.attendance.findMany({
      where: { sessionId },
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
    })

    return NextResponse.json({ success: true, data: attendances })
  } catch (error: any) {
    console.error('Attendance fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch attendance' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
