
export async function validateImageUrl(url: string): Promise<boolean> {
    if (!url) return false

    try {
        // Check if it's a valid URL string
        new URL(url)

        const res = await fetch(url, { method: 'HEAD' })
        return res.ok
    } catch (error) {
        console.warn(`Image validation failed for ${url}:`, error)
        return false
    }
}

export async function checkArticleImages(articles: any[]) {
    const updates = []

    for (const article of articles) {
        if (article.featuredImageUrl) {
            const isValid = await validateImageUrl(article.featuredImageUrl)
            if (!isValid) {
                updates.push({
                    id: article.id,
                    title: article.title,
                    status: 'BROKEN_IMAGE'
                })
            }
        } else {
            updates.push({
                id: article.id,
                title: article.title,
                status: 'MISSING_IMAGE'
            })
        }
    }

    return updates
}
