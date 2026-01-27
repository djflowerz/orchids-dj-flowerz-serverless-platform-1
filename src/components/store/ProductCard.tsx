'use client'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useAppDispatch } from '@/lib/hooks'
import { addToCart } from '@/lib/features/cart/cartSlice'
import Rating from './Rating'
import toast from 'react-hot-toast'
import { Product } from '@/lib/features/product/productSlice'

interface ProductCardProps {
    product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
    const dispatch = useAppDispatch()
    const currency = 'KES '

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        dispatch(addToCart({ productId: product.id }))
        toast.success(`${product.title} added to cart`)
    }

    return (
        <Link
            href={`/store/product/${product.id}`}
            className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-fuchsia-500/50 transition-all duration-300"
        >
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden bg-white/5">
                <Image
                    src={product.images[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.type === 'digital' && (
                    <div className="absolute top-2 right-2 bg-fuchsia-600 text-white text-xs px-2 py-1 rounded-full">
                        Digital
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                <h3 className="text-white font-semibold mb-1 truncate group-hover:text-fuchsia-400 transition-colors">
                    {product.title}
                </h3>

                {product.category && (
                    <p className="text-white/50 text-sm mb-2">{product.category}</p>
                )}

                {/* Rating */}
                {product.average_rating && product.rating_count ? (
                    <div className="mb-3">
                        <Rating
                            rating={product.average_rating}
                            count={product.rating_count}
                            size={14}
                        />
                    </div>
                ) : null}

                {/* Price and Add to Cart */}
                <div className="flex items-center justify-between">
                    <span className="text-fuchsia-400 font-bold text-lg">
                        {currency}{product.price.toLocaleString()}
                    </span>
                    <button
                        onClick={handleAddToCart}
                        className="p-2 bg-fuchsia-600 text-white rounded-full hover:bg-fuchsia-700 active:scale-95 transition-all"
                        aria-label="Add to cart"
                    >
                        <ShoppingCart size={18} />
                    </button>
                </div>

                {/* Stock Status */}
                {product.type === 'physical' && product.stock !== undefined && (
                    <div className="mt-2">
                        {product.stock > 0 ? (
                            <p className="text-green-400 text-xs">In Stock ({product.stock})</p>
                        ) : (
                            <p className="text-red-400 text-xs">Out of Stock</p>
                        )}
                    </div>
                )}
            </div>
        </Link>
    )
}
