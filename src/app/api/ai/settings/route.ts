import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

// GET - Fetch AI settings
export async function GET() {
    try {
        const user = await getSession()

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get or create settings
        let settings = await db.aiSettings.findFirst()

        if (!settings) {
            settings = await db.aiSettings.create({
                data: {
                    autoPublish: false,
                    dailyLimit: 3,
                },
            })
        }

        return NextResponse.json({ settings })
    } catch (error) {
        console.error('Error fetching AI settings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}

// POST - Update AI settings
export async function POST(request: Request) {
    try {
        const user = await getSession()

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { autoPublish, dailyLimit } = body

        let settings = await db.aiSettings.findFirst()

        if (!settings) {
            settings = await db.aiSettings.create({
                data: {
                    autoPublish: autoPublish ?? false,
                    dailyLimit: dailyLimit ?? 3,
                },
            })
        } else {
            settings = await db.aiSettings.update({
                where: { id: settings.id },
                data: {
                    autoPublish: autoPublish ?? settings.autoPublish,
                    dailyLimit: dailyLimit ?? settings.dailyLimit,
                },
            })
        }

        return NextResponse.json({ settings })
    } catch (error) {
        console.error('Error updating AI settings:', error)
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        )
    }
}
