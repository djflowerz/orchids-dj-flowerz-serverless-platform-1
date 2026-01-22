export interface User {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'user'
  subscription_status: 'active' | 'inactive' | 'expired'
  subscription_plan: string | null
  subscription_start: string | null
  subscription_end: string | null
  telegram_user_id: string | null
  telegram_username: string | null
  telegram_id: string | null
  created_at: string
}

export interface Mixtape {
  id: string
  title: string
  dj: string
  genre: string | null
  release_year: number | null
  duration: string | null
  description: string | null
  audio_url: string | null
  video_url: string | null
  cover_image: string | null
  cover_images: string[]
  gallery_images: string[]
  tracklist: string[] | null
  is_paid: boolean
  price: number
  uploaded_by: string | null
  is_featured: boolean
  download_count: number
  status: 'active' | 'inactive'
  created_at: string
  audio_download_url?: string | null
  video_download_url?: string | null
  download_url?: string | null // Primary download for secured content (zip)
  download_password?: string | null
  embed_url?: string | null
}

export interface Product {
  id: string
  title: string
  description: string | null
  product_type: 'digital' | 'physical'
  price: number
  status: 'draft' | 'published' | 'archived'
  cover_images: string[]
  category: string | null
  created_at: string

  // Digital Specific
  version?: string | null
  download_file_path?: string | null
  post_payment_message?: string | null
  supported_os?: string[]
  changelog?: string | null
  license_notes?: string | null

  // Physical Specific
  stock_quantity?: number
  sku?: string | null
  delivery_method?: string | null
  estimated_delivery_time?: string | null
  weight?: number | null // in kg?
  dimensions?: string | null // e.g. "10x20x5 cm"
  variants?: { name: string; options: string[] }[] | null

  // Computed/Legacy
  image_url?: string | null // Primary image
  is_paid: boolean
  is_free: boolean
  download_password?: string | null
  average_rating?: number
  review_count?: number
  downloads?: number
}

export interface MusicPoolTrack {
  id: string
  title: string
  artist: string
  bpm: number | null
  key: string | null
  version: 'Clean' | 'Dirty' | 'Intro'
  audio_file_path: string | null
  cover_images: string[]
  tier: 'Standard' | 'Pro'
  created_at: string
}

export interface ProductReview {
  id: string
  product_id: string
  user_id: string
  user_email: string
  user_name: string
  rating: number
  comment: string | null
  created_at: string
}

export interface UpdateRequest {
  id: string
  product_id: string
  user_id: string
  user_email: string
  message: string
  status: 'pending' | 'resolved' | 'rejected'
  admin_response: string | null
  created_at: string
}

export interface ShippingDetails {
  id: string
  user_id: string
  payment_id: string
  full_name: string
  phone: string
  address: string
  city: string
  country: string
  created_at: string
}

export interface Booking {
  id: string
  name: string
  email: string
  phone: string | null
  event_type: string | null
  event_date: string | null
  message: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
}

export interface BlogPost {
  id: string
  title: string
  content: string
  image_url: string | null
  author_id: string | null
  slug: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string | null
  user_email: string
  amount: number
  payment_type: 'product' | 'subscription' | 'mixtape'
  item_id: string | null
  status: 'pending' | 'success' | 'failed'
  paystack_reference: string | null
  created_at: string
}
