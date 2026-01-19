import { supabase } from '@/lib/supabase'
import { Mixtape } from '@/lib/types'
import { MixtapesList } from '@/components/mixtapes/MixtapesList'

async function getMixtapes(): Promise<Mixtape[]> {
  const { data } = await supabase
    .from('mixtapes')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
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
