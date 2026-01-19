import { supabase } from '@/lib/supabase'
import { BlogPost } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, ArrowRight } from 'lucide-react'

async function getBlogPosts(): Promise<BlogPost[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-16">
          <h1 className="font-display text-5xl sm:text-7xl text-white mb-4">THE BLOG</h1>
          <p className="text-white/50 text-lg max-w-2xl">
            Latest news, DJing tips, and music industry insights from DJ FLOWERZ.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 italic">New stories coming soon...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <div className="relative aspect-[16/10] rounded-3xl overflow-hidden mb-6 border border-white/10">
                  <Image
                    src={post.image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-white/40 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white group-hover:text-fuchsia-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-white/60 line-clamp-2 text-sm leading-relaxed">
                    {post.content.substring(0, 150)}...
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-fuchsia-400 font-semibold text-sm">
                    Read More
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
