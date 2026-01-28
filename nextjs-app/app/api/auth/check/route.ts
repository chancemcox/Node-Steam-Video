import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('video_app_auth')
  const isAuthenticated = authCookie?.value === 'authenticated'
  
  return NextResponse.json({ authenticated: isAuthenticated })
}
