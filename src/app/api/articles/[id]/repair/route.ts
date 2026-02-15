
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateImageUrl } from '@/lib/ai/image-validator'

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const article = await db.article.findUnique({
            where: { id: params.id }
        })

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 })
        }

        // Generate new image URL
        // Use Pollinations with a random seed and specific prompt to force a fresh image
        const seed = Math.floor(Math.random() * 100000)
        const cleanTitle = article.title.substring(0, 50).replace(/[^a-zA-Z0-9 ]/g, '')
        // Updated Prompt Strategy: More specific and simpler to avoid bad generations
        const prompt = `journalistic photo of ${cleanTitle}, bali daily life, realistic, high quality, 4k`

        let newImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=800&nologo=true&seed=${seed}`

        // Validate
        let isValid = await validateImageUrl(newImageUrl)

        // One retry with different source (LoremFlickr) if Pollinations fails
        if (!isValid) {
            const keywords = cleanTitle.split(' ').slice(0, 3).join(',')
            newImageUrl = `https://loremflickr.com/1200/800/${keywords}?lock=${seed}`
            isValid = await validateImageUrl(newImageUrl)
        }

        if (!isValid) {
            return NextResponse.json({ error: 'Failed to generate valid image' }, { status: 500 })
        }

        const updatedArticle = await db.article.update({
            where: { id: params.id },
            data: {
                featuredImageUrl: newImageUrl,
                imageSource: 'AI Repaired'
            }
        })

        return NextResponse.json({
            success: true,
            imageUrl: newImageUrl,
            article: updatedArticle
        })

    } catch (error) {
        console.error('Image repair failed:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
