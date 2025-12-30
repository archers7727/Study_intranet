import { NextRequest, NextResponse } from 'next/server'
import { requireAnyRole } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/tags/:id - 태그 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAnyRole(request, ['ADMIN', 'SENIOR_TEACHER'])

    const { id } = await params
    const tagId = id
    const body = await request.json()
    const { name, color, category, description } = body

    // 태그 존재 확인
    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId }
    })

    if (!existingTag) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '태그를 찾을 수 없습니다.' } },
        { status: 404 }
      )
    }

    // 이름 중복 확인 (다른 태그와)
    if (name && name !== existingTag.name) {
      const duplicateTag = await prisma.tag.findUnique({
        where: { name }
      })

      if (duplicateTag) {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: '이미 존재하는 태그 이름입니다.' } },
          { status: 409 }
        )
      }
    }

    // 업데이트 데이터 준비
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (color !== undefined) updateData.color = color
    if (category !== undefined) updateData.category = category
    if (description !== undefined) updateData.description = description

    // 태그 업데이트
    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: updateData
    })

    return NextResponse.json({ tag })
  } catch (error: any) {
    console.error('Error updating tag:', error)

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

// DELETE /api/tags/:id - 태그 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAnyRole(request, ['ADMIN', 'SENIOR_TEACHER'])

    const { id } = await params
    const tagId = id

    // 태그 존재 확인
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
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

    if (!tag) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '태그를 찾을 수 없습니다.' } },
        { status: 404 }
      )
    }

    // 사용 중인 태그인지 확인
    const totalUsage =
      tag._count.students +
      tag._count.classes +
      tag._count.sessions +
      tag._count.materials

    if (totalUsage > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: `이 태그는 ${totalUsage}개의 항목에서 사용 중입니다. 먼저 연결을 해제해주세요.`,
            details: {
              students: tag._count.students,
              classes: tag._count.classes,
              sessions: tag._count.sessions,
              materials: tag._count.materials
            }
          }
        },
        { status: 409 }
      )
    }

    // 태그 삭제
    await prisma.tag.delete({
      where: { id: tagId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting tag:', error)

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
