interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  featuredImageUrl: string | null
  featuredImageAlt: string | null
  publishedAt: Date | null
  author?: { name: string | null } | null
}

interface ArticleJsonLdProps {
  article: Article
}

export function ArticleJsonLd({ article }: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImageUrl ? [article.featuredImageUrl] : [],
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.publishedAt?.toISOString(),
    author: {
      '@type': 'Person',
      name: article.author?.name || 'Tim NewsBali',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NewsBali Online',
      logo: {
        '@type': 'ImageObject',
        url: 'https://newsbali.online/logo.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://newsbali.online/article/${article.slug}`,
    },
    articleSection: article.category,
    inLanguage: 'en',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NewsBali Online',
    url: 'https://newsbali.online',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://newsbali.online/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'NewsBali Online',
    url: 'https://newsbali.online',
    logo: 'https://newsbali.online/logo.svg',
    sameAs: [
      'https://facebook.com/newsbali',
      'https://twitter.com/newsbali',
      'https://instagram.com/newsbali',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'kontak@newsbali.online',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
