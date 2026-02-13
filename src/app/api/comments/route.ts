import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { commentSchema } from '@/lib/validators'
import { moderateContent, getCommentStatusFromModeration } from '@/lib/ai/moderation'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Anda harus login untuk berkomentar' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const result = commentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content, articleId, parentId } = result.data

    // Check if article exists
    const article = await db.article.findUnique({
      where: { id: articleId },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Artikel tidak ditemukan' },
        { status: 404 }
      )
    }

    // Moderate content
    const moderation = await moderateContent(content)
    const status = getCommentStatusFromModeration(moderation)

    // Create comment
    const comment = await db.comment.create({
      data: {
        content,
        articleId,
        userId: user.id,
        parentId,
        status,
        toxicityScore: Math.max(
          moderation.categories.hate,
          moderation.categories.harassment,
          moderation.categories.violence
        ),
        legalRiskScore: moderation.categories.defamation,
      },
      include: {
        user: { select: { name: true, avatar: true } },
      },
    })

    return NextResponse.json({
      comment,
      status,
      moderation: {
        flagged: moderation.flagged,
        reason: moderation.reason,
      },
    })
  } catch (error) {
    console.error('Comment error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengirim komentar' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId diperlukan' },
        { status: 400 }
      )
    }

    const comments = await db.comment.findMany({
      where: {
        articleId,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, avatar: true } },
      },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil komentar' },
      { status: 500 }
    )
  }
}
