import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Logout handled client-side via Firebase Auth.',
    info: 'The AuthContext handles Firebase signOut directly.'
  }, { status: 200 })
}
