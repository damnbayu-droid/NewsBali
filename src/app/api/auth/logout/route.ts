import { NextResponse } from 'next/server'
import { destroySession, clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    await destroySession()
    await clearSessionCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    )
  }
}
