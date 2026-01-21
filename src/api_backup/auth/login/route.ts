import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Use client-side Firebase Auth for login.',
    info: 'The AuthContext handles Firebase authentication directly.'
  }, { status: 200 })
}
