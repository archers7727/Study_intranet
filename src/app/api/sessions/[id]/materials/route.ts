import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// POST /api/sessions/[id]/materials - 세션에 자료 추가
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
    const { materialId } = body

    if (!materialId) {
      return NextResponse.json(
        { success: false, error: { message: 'Material ID is required' } },
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

    // 자료 존재 확인
    const material = await prisma.material.findUnique({
      where: { id: materialId }
    })

    if (!material) {
      return NextResponse.json(
        { success: false, error: { message: 'Material not found' } },
        { status: 404 }
      )
    }

    // 이미 추가되어 있는지 확인
    const existing = await prisma.sessionMaterial.findUnique({
      where: {
        sessionId_materialId: {
          sessionId,
          materialId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Material already added to this session' } },
        { status: 400 }
      )
    }

    // 자료 추가
    const sessionMaterial = await prisma.sessionMaterial.create({
      data: {
        sessionId,
        materialId
      },
      include: {
        material: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: sessionMaterial }, { status: 201 })
  } catch (error: any) {
    console.error('Material addition error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to add material to session' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// DELETE /api/sessions/[id]/materials - 세션에서 자료 제거
export async function DELETE(
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

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')

    if (!materialId) {
      return NextResponse.json(
        { success: false, error: { message: 'Material ID is required' } },
        { status: 400 }
      )
    }

    // 연결 확인
    const sessionMaterial = await prisma.sessionMaterial.findUnique({
      where: {
        sessionId_materialId: {
          sessionId,
          materialId
        }
      }
    })

    if (!sessionMaterial) {
      return NextResponse.json(
        { success: false, error: { message: 'Material not found in this session' } },
        { status: 404 }
      )
    }

    // 제거
    await prisma.sessionMaterial.delete({
      where: {
        sessionId_materialId: {
          sessionId,
          materialId
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Material removed from session successfully'
    })
  } catch (error: any) {
    console.error('Material removal error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to remove material from session' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
