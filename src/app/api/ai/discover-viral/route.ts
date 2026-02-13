import { NextResponse } from 'next/server'

export const runtime = 'edge'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import OpenAI from 'openai'



const CATEGORIES = ['TOURISM', 'INVESTMENT', 'INCIDENTS', 'LOCAL', 'JOBS', 'OPINION'] as const

export async function POST(request: Request) {
    try {
        const user = await getSession()

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { category, autoPublish = true } = body

        console.log('[Viral News] Discovering trending news...')

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })

        // Use AI to find trending topics and create article
        const selectedCategory = category || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]

        const prompt = `You are a news researcher and journalist specializing in Bali, Indonesia.

Research and create a realistic news article about a current trending topic in Bali for the category: ${selectedCategory}

Category guidelines:
- TOURISM: Hotel openings, festivals, tourist attractions, visitor trends
- INVESTMENT: Business investments, startups, economic development
- INCIDENTS: Accidents, natural events, emergencies, safety issues
- LOCAL: Community programs, cultural events, infrastructure
- JOBS: Employment opportunities, job fairs, training programs
- OPINION: Expert commentary, cultural analysis, social issues

IMPORTANT: Make this seem like real news happening NOW in Bali. Use:
- Recent dates (this week/month)
- Real Bali locations (Denpasar, Ubud, Sanur, Seminyak, Canggu, etc.)
- Realistic Indonesian names for sources
- Believable statistics and numbers
- Proper journalistic attribution

Return JSON with:
{
  "trendingTopic": "Brief description of the trending topic/story",
  "sourceType": "Government announcement|Press release|Industry report|Local news|Social media trend",
  "title": "Compelling headline (50-80 characters)",
  "excerpt": "Brief summary (100-150 characters)",
  "content": "Full article in HTML <p> tags (3-4 paragraphs, professional journalism)",
  "keyFacts": ["fact1", "fact2", "fact3"],
  "sources": ["Source name 1", "Source name 2"],
  "riskLevel": "LOW|MEDIUM|HIGH",
  "verificationLevel": "LOW|MEDIUM|HIGH",
  "reasoning": "Why this topic is trending and newsworthy"
}`

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an investigative journalist. Create realistic, newsworthy articles about current events in Bali. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.9, // Higher temperature for more creative/diverse topics
        })

        const result = JSON.parse(completion.choices[0].message.content || '{}')

        // Generate unique slug
        const baseSlug = result.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 100)

        let slug = baseSlug
        let counter = 1

        while (await db.article.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`
            counter++
        }

        // Create the article
        const article = await db.article.create({
            data: {
                title: result.title,
                slug,
                excerpt: result.excerpt,
                content: result.content,
                category: selectedCategory,
                featuredImageUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 9999999999)}?w=1200`,
                featuredImageAlt: result.title,
                imageSource: 'Unsplash',
                aiAssisted: true,
                riskLevel: result.riskLevel || 'LOW',
                riskScore: result.riskLevel === 'HIGH' ? 70 : result.riskLevel === 'MEDIUM' ? 40 : 15,
                verificationLevel: result.verificationLevel || 'MEDIUM',
                evidenceCount: result.keyFacts?.length || 0,
                status: autoPublish ? 'PUBLISHED' : 'DRAFT',
                authorId: user.id,
                publishedAt: autoPublish ? new Date() : null,
            },
        })

        // Log the activity
        await db.aiActivityLog.create({
            data: {
                action: 'discover-viral',
                category: selectedCategory,
                articleId: article.id,
                success: true,
                metadata: {
                    trendingTopic: result.trendingTopic,
                    sourceType: result.sourceType,
                    keyFacts: result.keyFacts,
                    sources: result.sources,
                    reasoning: result.reasoning,
                },
            },
        })

        console.log(`[Viral News] Created article: ${article.title}`)

        return NextResponse.json({
            success: true,
            article: {
                id: article.id,
                title: article.title,
                slug: article.slug,
                category: article.category,
                status: article.status,
            },
            discovery: {
                trendingTopic: result.trendingTopic,
                sourceType: result.sourceType,
                reasoning: result.reasoning,
            },
        })
    } catch (error) {
        console.error('[Viral News] Error:', error)

        // Log failed attempt
        try {
            await db.aiActivityLog.create({
                data: {
                    action: 'discover-viral',
                    success: false,
                    metadata: {
                        error: error instanceof Error ? error.message : 'Unknown error',
                    },
                },
            })
        } catch (logError) {
            console.error('Failed to log error:', logError)
        }

        return NextResponse.json(
            { error: 'Failed to discover and create viral news', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
