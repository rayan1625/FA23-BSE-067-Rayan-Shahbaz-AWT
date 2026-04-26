import type { SupabaseClient } from '@supabase/supabase-js'

export const adPendingStatuses = [
  'submitted',
  'under_review',
  'payment_pending',
  'payment_submitted',
  'payment_verified',
  'scheduled',
] as const

export const moderationQueueStatuses = ['submitted', 'under_review'] as const

type RelationRecord = Record<string, unknown>

export type DashboardAdSummary = {
  id: string
  title: string
  slug: string
  status: string
  categoryName: string | null
  packageName: string | null
  price: number | null
  isFeatured: boolean
  createdAt: string | null
  expiresAt: string | null
}

export type DashboardActivityItem = {
  id: string
  title: string
  description: string
  status: string
  createdAt: string | null
}

export type AdvertiserDashboardData = {
  totalAds: number
  publishedAds: number
  pendingAds: number
  expiredAds: number
  featuredAds: number
  aiGeneratedAds: number
  recentAds: DashboardAdSummary[]
  recentActivity: DashboardActivityItem[]
}

export type StatusBreakdownItem = {
  status: string
  count: number
}

export type PackageBreakdownItem = {
  label: string
  count: number
}

export type AdminPaymentItem = {
  id: string
  transactionRef: string | null
  amount: number
  status: string
  createdAt: string | null
  userName: string
  userEmail: string | null
  adTitle: string | null
  adSlug: string | null
}

export type AdminDashboardData = {
  totalRevenue: number
  totalAds: number
  publishedAds: number
  pendingReviewAds: number
  totalUsers: number
  pendingPayments: number
  statusBreakdown: StatusBreakdownItem[]
  packageBreakdown: PackageBreakdownItem[]
  recentPayments: AdminPaymentItem[]
}

export type ModeratorDashboardData = {
  queueSize: number
  underReviewCount: number
  rejectedCount: number
  readyForPaymentCount: number
  recentActivity: DashboardActivityItem[]
}

export type ModeratorQueueItem = {
  id: string
  title: string
  slug: string
  status: string
  createdAt: string | null
  categoryName: string | null
  packageName: string | null
  sellerName: string
  sellerEmail: string | null
}

function readRelation(value: unknown): RelationRecord | null {
  if (!value) return null
  if (Array.isArray(value)) {
    const first = value[0]
    if (first && typeof first === 'object') return first as RelationRecord
    return null
  }
  if (typeof value === 'object') return value as RelationRecord
  return null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function readNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function toAdSummary(row: RelationRecord): DashboardAdSummary {
  const category = readRelation(row.categories)
  const packageInfo = readRelation(row.packages)

  return {
    id: readString(row.id) ?? '',
    title: readString(row.title) ?? 'Untitled Ad',
    slug: readString(row.slug) ?? '#',
    status: readString(row.status) ?? 'draft',
    categoryName: readString(category?.name),
    packageName: readString(packageInfo?.name),
    price: row.price === null || row.price === undefined ? null : readNumber(row.price),
    isFeatured: Boolean(row.is_featured),
    createdAt: readString(row.created_at),
    expiresAt: readString(row.expires_at),
  }
}

function toActivityFromAds(rows: RelationRecord[]): DashboardActivityItem[] {
  return rows.map((row) => ({
    id: readString(row.id) ?? crypto.randomUUID(),
    title: readString(row.title) ?? 'Ad updated',
    description: `Status is currently ${formatStatusLabel(readString(row.status) ?? 'draft')}.`,
    status: readString(row.status) ?? 'draft',
    createdAt: readString(row.updated_at) ?? readString(row.created_at),
  }))
}

async function countAds(
  supabase: SupabaseClient,
  statuses?: readonly string[],
  userId?: string
): Promise<number> {
  let query = supabase.from('ads').select('id', { count: 'exact', head: true })

  if (userId) query = query.eq('user_id', userId)
  if (statuses && statuses.length > 0) query = query.in('status', [...statuses])

  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

export async function fetchAdvertiserDashboardData(
  supabase: SupabaseClient,
  userId: string
): Promise<AdvertiserDashboardData> {
  const [
    totalAds,
    publishedAds,
    pendingAds,
    expiredAds,
    featuredAds,
    aiGeneratedAds,
    recentAdsResult,
    recentActivityResult,
  ] = await Promise.all([
    countAds(supabase, undefined, userId),
    countAds(supabase, ['published'], userId),
    countAds(supabase, adPendingStatuses, userId),
    countAds(supabase, ['expired'], userId),
    supabase
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_featured', true),
    supabase
      .from('ai_generated_ads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('ads')
      .select(
        'id, title, slug, status, price, is_featured, created_at, expires_at, categories(name), packages(name)'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('ads')
      .select('id, title, status, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  if (featuredAds.error) throw featuredAds.error
  if (aiGeneratedAds.error) throw aiGeneratedAds.error
  if (recentAdsResult.error) throw recentAdsResult.error
  if (recentActivityResult.error) throw recentActivityResult.error

  const recentAds = (recentAdsResult.data ?? []).map((row) => toAdSummary(row as RelationRecord))
  const recentActivity = toActivityFromAds((recentActivityResult.data ?? []) as RelationRecord[])

  return {
    totalAds,
    publishedAds,
    pendingAds,
    expiredAds,
    featuredAds: featuredAds.count ?? 0,
    aiGeneratedAds: aiGeneratedAds.count ?? 0,
    recentAds,
    recentActivity,
  }
}

export async function fetchAdminDashboardData(
  supabase: SupabaseClient
): Promise<AdminDashboardData> {
  const [
    totalAds,
    publishedAds,
    pendingReviewAds,
    totalUsersResult,
    pendingPaymentsResult,
    paymentsResult,
    adsByStatusResult,
    adsByPackageResult,
  ] = await Promise.all([
    countAds(supabase),
    countAds(supabase, ['published']),
    countAds(supabase, moderationQueueStatuses),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'submitted']),
    supabase
      .from('payments')
      .select('id, transaction_ref, amount, status, created_at, users(name, email), ads(title, slug)')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('ads').select('status'),
    supabase.from('ads').select('package_id, packages(name)').not('package_id', 'is', null),
  ])

  if (totalUsersResult.error) throw totalUsersResult.error
  if (pendingPaymentsResult.error) throw pendingPaymentsResult.error
  if (paymentsResult.error) throw paymentsResult.error
  if (adsByStatusResult.error) throw adsByStatusResult.error
  if (adsByPackageResult.error) throw adsByPackageResult.error

  const paymentRows = (paymentsResult.data ?? []) as RelationRecord[]
  const allPayments = paymentRows.map((row) => ({
    amount: readNumber(row.amount),
    status: readString(row.status) ?? 'pending',
  }))
  const totalRevenue = allPayments
    .filter((payment) => payment.status === 'verified')
    .reduce((sum, payment) => sum + payment.amount, 0)

  const statusCounts = new Map<string, number>()
  for (const row of (adsByStatusResult.data ?? []) as RelationRecord[]) {
    const status = readString(row.status) ?? 'draft'
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)
  }

  const packageCounts = new Map<string, number>()
  for (const row of (adsByPackageResult.data ?? []) as RelationRecord[]) {
    const packageInfo = readRelation(row.packages)
    const label = readString(packageInfo?.name) ?? 'Unassigned'
    packageCounts.set(label, (packageCounts.get(label) ?? 0) + 1)
  }

  const recentPayments = paymentRows.map((row) => {
    const userInfo = readRelation(row.users)
    const adInfo = readRelation(row.ads)

    return {
      id: readString(row.id) ?? '',
      transactionRef: readString(row.transaction_ref),
      amount: readNumber(row.amount),
      status: readString(row.status) ?? 'pending',
      createdAt: readString(row.created_at),
      userName: readString(userInfo?.name) ?? 'Unknown user',
      userEmail: readString(userInfo?.email),
      adTitle: readString(adInfo?.title),
      adSlug: readString(adInfo?.slug),
    }
  })

  return {
    totalRevenue,
    totalAds,
    publishedAds,
    pendingReviewAds,
    totalUsers: totalUsersResult.count ?? 0,
    pendingPayments: pendingPaymentsResult.count ?? 0,
    statusBreakdown: Array.from(statusCounts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
    packageBreakdown: Array.from(packageCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    recentPayments,
  }
}

export async function fetchModeratorDashboardData(
  supabase: SupabaseClient
): Promise<ModeratorDashboardData> {
  const [queueSize, underReviewCount, rejectedCount, readyForPaymentCount, recentActivityResult] =
    await Promise.all([
      countAds(supabase, moderationQueueStatuses),
      countAds(supabase, ['under_review']),
      countAds(supabase, ['rejected']),
      countAds(supabase, ['payment_pending']),
      supabase
        .from('ads')
        .select('id, title, status, created_at, updated_at')
        .in('status', [...moderationQueueStatuses, 'rejected', 'payment_pending'])
        .order('updated_at', { ascending: false })
        .limit(5),
    ])

  if (recentActivityResult.error) throw recentActivityResult.error

  return {
    queueSize,
    underReviewCount,
    rejectedCount,
    readyForPaymentCount,
    recentActivity: toActivityFromAds((recentActivityResult.data ?? []) as RelationRecord[]),
  }
}

export async function fetchModeratorQueue(
  supabase: SupabaseClient
): Promise<ModeratorQueueItem[]> {
  const { data, error } = await supabase
    .from('ads')
    .select('id, title, slug, status, created_at, categories(name), packages(name), users(name, email)')
    .in('status', [...moderationQueueStatuses])
    .order('created_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as RelationRecord[]).map((row) => {
    const category = readRelation(row.categories)
    const packageInfo = readRelation(row.packages)
    const userInfo = readRelation(row.users)

    return {
      id: readString(row.id) ?? '',
      title: readString(row.title) ?? 'Untitled Ad',
      slug: readString(row.slug) ?? '#',
      status: readString(row.status) ?? 'submitted',
      createdAt: readString(row.created_at),
      categoryName: readString(category?.name),
      packageName: readString(packageInfo?.name),
      sellerName: readString(userInfo?.name) ?? 'Unknown seller',
      sellerEmail: readString(userInfo?.email),
    }
  })
}

export async function updateModeratorAdStatus(
  supabase: SupabaseClient,
  {
    adId,
    previousStatus,
    newStatus,
    changedBy,
    notes,
  }: {
    adId: string
    previousStatus: string
    newStatus: string
    changedBy?: string
    notes?: string
  }
): Promise<void> {
  const { error: updateError } = await supabase
    .from('ads')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', adId)

  if (updateError) throw updateError

  const payload: {
    ad_id: string
    old_status: string
    new_status: string
    notes?: string
    changed_by?: string
  } = {
    ad_id: adId,
    old_status: previousStatus,
    new_status: newStatus,
  }

  if (notes) payload.notes = notes
  if (changedBy) payload.changed_by = changedBy

  const { error: historyError } = await supabase.from('ad_status_history').insert(payload)
  if (historyError) throw historyError
}

export function getStatusTone(status: string): string {
  switch (status) {
    case 'published':
    case 'payment_verified':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
    case 'rejected':
    case 'expired':
    case 'archived':
      return 'bg-red-500/15 text-red-400 border-red-500/20'
    case 'under_review':
    case 'submitted':
    case 'payment_pending':
    case 'payment_submitted':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/20'
    default:
      return 'bg-primary/15 text-primary border-primary/20'
  }
}

export function getStatusLabel(status: string): string {
  return formatStatusLabel(status)
}
