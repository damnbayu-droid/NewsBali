
import { generateNewsArticles } from '@/lib/ai/news-generator'
import { db } from '@/lib/db'

async function main() {
    console.log('Testing Article Generation...')

    const systemUser = await db.user.findFirst({ where: { role: 'ADMIN' } })
    const authorId = systemUser?.id || 'system'

    console.log(`Using Author ID: ${authorId}`)

    try {
        const articles = await generateNewsArticles(1, authorId, 'DRAFT')
        console.log('Generation Result:', articles)

        if (articles.length === 0) {
            console.error('❌ Generator returned 0 articles. Check logs for silent failures.')
        } else {
            console.log('✅ Success!')
        }
    } catch (e) {
        console.error('❌ Fatal Error:', e)
    }
}

main()
