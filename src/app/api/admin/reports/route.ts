import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const user = await getSession()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const reports = await db.report.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to 100 for now
        })

        return NextResponse.json(reports)
    } catch (error) {
        console.error('Error fetching reports:', error)
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        )
    }
}
