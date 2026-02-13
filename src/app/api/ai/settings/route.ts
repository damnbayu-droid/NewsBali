import { NextResponse } from 'next/server'

export const runtime = 'edge'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const user = await getSession()
        if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const settings = await db.aiSettings.findFirst()

        return NextResponse.json(settings || { autoPublish: false, dailyLimit: 3 })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const user = await getSession()
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { autoPublish, dailyLimit } = body

        // Upsert settings (there should only be one record)
        const firstSetting = await db.aiSettings.findFirst()

        let settings
        if (firstSetting) {
            settings = await db.aiSettings.update({
                where: { id: firstSetting.id },
                data: {
                    autoPublish: autoPublish !== undefined ? autoPublish : undefined,
                    dailyLimit: dailyLimit !== undefined ? dailyLimit : undefined,
                }
            })
        } else {
            settings = await db.aiSettings.create({
                data: {
                    autoPublish: autoPublish || false,
                    dailyLimit: dailyLimit || 3,
                }
            })
        }

        return NextResponse.json(settings)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
