"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BlogPost } from '@/lib/types'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, Share2 } from 'lucide-react'

function BlogPostContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug')

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return

      try {
        const q = query(collection(db, 'blog_posts'), where('slug', '==', slug))
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          const data = doc.data()
          setPost({
            id: doc.id,
            ...data,
            created_at: data.created_at?.toDate?.().toISOString() || new Date().toISOString(),
            updated_at: data.updated_at?.toDate?.().toISOString() || new Date().toISOString()
          } as BlogPost)
        } else {
          setError(true)
        }
      } catch (e) {
        console.error('Error fetching blog post:', e)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
        <p className="text-white/60 mb-8">The blog post you are looking for does not exist.</p>
        <Link href="/blog" className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          Back to Blog
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[400px]">
        <Image
          src={post.image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200'}
          alt={post.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute top-4 left-4">
          <Link href="/blog" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
            <ArrowLeft size={20} />
            Back to Blog
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 text-white/60 mb-6">
              <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm">
                <Calendar size={14} />
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl text-white font-bold mb-0 leading-tight">
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-12">
            <div className="prose prose-invert prose-lg max-w-none">
              {post.content.split('\n').map((paragraph, i) => (
                <p key={i} className="text-white/70 leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center font-bold text-white">
                  DF
                </div>
                <div>
                  <p className="text-white font-bold">DJ FLOWERZ</p>
                  <p className="text-white/40 text-sm">Artist & Author</p>
                </div>
              </div>

              <button className="p-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BlogPostPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
      <BlogPostContent />
    </Suspense>
  )
}
