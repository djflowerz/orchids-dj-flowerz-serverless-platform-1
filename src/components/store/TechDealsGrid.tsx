import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, MessageCircle, Flame } from 'lucide-react';
import { Product } from '@/lib/types';

interface TechDealsGridProps {
    products: Product[];
    loading?: boolean;
}

export function TechDealsGrid({ products, loading }: TechDealsGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                        <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-4" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return <div className="text-center py-12 text-gray-500">No deals available at the moment.</div>;
    }

    // Helper to generate a random discount for demo purposes if not in DB
    // In production, this would come from product.original_price vs product.price
    const getDiscount = (price: number) => {
        // Deterministic pseudo-random based on price for consistency during render
        const hasDiscount = price > 20000;
        if (!hasDiscount) return null;
        const discountPercent = 5 + (price % 10); // 5% to 15% discount
        const originalPrice = price * (1 + discountPercent / 100);
        return { percent: discountPercent, original: originalPrice };
    };

    return (
        <div className="py-12 relative">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-90 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="relative z-10 p-6 md:p-12">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                        Unwrap The<br />
                        <span className="text-white">Best Tech Deals</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product) => {
                        const discount = getDiscount(product.price);

                        return (
                            <div key={product.id} className="group bg-zinc-900 rounded-xl shadow-xl overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300 border border-white/5 hover:border-violet-500/50">
                                <div className="relative aspect-[4/3] p-4 bg-zinc-800/50 border-b border-white/5">
                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                                        <span className="px-3 py-1 bg-fuchsia-500 text-white text-xs font-bold rounded shadow-sm uppercase">
                                            HOT
                                        </span>
                                        {discount && (
                                            <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded shadow-sm">
                                                -{Math.floor(discount.percent)}%
                                            </span>
                                        )}
                                    </div>

                                    <Link href={`/store/${product.id}`} className="block w-full h-full relative">
                                        <Image
                                            src={product.image_url || '/placeholder-product.jpg'}
                                            alt={product.title}
                                            fill
                                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </Link>
                                </div>

                                <div className="p-5 flex flex-col flex-grow text-center">
                                    <Link href={`/store/${product.id}`}>
                                        <h3 className="font-bold text-white mb-2 line-clamp-2 hover:text-fuchsia-400 transition-colors text-sm">
                                            {product.title}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-white/40 mb-3 uppercase tracking-wide">{product.category}</p>

                                    <div className="mt-auto">
                                        <div className="flex items-center justify-center gap-2 mb-4">
                                            {discount && (
                                                <span className="text-sm text-white/30 line-through font-medium">
                                                    KES {Math.floor(discount.original).toLocaleString()}
                                                </span>
                                            )}
                                            <span className="text-lg font-bold text-cyan-400">
                                                KES {product.price.toLocaleString()}
                                            </span>
                                        </div>

                                        <a
                                            href={`https://wa.me/254700000000?text=Hi, I'm interested in ${product.title}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity w-full text-sm"
                                        >
                                            <MessageCircle size={18} />
                                            WhatsApp Order
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
