import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import OpenAI from 'openai'

// Force dynamic
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const { autoPublish } = await req.json()

        const openai = new OpenAI({
            apiKey: process.env.WIE_OPENAI_API_KEY,
        })

        // 1. Check last execution time (6-hour window)
        const lastRun = await db.aiActivityLog.findFirst({
            where: { action: 'discover-viral' },
            orderBy: { createdAt: 'desc' },
        })

        const now = new Date()
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)

        // Bypass check if strictly debugging/manual run, but for "Super Smart" mode we respect it
        // For now, we allow manual trigger to always run, but log the "Traffic Analysis"

        // 2. "Super Smart" Simulation: Analyze "Current Trends"
        // Since we don't have browsing, we ask AI to simulate based on its knowledge of Bali dynamics
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an elite Investigative Journalist AI specialized in Bali, Indonesia. 
          Your task: SIMULATE a deep search of Twitter, Instagram, Facebook, and Google Trends for the current date/time in Bali.
          
          Based on typical patterns (traffic jams in Canggu, ceremonies in Ubud, investment news in Seminyak, crime reports), 
          GENERATE 3 highly plausible, "Viral" news concepts.
          
          Focus on:
          1. "Real-time" feel (e.g., "Just now", "Breaking").
          2. Specific locations (e.g., "Jalan Raya Canggu", "Batu Bolong").
          3. Emotional hook (User outrage, celebration, shock).
          
          Return JSON format: { "topics": [ { "title": "...", "category": "..." } ] }
          Categories: TOURISM, INCIDENTS, LOCAL, INVESTMENT.
          `
                },
                {
                    role: "user",
                    content: `Current Time: ${now.toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })}. Find me 3 viral topics.`
                }
            ],
            response_format: { type: "json_object" }
        })

        const result = JSON.parse(completion.choices[0].message.content || '{}')
        const topics = result.topics || []

        const createdArticles: any[] = []

        for (const topic of topics) {
            if (!topic.title) continue

            // Generate the article content for this topic
            const contentCompletion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are a senior editor. Write a short, punchy, viral news article (300 words) based on this topic. Use 5W1H format. HTML format."
                    },
                    {
                        role: "user",
                        content: `Topic: ${topic.title}. Category: ${topic.category}. Context: Bali.`
                    }
                ]
            })

            const content = contentCompletion.choices[0].message.content || ''
            const cleanTitle = topic.title.replace(/[^a-zA-Z0-9 ]/g, '')

            // Create proper title/slug
            const slug = `viral-${cleanTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`.substring(0, 50)

            const article = await db.article.create({
                data: {
                    title: topic.title,
                    slug,
                    excerpt: `Viral Alert: ${topic.title}`,
                    content,
                    category: topic.category,
                    status: autoPublish ? 'PUBLISHED' : 'DRAFT',
                    publishedAt: autoPublish ? new Date() : null,
                    aiAssisted: true,
                    riskLevel: 'MEDIUM', // Viral content is usually riskier
                    featuredImageUrl: `https://image.pollinations.ai/prompt/news photo of ${cleanTitle}, bali context, dramatic, 4k?nologo=true&private=true&enhance=false`,
                    author: {
                        connectOrCreate: {
                            where: { email: 'ai.viral@newsbali.online' },
                            create: { email: 'ai.viral@newsbali.online', name: 'Viral Hunter AI', role: 'ADMIN' }
                        }
                    }
                }
            })
            createdArticles.push(article)
        }

        // Log Activity
        await db.aiActivityLog.create({
            data: {
                action: 'discover-viral',
                metadata: {
                    count: createdArticles.length,
                    topics: topics.map((t: any) => t.title),
                    analysis: "Simulated deep search of social media signals."
                },
                success: true
            }
        })

        return NextResponse.json({ success: true, articles: createdArticles })

    } catch (error) {
        console.error('Viral Discovery Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to discover viral news' }, { status: 500 })
    }
}
