import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'edge'

export async function GET() {
  try {
    const comments = await db.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        article: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}
