import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import OpenAI from 'openai'
import { AGENT_PERSONAS } from '@/lib/ai/gemini-client'

export async function POST(req: NextRequest) {
    try {
        const { category, autoPublish } = await req.json()

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        // 1. Simulate "Viral Discovery" by asking AI to hallucinate/browse valid trends
        // In production, we'd fetch Google Trends RSS or Twitter API.
        // Here, we ask GPT-4o what is trending in Bali/Indonesia right now.

        const trendResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a trend watcher. Identify a realistic, highly probable VIRAL news topic for Bali, Indonesia right now. It can be about Tourism, Traffic, Culture, or Investment. Output strictly the topic headline." },
                { role: "user", content: category ? `Find a viral topic in category: ${category}` : "Find any viral topic." }
            ]
        })

        const trendingTopic = trendResponse.choices[0].message.content || "Bali Tourism Surge"

        // 2. Generate Article based on this trend
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: `${AGENT_PERSONAS.WUE.instructions} \n TASK: Write a detailed news article about this trending topic: "${trendingTopic}". Make it dramatic but factual (5W1H). Output JSON: { title, excerpt, content, category, riskLevel }. Content as markdown.` },
                { role: "user", content: `Topic: ${trendingTopic}` }
            ]
        })

        const rawJson = response.choices[0].message.content?.replace(/```json/g, '').replace(/```/g, '') || '{}'
        const articleData = JSON.parse(rawJson)

        // 3. Image
        const cleanTitle = articleData.title?.substring(0, 50).replace(/[^a-zA-Z0-9 ]/g, '') || 'news'
        const featuredImageUrl = `https://image.pollinations.ai/prompt/journalistic photo of ${cleanTitle}, bali viral news?seed=${Math.random()}`

        // 4. Save
        const slug = articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7)

        // Map category if needed
        const cat = category || "LOCAL" // simplify

        const newArticle = await db.article.create({
            data: {
                title: articleData.title,
                slug: slug,
                excerpt: articleData.excerpt || "No excerpt",
                content: articleData.content || "No content",
                category: cat as any,
                authorId: (await db.user.findFirst())?.id || "admin",
                status: autoPublish ? 'PUBLISHED' : 'DRAFT',
                publishedAt: autoPublish ? new Date() : null,
                aiAssisted: true,
                featuredImageUrl,
                verificationLevel: 'LOW' // Viral is risky
            }
        })

        await db.aiActivityLog.create({
            data: {
                action: 'discover-viral',
                articleId: newArticle.id,
                success: true,
                metadata: { trendingTopic }
            }
        })

        return NextResponse.json({ success: true, article: newArticle })

    } catch (error: any) {
        console.error('Viral Discovery Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
