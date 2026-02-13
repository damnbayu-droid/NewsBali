import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const articles = await db.article.findMany({
      where: { 
        status: 'PUBLISHED',
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
      },
    })

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('Get breaking news error:', error)
    return NextResponse.json(
      { articles: [], error: 'Failed to fetch breaking news' },
      { status: 500 }
    )
  }
}
