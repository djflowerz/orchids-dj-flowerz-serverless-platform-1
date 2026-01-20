import { adminDb } from '@/lib/firebase-admin'
import { Mixtape } from '@/lib/types'
import { notFound } from 'next/navigation'
import { MixtapeDetail } from '@/components/mixtapes/MixtapeDetail'

async function getMixtape(id: string): Promise<Mixtape | null> {
  try {
    const doc = await adminDb.collection('mixtapes').doc(id).get()
    if (!doc.exists) return null

    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      created_at: data?.created_at?.toDate?.().toISOString() || new Date().toISOString()
    } as Mixtape
  } catch (error) {
    console.error('Error fetching mixtape:', error)
    return null
  }
}

export const revalidate = 60

export default async function MixtapeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mixtape = await getMixtape(id)

  if (!mixtape) {
    notFound()
  }

  return <MixtapeDetail mixtape={mixtape} />
}
