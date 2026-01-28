import { prisma } from '@/lib/prisma'
import { Mixtape } from '@/lib/types'
import { MixtapesList } from '@/components/mixtapes/MixtapesList'

async function getMixtapes(): Promise<Mixtape[]> {
  try {
    const mixtapes = await prisma.mixtape.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    })

    return mixtapes.map((m: typeof mixtapes[number]) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      price: m.price,
      cover_image: m.coverImage || '',
      stream_url: m.audioUrl || '',
      download_url: m.audioDownloadUrl || '',
      category: m.genre,
      downloads: m.plays,
      status: m.status,
      created_at: m.createdAt.toISOString()
    }))
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
