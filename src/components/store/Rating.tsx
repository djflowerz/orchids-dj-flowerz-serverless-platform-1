'use client'
import { Star } from 'lucide-react'

interface RatingProps {
    rating: number
    count?: number
    size?: number
    showCount?: boolean
}

export default function Rating({ rating, count, size = 16, showCount = true }: RatingProps) {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center">
                {[...Array(5)].map((_, index) => {
                    if (index < fullStars) {
                        return <Star key={index} size={size} className="fill-yellow-400 text-yellow-400" />
                    } else if (index === fullStars && hasHalfStar) {
                        return (
                            <div key={index} className="relative">
                                <Star size={size} className="text-slate-300" />
                                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                                    <Star size={size} className="fill-yellow-400 text-yellow-400" />
                                </div>
                            </div>
                        )
                    } else {
                        return <Star key={index} size={size} className="text-slate-300" />
                    }
                })}
            </div>
            {showCount && count !== undefined && (
                <span className="text-sm text-slate-500">({count})</span>
            )}
        </div>
    )
}
