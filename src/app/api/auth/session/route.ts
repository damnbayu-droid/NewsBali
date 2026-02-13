import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/session'

export async function GET() {
    try {
        const user = await getSession()

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        return NextResponse.json({ user })
    } catch (error) {
        console.error('Session API error:', error)
        return NextResponse.json(
            { error: 'Failed to get session', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
