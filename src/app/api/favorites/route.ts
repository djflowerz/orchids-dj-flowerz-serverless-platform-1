import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    const q = query(
      collection(db, 'user_favorites'),
      where('user_id', '==', userId)
    )

    const snapshot = await getDocs(q)
    const favorites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.().toISOString() || new Date().toISOString()
    }))

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entityType, entityId } = await request.json()

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress

    // Check if already favorited
    const q = query(
      collection(db, 'user_favorites'),
      where('user_id', '==', userId),
      where('entity_type', '==', entityType),
      where('entity_id', '==', entityId)
    )

    const existing = await getDocs(q)
    if (!existing.empty) {
      return NextResponse.json({ error: 'Already in favorites' }, { status: 409 })
    }

    const favoriteDoc = await addDoc(collection(db, 'user_favorites'), {
      user_id: userId,
      user_email: userEmail,
      entity_type: entityType,
      entity_id: entityId,
      created_at: Timestamp.now()
    })

    return NextResponse.json({
      favorite: {
        id: favoriteDoc.id,
        user_id: userId,
        user_email: userEmail,
        entity_type: entityType,
        entity_id: entityId,
        created_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating favorite:', error)
    return NextResponse.json({ error: 'Failed to create favorite' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const q = query(
      collection(db, 'user_favorites'),
      where('user_id', '==', userId),
      where('entity_type', '==', entityType),
      where('entity_id', '==', entityId)
    )

    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 })
    }

    await deleteDoc(doc(db, 'user_favorites', snapshot.docs[0].id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting favorite:', error)
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 })
  }
}
