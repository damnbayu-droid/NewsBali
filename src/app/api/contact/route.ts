import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const { name, email, subject, message } = await req.json()

        // 1. Save to Database
        const submission = await db.contactSubmission.create({
            data: {
                name,
                email,
                subject,
                message,
                status: 'UNREAD'
            }
        })

        // 2. Forward to Formspree (Optional)
        // If user provided a formspree URL in env, we could post to it here.
        // For now, saving to DB is sufficient as the Admin Panel has a "Submissions" tab.

        return NextResponse.json({ success: true, id: submission.id })
    } catch (error) {
        console.error('Contact Submission Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to submit' }, { status: 500 })
    }
}
