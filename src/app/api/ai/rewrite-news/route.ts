import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import OpenAI from 'openai'



export async function POST(request: Request) {
    try {
        const user = await getSession()

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { url, autoPublish } = body

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        console.log(`Rewriting news from: ${url}`)

        // Fetch the original content (simplified - in production use a proper scraper)
        // Fetch the original content with timeout and headers
        let originalContent = ''
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                },
                signal: controller.signal
            })
            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
            }

            const html = await response.text()

            // Better text extraction
            // 1. Remove scripts and styles
            const noScript = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gmi, ' ')
                .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gmi, ' ')
                .replace(/<[^>]+>/g, ' ') // Remove tags

            // 2. Clean whitespace
            originalContent = noScript.replace(/\s+/g, ' ').trim().substring(0, 15000) // Increase limit for better context

            if (originalContent.length < 100) {
                throw new Error('Could not extract enough content from URL')
            }
        } catch (error) {
            console.error('Error fetching URL:', error)
            return NextResponse.json({
                error: 'Failed to fetch URL content. The site might block bots or the URL is invalid.'
            }, { status: 400 })
        }

        // Use AI to analyze and rewrite
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })

        const prompt = `You are a professional news editor. Analyze and rewrite the following news article for NewsBali, an investigative journalism platform focused on Bali.

Original article URL: ${url}

Original content (excerpt):
${originalContent}

Please provide a JSON response with:
{
  "keyPoints": ["list", "of", "main", "points"],
  "category": "TOURISM|INVESTMENT|INCIDENTS|LOCAL|JOBS|OPINION",
  "title": "Rewritten headline (50-80 chars)",
  "excerpt": "Brief summary (100-150 chars)",
  "content": "Full rewritten article in HTML <p> tags (2-3 paragraphs, different writing style but same facts)",
  "aiThoughts": "Your analysis of the article, why you chose this category, writing approach, and risk assessment",
  "sources": ["original sources mentioned in article"],
  "riskLevel": "LOW|MEDIUM|HIGH",
  "verificationLevel": "LOW|MEDIUM|HIGH"
}

IMPORTANT:
- Keep all facts and sources from original
- Write in professional journalism style
- Make it unique and engaging
- Maintain factual accuracy`

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional news editor and rewriter. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        })

        const result = JSON.parse(completion.choices[0].message.content || '{}')

        // Log the activity
        await db.aiActivityLog.create({
            data: {
                action: 'rewrite',
                category: result.category,
                sourceUrl: url,
                success: true,
                metadata: {
                    keyPoints: result.keyPoints,
                    aiThoughts: result.aiThoughts,
                    sources: result.sources,
                },
            },
        })

        // Optionally create article if autoPublish is true
        if (autoPublish) {
            const slug = result.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .substring(0, 100)

            const article = await db.article.create({
                data: {
                    title: result.title,
                    slug: `${slug}-${Date.now()}`,
                    excerpt: result.excerpt,
                    content: result.content,
                    category: result.category,
                    featuredImageUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 9999999999)}?w=1200`,
                    featuredImageAlt: result.title,
                    imageSource: url,
                    aiAssisted: true,
                    riskLevel: result.riskLevel,
                    riskScore: result.riskLevel === 'HIGH' ? 70 : result.riskLevel === 'MEDIUM' ? 40 : 15,
                    verificationLevel: result.verificationLevel,
                    status: 'DRAFT', // Always draft for review
                    authorId: user.id,
                },
            })

            result.articleId = article.id
        }

        return NextResponse.json({
            success: true,
            original: {
                url,
                excerpt: originalContent.substring(0, 200) + '...',
            },
            rewritten: result,
        })
    } catch (error) {
        console.error('Error rewriting news:', error)

        // Log failed attempt
        try {
            await db.aiActivityLog.create({
                data: {
                    action: 'rewrite',
                    sourceUrl: request.url,
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
            { error: 'Failed to rewrite news', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
