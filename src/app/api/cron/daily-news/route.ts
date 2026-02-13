import { NextResponse } from 'next/server'
import { generateNewsArticles } from '@/lib/ai/news-generator'
import { db } from '@/lib/db'

// This endpoint is called by Vercel Cron or external schedulers
// Runs daily at 6 AM Bali time (UTC+8)
export async function GET(request: Request) {
    try {
        // Verify cron secret for security (Vercel Cron sets this header)
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        console.log('[CRON] Starting daily news generation...')

        // Get admin user to author the articles
        const adminUser = await db.user.findFirst({
            where: { role: 'ADMIN' }
        })

        if (!adminUser) {
            throw new Error('No admin user found')
        }

        // Generate 3 articles
        const articles = await generateNewsArticles(3, adminUser.id)

        console.log(`[CRON] Successfully generated ${articles.length} articles`)

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            count: articles.length,
            articles: articles.map(a => ({
                id: a.id,
                title: a.title,
                category: a.category,
            })),
        })
    } catch (error) {
        console.error('[CRON] Error generating daily news:', error)
        return NextResponse.json(
            {
                error: 'Failed to generate daily news',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
