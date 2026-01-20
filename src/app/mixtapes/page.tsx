import { adminDb } from '@/lib/firebase-admin'
import { Mixtape } from '@/lib/types'
import { MixtapesList } from '@/components/mixtapes/MixtapesList'

async function getMixtapes(): Promise<Mixtape[]> {
  try {
    const snapshot = await adminDb
      .collection('mixtapes')
      .orderBy('created_at', 'desc')
      .get()

    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.().toISOString() || new Date().toISOString()
      } as Mixtape
    })
  } catch (error) {
    console.error('Error fetching mixtapes:', error)
    return []
  }
}

export const revalidate = 60

export default async function MixtapesPage() {
  const mixtapes = await getMixtapes()

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-12">
          <h1 className="font-display text-5xl sm:text-7xl text-white mb-4">MIXTAPES</h1>
          <p className="text-white/50 text-lg max-w-2xl">
            Browse our collection of premium mixtapes. Free downloads and exclusive paid content available.
          </p>
        </div>
        <MixtapesList initialMixtapes={mixtapes} />
      </div>
    </div>
  )
}
