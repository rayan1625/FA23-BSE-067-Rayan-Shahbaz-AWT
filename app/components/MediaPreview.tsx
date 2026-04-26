'use client'

import { useState } from 'react'
import { normalizeMedia } from '@/lib/media-normalization'
import { Play, ImageIcon } from 'lucide-react'

type MediaItem = {
  id?: string
  source_type: string
  original_url: string
  thumbnail_url: string | null
}

interface MediaPreviewProps {
  items: MediaItem[]
  alt?: string
  className?: string
}

export function MediaPreview({ items, alt = 'Media', className = '' }: MediaPreviewProps) {
  const [errorSet, setErrorSet] = useState<Set<string>>(new Set())

  if (!items || items.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 ${className}`}>
        <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <div className={`grid gap-2 ${items.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'} ${className}`}>
      {items.map((item, i) => {
        const normalized = normalizeMedia(item.original_url)
        const src = item.thumbnail_url || normalized.thumbnailUrl
        const isYoutube = normalized.sourceType === 'youtube'
        const hasError = errorSet.has(item.original_url)

        return (
          <div key={item.id ?? i} className="relative aspect-video overflow-hidden rounded-lg bg-muted/30">
            {hasError ? (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${alt} ${i + 1}`}
                  className="h-full w-full object-cover"
                  onError={() => {
                    setErrorSet((prev) => {
                      const next = new Set(prev)
                      next.add(item.original_url)
                      return next
                    })
                  }}
                />
                {isYoutube && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-red-600 text-white shadow-lg">
                      <Play className="h-5 w-5 fill-white" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
