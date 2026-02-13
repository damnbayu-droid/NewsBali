import { NextResponse } from 'next/server'

export const runtime = 'edge'
import { getSession } from '@/lib/auth/session'
import { generateNewsArticles } from '@/lib/ai/news-generator'

export async function POST(request: Request) {
    try {
        // Check authentication
        const user = await getSession()

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 401 }
            )
        }

        // Get count from request body
        const body = await request.json()
        const count = body.count || 3

        if (count < 1 || count > 10) {
            return NextResponse.json(
                { error: 'Count must be between 1 and 10' },
                { status: 400 }
            )
        }

        console.log(`Generating ${count} news articles...`)

        // Generate articles
        const articles = await generateNewsArticles(count, user.id)

        return NextResponse.json({
            success: true,
            count: articles.length,
            articles: articles.map(a => ({
                id: a.id,
                title: a.title,
                slug: a.slug,
                category: a.category,
                publishedAt: a.publishedAt,
            })),
        })
    } catch (error) {
        console.error('Error generating news:', error)
        return NextResponse.json(
            { error: 'Failed to generate news articles', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
