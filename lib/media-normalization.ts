export type MediaType = 'image' | 'youtube' | 'unknown'

export interface NormalizedMedia {
  sourceType: MediaType
  originalUrl: string
  thumbnailUrl: string
  validationStatus: 'valid' | 'invalid' | 'pending'
}

export function normalizeMedia(url: string): NormalizedMedia {
  if (!url) {
    return {
      sourceType: 'unknown',
      originalUrl: url,
      thumbnailUrl: '/placeholder-image.jpg',
      validationStatus: 'invalid'
    }
  }

  // Check if YouTube
  const ytRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const ytMatch = url.match(ytRegex)
  
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1]
    return {
      sourceType: 'youtube',
      originalUrl: url,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      validationStatus: 'valid'
    }
  }

  // Simple image validation (ends with common extension or includes known image hosts)
  const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(url) || url.includes('unsplash.com') || url.includes('images')
  
  if (isImage) {
    return {
      sourceType: 'image',
      originalUrl: url,
      thumbnailUrl: url,
      validationStatus: 'valid'
    }
  }

  // Fallback
  return {
    sourceType: 'unknown',
    originalUrl: url,
    thumbnailUrl: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800&q=80',
    validationStatus: 'invalid'
  }
}
