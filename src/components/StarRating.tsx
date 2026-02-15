'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  label?: string
  id?: string
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-9 w-9',
}

export default function StarRating({ value, onChange, size = 'md', label, id }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const starSize = sizeClasses[size]

  return (
    <div
      role="radiogroup"
      aria-label={label || 'Rating'}
      id={id}
      className="flex gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            tabIndex={star === value || (value === 0 && star === 1) ? 0 : -1}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault()
                onChange(Math.min(5, (value || 0) + 1))
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault()
                onChange(Math.max(1, (value || 2) - 1))
              }
            }}
            className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            <Star
              className={`${starSize} transition-colors ${
                isActive ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
