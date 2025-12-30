import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAnyRole } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { RoleLevel } from '@/types'
import { generateStudentCredentials, calculateGrade } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase/server'

// GET /api/students - 학생 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const skip = (page - 1) * limit

    // 권한 체크: LV0-2는 전체 조회, LV3-5는 제한
    const canViewAll = ['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(user.roleLevel)

    let whereClause: any = {}

    // 검색: 이름 또는 학교명
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { school: { contains: search } }
      ]
    }

    // 상태 필터
    if (status) {
      whereClause.enrollmentStatus = status
    }

    // 태그 필터
    if (tags.length > 0) {
      whereClause.tags = {
        some: {
          tagId: {
            in: tags
          }
        }
      }
    }

    // 권한에 따른 필터링
    if (!canViewAll) {
      if (user.roleLevel === 'STUDENT') {
        // 학생은 본인만
        whereClause.userId = user.id
      } else if (user.roleLevel === 'PARENT') {
        // 학부모는 자녀만
        const parent = await prisma.parent.findUnique({
          where: { userId: user.id },
          include: { students: true }
        })

        if (parent) {
          whereClause.id = {
            in: parent.students.map(s => s.id)
          }
        } else {
          // 연결된 자녀가 없으면 빈 결과
          whereClause.id = 'none'
        }
      } else if (user.roleLevel === 'ASSISTANT') {
        // 보조교사는 담당 클래스 학생만
        const assistantClasses = await prisma.classAssistants.findMany({
          where: {
            teachers: {
              userId: user.id
            }
          },
          select: { classId: true }
        })

        whereClause.classEnrollments = {
          some: {
            classId: {
              in: assistantClasses.map(c => c.classId)
            }
          }
        }
      }
    }

    // 총 개수 조회
    const total = await prisma.student.count({ where: whereClause })

    // 학생 목록 조회
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            classEnrollments: true,
            attendances: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    return NextResponse.json({
      students: students.map(student => ({
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.user.email,
        birthDate: student.birthDate,
        gender: student.gender,
        school: student.school,
        phone: student.phone,
        grade: calculateGrade(student.birthDate),
        enrollmentStatus: student.enrollmentStatus,
        managementStatus: student.managementStatus,
        parent: student.parent,
        tags: student.tags.map(t => t.tag),
        classCount: student._count.classEnrollments,
        attendanceCount: student._count.attendances,
        createdAt: student.createdAt
      })),
      pagination: {
        total,
        page,
        limit,
        hasNext: skip + limit < total
      }
    })
  } catch (error: any) {
    console.error('Error fetching students:', error)

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

// POST /api/students - 학생 등록
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAnyRole(request, ['ADMIN', 'SENIOR_TEACHER'])

    const body = await request.json()
    const { name, birthDate, gender, school, phone, parentId, tags } = body

    // 입력 검증
    if (!name || !birthDate || !gender || !phone) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '필수 정보를 모두 입력해주세요.' } },
        { status: 400 }
      )
    }

    // 자동 ID 및 비밀번호 생성
    const { studentId, password } = generateStudentCredentials(name, phone, new Date(birthDate), gender)

    // Supabase 인증 사용자 생성
    const supabase = createSupabaseAdmin()
    const email = `${studentId}@student.local`

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role_level: 'STUDENT'
      }
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: '사용자 생성에 실패했습니다.' } },
        { status: 500 }
      )
    }

    // Prisma users 테이블에 레코드 생성
    const newUser = await prisma.user.create({
      data: {
        id: authData.user!.id,
        email,
        name,
        roleLevel: 'STUDENT'
      }
    })

    // 학생 정보 생성
    const student = await prisma.student.create({
      data: {
        userId: newUser.id,
        studentId,
        name,
        birthDate: new Date(birthDate),
        gender,
        school: school || null,
        phone,
        parentId: parentId || null,
        enrollmentStatus: 'ENROLLED',
        managementStatus: 'NORMAL',
        tags: tags && tags.length > 0 ? {
          create: tags.map((tagId: string) => ({
            tagId
          }))
        } : undefined
      },
      include: {
        parent: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json({
      student: {
        ...student,
        tags: student.tags.map(t => t.tag),
        grade: calculateGrade(student.birthDate)
      },
      generatedStudentId: studentId,
      generatedPassword: password
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating student:', error)

    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', details: error.message } },
      { status: 500 }
    )
  }
}
