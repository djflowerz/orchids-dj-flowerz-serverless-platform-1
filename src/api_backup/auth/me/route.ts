import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Server-side auth not configured. Use client-side Firebase Auth.' 
  }, { status: 501 })
}
