import OpenAI from 'openai'
import { db } from '@/lib/db'
import { Category, RiskLevel, Verification, Status } from '@prisma/client'



interface GeneratedArticle {
    title: string
    excerpt: string
    content: string
    riskLevel: RiskLevel
    verificationLevel: Verification
    evidenceCount: number
}

const CATEGORIES: Category[] = ['TOURISM', 'INVESTMENT', 'INCIDENTS', 'LOCAL', 'JOBS', 'OPINION']

// Weighted category distribution
const CATEGORY_WEIGHTS = {
    TOURISM: 30,
    INVESTMENT: 20,
    LOCAL: 20,
    JOBS: 15,
    INCIDENTS: 10,
    OPINION: 5,
}

function selectRandomCategory(): Category {
    const totalWeight = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0)
    let random = Math.random() * totalWeight

    for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
        random -= weight
        if (random <= 0) {
            return category as Category
        }
    }

    return 'TOURISM' // fallback
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100)
}

const CATEGORY_GUIDELINES = {
    TOURISM: 'tourism industry, hotels, festivals, cultural attractions, visitor experiences',
    INVESTMENT: 'business investments, startups, funding rounds, economic development, venture capital',
    INCIDENTS: 'accidents, natural disasters, emergencies, safety alerts, volcanic activity',
    LOCAL: 'community initiatives, local government programs, cultural preservation, infrastructure',
    JOBS: 'employment opportunities, job fairs, training programs, career development',
    OPINION: 'expert commentary, cultural analysis, social issues, policy discussions',
}

async function generateArticleContent(category: Category): Promise<GeneratedArticle> {
    const prompt = `You are a professional English journalist writing news articles about Bali, Indonesia.

Generate a realistic news article with the following specifications:
- Category: ${category}
- Topic focus: ${CATEGORY_GUIDELINES[category]}
- Language: English (professional journalism standards)
- Tone: Neutral, objective, factual
- Length: 2-3 well-developed paragraphs
- Location: Bali, Indonesia (use real locations like Denpasar, Ubud, Sanur, Seminyak, Gianyar, Tabanan, etc.)

Requirements:
1. Create a completely realistic and plausible news story about Bali
2. Use specific Balinese locations, realistic names (Indonesian names), and believable statistics
3. Include proper journalistic attribution ("according to...", "officials stated...", "spokesperson announced...")
4. Write in professional news article format with proper paragraphs
5. Avoid sensationalism, clickbait, or exaggeration
6. For OPINION pieces, include a byline like "By: [Name], [Title/Expertise]"

CRITICAL: Return ONLY a valid JSON object with this EXACT structure:
{
  "title": "Article title (50-80 characters, clear and informative)",
  "excerpt": "Brief compelling summary (100-150 characters)",
  "content": "Full article content in HTML format using <p> tags for each paragraph (2-3 paragraphs)",
  "riskLevel": "LOW or MEDIUM or HIGH",
  "verificationLevel": "LOW or MEDIUM or HIGH",
  "evidenceCount": 0-5
}

Risk level guidelines:
- LOW: General news, announcements, positive developments
- MEDIUM: Incidents, controversies, policy changes
- HIGH: Major emergencies, scandals, serious accusations

Verification level guidelines:
- LOW: Opinion pieces, general announcements
- MEDIUM: Standard news reporting
- HIGH: Investigative reports, major developments`

    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional journalist. Always respond with valid JSON only, no additional text.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.8, // Higher creativity for diverse articles
        })

        const result = JSON.parse(response.choices[0].message.content || '{}')

        return {
            title: result.title,
            excerpt: result.excerpt,
            content: result.content,
            riskLevel: result.riskLevel as RiskLevel,
            verificationLevel: result.verificationLevel as Verification,
            evidenceCount: result.evidenceCount || 0,
        }
    } catch (error) {
        console.error('Error generating article:', error)
        throw new Error('Failed to generate article content')
    }
}

export async function generateNewsArticles(count: number = 3, authorId: string, status: Status = 'PUBLISHED') {
    const articles: any[] = []

    for (let i = 0; i < count; i++) {
        try {
            const category = selectRandomCategory()
            const generated = await generateArticleContent(category)

            // Generate unique slug
            const baseSlug = generateSlug(generated.title)
            let slug = baseSlug
            let counter = 1

            // Ensure slug is unique
            while (await db.article.findUnique({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`
                counter++
            }

            // Random publish time within the last 24 hours
            const hoursAgo = Math.floor(Math.random() * 24)
            const publishedAt = new Date(Date.now() - hoursAgo * 3600000)

            const article = await db.article.create({
                data: {
                    title: generated.title,
                    slug,
                    excerpt: generated.excerpt,
                    content: generated.content,
                    category,
                    // Use Pollinations AI for reliable image generation based on title
                    featuredImageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(generated.title + ' Bali news realistic')}?width=1200&height=800&nologo=true`,
                    featuredImageAlt: generated.title,
                    imageSource: 'AI Generated',
                    aiAssisted: true, // Mark as AI-generated
                    riskLevel: generated.riskLevel,
                    riskScore: generated.riskLevel === 'HIGH' ? 70 : generated.riskLevel === 'MEDIUM' ? 40 : 15,
                    containsAccusation: false,
                    verificationLevel: generated.verificationLevel,
                    evidenceCount: generated.evidenceCount,
                    legalReviewRequired: generated.riskLevel === 'HIGH',
                    status: status,
                    authorId,
                    publishedAt,
                },
            })

            articles.push(article)

            // Small delay between generations to avoid rate limits
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        } catch (error) {
            console.error(`Failed to generate article ${i + 1}:`, error)
            // Continue with next article
        }
    }

    return articles
}
