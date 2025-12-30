import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

// GET /api/materials/[id] - 자료 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            phone: true,
            user: {
              select: {
                email: true,
              }
            }
          }
        },
        sessions: {
          include: {
            session: {
              select: {
                id: true,
                sessionDate: true,
                startTime: true,
                endTime: true,
                class: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          },
          orderBy: {
            addedAt: 'desc'
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!material) {
      return NextResponse.json(
        { success: false, error: { message: 'Material not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: material })
  } catch (error: any) {
    console.error('Material fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch material' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// PUT /api/materials/[id] - 자료 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params

    // 권한 확인
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
      tagIds
    } = body

    // 자료 존재 확인
    const existingMaterial = await prisma.material.findUnique({
      where: { id }
    })

    if (!existingMaterial) {
      return NextResponse.json(
        { success: false, error: { message: 'Material not found' } },
        { status: 404 }
      )
    }

    // 트랜잭션으로 업데이트
    const updatedMaterial = await prisma.$transaction(async (tx) => {
      // 태그 업데이트
      if (tagIds !== undefined) {
        await tx.materialTag.deleteMany({
          where: { materialId: id }
        })

        if (tagIds.length > 0) {
          await tx.materialTag.createMany({
            data: tagIds.map((tagId: string) => ({
              materialId: id,
              tagId
            }))
          })
        }
      }

      // 자료 기본 정보 업데이트
      return tx.material.update({
        where: { id },
        data: {
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          fileUrl: fileUrl !== undefined ? fileUrl : undefined,
          fileType: fileType !== undefined ? fileType : undefined,
          fileSize: fileSize !== undefined ? parseInt(fileSize) : undefined,
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
    })

    return NextResponse.json({ success: true, data: updatedMaterial })
  } catch (error: any) {
    console.error('Material update error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update material' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// DELETE /api/materials/[id] - 자료 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params

    // 권한 확인
    if (!['ADMIN', 'SENIOR_TEACHER', 'TEACHER'].includes(user.roleLevel)) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied' } },
        { status: 403 }
      )
    }

    // 자료 존재 확인
    const material = await prisma.material.findUnique({
      where: { id }
    })

    if (!material) {
      return NextResponse.json(
        { success: false, error: { message: 'Material not found' } },
        { status: 404 }
      )
    }

    // 삭제
    await prisma.material.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully'
    })
  } catch (error: any) {
    console.error('Material deletion error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete material' } },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
