import { NextRequest, NextResponse } from 'next/server'
import { analyzeLegalRisk } from '@/lib/ai/legal-risk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, title } = body

    if (!content || !title) {
      return NextResponse.json(
        { error: 'Judul dan konten diperlukan' },
        { status: 400 }
      )
    }

    const riskAnalysis = await analyzeLegalRisk(content, title)

    return NextResponse.json({
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
      containsAccusation: riskAnalysis.containsAccusation,
      recommendations: riskAnalysis.recommendations,
      requiresLegalReview: riskAnalysis.requiresLegalReview,
    })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menganalisis risiko' },
      { status: 500 }
    )
  }
}
