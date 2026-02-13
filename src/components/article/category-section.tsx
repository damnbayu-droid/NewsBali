import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArticleCard } from './article-card'
import { ChevronRight } from 'lucide-react'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  featuredImageUrl: string | null
  featuredImageAlt: string | null
  publishedAt: Date | null
  viewCount: number
  aiAssisted: boolean
  author?: { name: string | null } | null
}

interface CategorySectionProps {
  title: string
  category: string
  articles: Article[]
  viewAllHref: string
}

export function CategorySection({ title, articles, viewAllHref }: CategorySectionProps) {
  if (articles.length === 0) return null

  return (
    <section className="py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <Link href={viewAllHref}>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  )
}
