import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const user = await getSession()

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get recent activity logs
        const logs = await db.aiActivityLog.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
                article: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        status: true,
                    },
                },
            },
        })

        return NextResponse.json({ logs })
    } catch (error) {
        console.error('Error fetching activity logs:', error)
        return NextResponse.json(
            { error: 'Failed to fetch activity logs' },
            { status: 500 }
        )
    }
}
