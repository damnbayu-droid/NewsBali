import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'edge'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const comment = await db.comment.update({
      where: { id },
      data: { status: body.status },
    })

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Update comment error:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await db.comment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
