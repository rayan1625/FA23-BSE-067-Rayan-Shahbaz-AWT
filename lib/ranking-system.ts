export interface AdRankingParams {
  isFeatured: boolean
  packageWeight: number
  publishedAt: string | Date
  adminBoost: number
  isSellerVerified: boolean
}

/**
 * Calculates a dynamic ranking score for an ad.
 * Ads with higher scores appear first in search results.
 */
export function calculateRankScore({
  isFeatured,
  packageWeight,
  publishedAt,
  adminBoost,
  isSellerVerified
}: AdRankingParams): number {
  
  let score = 0
  
  // 1. Featured Bonus
  if (isFeatured) {
    score += 500
  }
  
  // 2. Package Weight (e.g., Premium=10, Standard=5)
  score += (packageWeight * 50)
  
  // 3. Verified Seller Bonus
  if (isSellerVerified) {
    score += 100
  }
  
  // 4. Admin Manual Boost
  score += (adminBoost || 0)
  
  // 5. Freshness Decay (max 200 points)
  // Ads lose points as they get older to keep the feed fresh
  const now = new Date().getTime()
  const pubTime = new Date(publishedAt).getTime()
  const hoursSincePublished = (now - pubTime) / (1000 * 60 * 60)
  
  // Start at 200 points, subtract 1 point per hour, min 0
  const freshnessPoints = Math.max(0, 200 - hoursSincePublished)
  score += freshnessPoints
  
  return Math.round(score)
}
