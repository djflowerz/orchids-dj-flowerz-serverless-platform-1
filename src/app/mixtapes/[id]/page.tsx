import { supabase } from '@/lib/supabase'
import { Mixtape } from '@/lib/types'
import { notFound } from 'next/navigation'
import { MixtapeDetail } from '@/components/mixtapes/MixtapeDetail'

async function getMixtape(id: string): Promise<Mixtape | null> {
  const { data } = await supabase
    .from('mixtapes')
    .select('*')
    .eq('id', id)
    .single()
  return data
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
