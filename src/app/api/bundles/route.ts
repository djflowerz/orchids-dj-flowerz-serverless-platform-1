import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, Timestamp, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { auth, currentUser } from '@clerk/nextjs/server'

async function checkAdmin() {
  const { userId } = auth()
  const user = await currentUser()
  if (!userId || !user) return null
  const email = user.emailAddresses[0]?.emailAddress
  const isAdmin = user.publicMetadata?.role === 'admin' || email === 'ianmuriithiflowerz@gmail.com'
  return isAdmin ? user : null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    const q = query(
      collection(db, 'bundles'),
      where('status', '==', status),
      orderBy('created_at', 'desc')
    )

    const snapshot = await getDocs(q)
    const bundles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.().toISOString() || new Date().toISOString(),
      updated_at: doc.data().updated_at?.toDate?.().toISOString() || new Date().toISOString()
    }))

    return NextResponse.json({ bundles })
  } catch (error) {
    console.error('Error fetching bundles:', error)
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await checkAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      name,
      description,
      bundle_type,
      products,
      cover_image,
      regular_price,
      bundle_price,
      discount_percentage,
      max_quantity,
      status = 'active'
    } = body

    if (!name || !products || !bundle_price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const bundleDoc = await addDoc(collection(db, 'bundles'), {
      name,
      description: description || null,
      bundle_type: bundle_type || 'combo',
      products,
      cover_image: cover_image || null,
      regular_price: regular_price || 0,
      bundle_price,
      discount_percentage: discount_percentage || ((regular_price - bundle_price) / regular_price) * 100,
      max_quantity: max_quantity || null,
      status,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    })

    return NextResponse.json({
      bundle: {
        id: bundleDoc.id,
        name,
        description,
        bundle_type,
        products,
        cover_image,
        regular_price,
        bundle_price,
        discount_percentage,
        max_quantity,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating bundle:', error)
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await checkAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Bundle ID required' }, { status: 400 })
    }

    await updateDoc(doc(db, 'bundles', id), {
      ...updates,
      updated_at: Timestamp.now()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating bundle:', error)
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await checkAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Bundle ID required' }, { status: 400 })
    }

    await deleteDoc(doc(db, 'bundles', id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bundle:', error)
    return NextResponse.json({ error: 'Failed to delete bundle' }, { status: 500 })
  }
}
