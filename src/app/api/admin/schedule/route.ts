import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force dynamic
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const schedules = await db.scheduleConfig.findMany({
            orderBy: { time: 'asc' }
        })
        return NextResponse.json({ schedules })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { time, label, slots } = body

        const schedule = await db.scheduleConfig.create({
            data: {
                time,
                label,
                slots: parseInt(slots) || 1,
                isActive: true
            }
        })

        return NextResponse.json({ schedule })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await db.scheduleConfig.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
    }
}
