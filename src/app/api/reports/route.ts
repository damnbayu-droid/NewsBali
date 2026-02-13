import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { analyzeLegalRisk } from '@/lib/ai/legal-risk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, category, content, sourceContact, evidenceLinks } = body

    // Analyze legal risk
    const riskAnalysis = await analyzeLegalRisk(content, title)

    // Create draft article from report
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now()

    const article = await db.article.create({
      data: {
        title,
        slug,
        excerpt: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
        content,
        category: category || 'LOCAL',
        riskLevel: riskAnalysis.riskLevel,
        riskScore: riskAnalysis.riskScore,
        containsAccusation: riskAnalysis.containsAccusation,
        legalReviewRequired: riskAnalysis.requiresLegalReview,
        status: 'DRAFT',
        authorId: 'system', // We'll need to handle this better
      },
    })

    // Create evidence records if provided
    if (evidenceLinks && evidenceLinks.length > 0) {
      await db.evidence.createMany({
        data: evidenceLinks.map((url: string) => ({
          articleId: article.id,
          fileUrl: url,
          type: 'document',
          source: sourceContact || 'Anonim',
        })),
      })
    }

    return NextResponse.json({
      success: true,
      articleId: article.id,
      riskAnalysis: {
        riskLevel: riskAnalysis.riskLevel,
        riskScore: riskAnalysis.riskScore,
        requiresLegalReview: riskAnalysis.requiresLegalReview,
        recommendations: riskAnalysis.recommendations,
      },
    })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengirim laporan' },
      { status: 500 }
    )
  }
}
