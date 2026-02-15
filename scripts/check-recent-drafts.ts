import { db } from '@/lib/db'

async function main() {
    console.log('Checking for ANY recent articles...')
    const recentArticles = await db.article.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            category: true,
            status: true,
            createdAt: true
        }
    })

    if (recentArticles.length === 0) {
        console.log('No articles found in DB.')
    } else {
        console.log(`Found ${recentArticles.length} latest articles:`)
        recentArticles.forEach(d => console.log(`- [${d.category}] ${d.title} (${d.status}) - Created: ${d.createdAt}`))
    }
}

main()
