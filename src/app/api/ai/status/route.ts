import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const settings = await db.aiSettings.findFirst()
        return NextResponse.json({
            agentStatus: settings?.agentStatus || { AUDY: 'Idle', AS: 'Idle', WUE: 'Idle', WIE: 'Idle' }
        })
    } catch (error) {
        return NextResponse.json({ agentStatus: {} }, { status: 500 })
    }
}
