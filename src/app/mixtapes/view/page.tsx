"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Mixtape } from '@/lib/types'
import { MixtapeDetail } from '@/components/mixtapes/MixtapeDetail'

function MixtapeContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [mixtape, setMixtape] = useState<Mixtape | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchMixtape() {
      if (!id) return

      try {
        const docRef = doc(db, 'mixtapes', id)
        const snap = await getDoc(docRef)

        if (snap.exists()) {
          const data = snap.data()
          setMixtape({
            id: snap.id,
            ...data,
            created_at: data?.created_at?.toDate?.().toISOString() || new Date().toISOString()
          } as Mixtape)
        } else {
          setError(true)
        }
      } catch (e) {
        console.error('Error fetching mixtape:', e)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchMixtape()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error || !mixtape) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
        <h2 className="text-2xl font-bold mb-4">Mixtape Not Found</h2>
        <p className="text-white/60 mb-8">The mixtape you are looking for does not exist.</p>
        <a href="/mixtapes" className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          Back to Mixtapes
        </a>
      </div>
    )
  }

  return <MixtapeDetail mixtape={mixtape} />
}

export default function MixtapePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
      <MixtapeContent />
    </Suspense>
  )
}
