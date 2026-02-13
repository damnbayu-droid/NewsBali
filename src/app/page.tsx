import { db } from '@/lib/db'
import { ArticleCard } from '@/components/article/article-card'
import { CategorySection } from '@/components/article/category-section'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, AlertTriangle, Shield, FileText } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 60 // ISR: 60 seconds

async function getLatestArticles() {
  return db.article.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    include: {
      author: { select: { name: true } },
    },
  })
}

async function getFeaturedArticle() {
  return db.article.findFirst({
    where: {
      status: 'PUBLISHED',
      riskLevel: { not: 'CRITICAL' }
    },
    orderBy: [
      { viewCount: 'desc' },
      { publishedAt: 'desc' },
    ],
    include: {
      author: { select: { name: true } },
    },
  })
}

async function getArticlesByCategory(category: string) {
  return db.article.findMany({
    where: {
      status: 'PUBLISHED',
      category: category as any,
    },
    orderBy: { publishedAt: 'desc' },
    take: 4,
    include: {
      author: { select: { name: true } },
    },
  })
}

async function getPublishedCount() {
  return db.article.count({
    where: { status: 'PUBLISHED' }
  })
}

export default async function HomePage() {
  const [latestArticles, featuredArticle, tourismArticles, investmentArticles, incidentArticles, totalPublished] = await Promise.all([
    getLatestArticles(),
    getFeaturedArticle(),
    getArticlesByCategory('TOURISM'),
    getArticlesByCategory('INVESTMENT'),
    getArticlesByCategory('INCIDENTS'),
    getPublishedCount(),
  ])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured Article */}
            <div className="lg:col-span-2">
              {featuredArticle ? (
                <Link href={`/article/${featuredArticle.slug}`} className="group block">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
                    {featuredArticle.featuredImageUrl ? (
                      <Image
                        src={featuredArticle.featuredImageUrl}
                        alt={featuredArticle.featuredImageAlt || featuredArticle.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
                          {categoryLabels[featuredArticle.category]}
                        </Badge>
                        {featuredArticle.aiAssisted && (
                          <Badge variant="outline" className="bg-background/80 text-foreground">
                            AI-Assisted
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2">
                        {featuredArticle.title}
                      </h1>
                      <p className="text-white/80 line-clamp-2 mb-3">
                        {featuredArticle.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span>{featuredArticle.author?.name || 'NewsBali Team'}</span>
                        <span>•</span>
                        <span>
                          {featuredArticle.publishedAt?.toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="aspect-[16/9] rounded-lg bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">No articles yet</p>
                </div>
              )}
            </div>

            {/* Sidebar - Latest News */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Latest News</h2>
              </div>
              {latestArticles.slice(0, 4).map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className="group block p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="relative w-20 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                      {article.featuredImageUrl ? (
                        <Image
                          src={article.featuredImageUrl}
                          alt={article.featuredImageAlt || article.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {article.publishedAt?.toLocaleDateString('en-US')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-muted-foreground">Evidence-Based</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalPublished}+</p>
                <p className="text-sm text-muted-foreground">Published Articles</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
              <AlertTriangle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">Legal</p>
                <p className="text-sm text-muted-foreground">Legal Review</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">Transparent</p>
                <p className="text-sm text-muted-foreground">Editorial Process</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tourism Section */}
      {tourismArticles.length > 0 && (
        <CategorySection
          title="Tourism"
          category="TOURISM"
          articles={tourismArticles}
          viewAllHref="/category/tourism"
        />
      )}

      {/* Investment Section */}
      {investmentArticles.length > 0 && (
        <CategorySection
          title="Investment"
          category="INVESTMENT"
          articles={investmentArticles}
          viewAllHref="/category/investment"
        />
      )}

      {/* Incidents Section */}
      {incidentArticles.length > 0 && (
        <CategorySection
          title="Incidents"
          category="INCIDENTS"
          articles={incidentArticles}
          viewAllHref="/category/incidents"
        />
      )}

      {/* Submit Report CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Have Information?</h2>
              <p className="text-primary-foreground/80">
                Submit your report or information to our investigative team.
              </p>
            </div>
            <Link href="/submit-report">
              <Button variant="secondary" size="lg">
                Submit Report
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Independent Investigative Journalism</h2>
            <p className="text-muted-foreground mb-6">
              NewsBali Online is an independent investigative journalism platform focused on
              delivering evidence-based news with high journalistic ethics standards. We are committed
              to providing accurate, balanced, and accountable information.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/about">
                <Button variant="outline">About Us</Button>
              </Link>
              <Link href="/transparency">
                <Button variant="outline">Transparency</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const categoryLabels: Record<string, string> = {
  TOURISM: 'Tourism',
  INVESTMENT: 'Investment',
  INCIDENTS: 'Incidents',
  LOCAL: 'Local',
  JOBS: 'Jobs',
  OPINION: 'Opinion',
}
