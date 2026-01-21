import { NextResponse } from 'next/server'
import { getCurrentUser, getServerFirestore } from '@/lib/auth'

function generateReferralCode(userId: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `DJ${code}`
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getServerFirestore()
  if (!db) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const userRef = db.collection('users').doc(user.id)
  const userDoc = await userRef.get()
  let userData = userDoc.data()

  if (!userData?.referral_code) {
    const code = generateReferralCode(user.id)
    await userRef.update({ referral_code: code })
    userData = { ...userData, referral_code: code }
  }

  const referralsSnapshot = await db.collection('referrals')
    .where('referrer_id', '==', user.id)
    .orderBy('created_at', 'desc')
    .get()

  const referrals = await Promise.all(referralsSnapshot.docs.map(async (doc) => {
    const data = doc.data()
    const referredDoc = await db.collection('users').doc(data.referred_id).get()
    const referredData = referredDoc.data()
    
    return {
      id: doc.id,
      ...data,
      referred: referredData ? { name: referredData.name, email: referredData.email } : null
    }
  }))

  const stats = {
    totalReferrals: referrals.length,
    convertedReferrals: referrals.filter(r => r.status === 'converted').length,
    totalRewards: referrals.filter(r => r.status === 'converted').reduce((sum, r) => sum + (r.reward_amount || 0), 0)
  }

  return NextResponse.json({ 
    referralCode: userData.referral_code,
    referrals,
    stats
  })
}

export async function POST(request: Request) {
  const { referralCode } = await request.json()

  if (!referralCode) {
    return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
  }

  const db = await getServerFirestore()
  if (!db) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const usersSnapshot = await db.collection('users')
    .where('referral_code', '==', referralCode.toUpperCase())
    .limit(1)
    .get()

  if (usersSnapshot.empty) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
  }

  const referrerDoc = usersSnapshot.docs[0]
  const referrerData = referrerDoc.data()

  return NextResponse.json({ 
    valid: true,
    referrerName: referrerData.name,
    referrerId: referrerDoc.id
  })
}
