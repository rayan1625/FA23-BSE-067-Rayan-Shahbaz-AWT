'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Car,
  ChevronDown,
  Grid3X3,
  Home,
  Laptop,
  LayoutGrid,
  MapPin,
  Search,
  Clock,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { SiteHeader, ThemeBar } from '@/components/layouts/site-header'
import { SiteFooter } from '@/components/layouts/site-footer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

/* ---------- types ---------- */

type CategoryRow = { id: number; name: string; slug: string; icon: string | null }
type CityRow = { id: number; name: string; country: string; state: string | null }

type AdRow = {
  id: string
  title: string
  slug: string
  description: string
  price: number | null
  status: string
  is_featured: boolean
  rank_score: number
  created_at: string
  expires_at: string | null
  published_at: string | null
  categories: { name: string; slug: string } | null
  cities: { name: string; country: string; state: string | null } | null
  packages: { name: string; duration_days: number; weight: number; is_featured: boolean } | null
  users: {
    name: string | null
    seller_profiles: { company_name: string | null; is_verified: boolean } | null
  } | null
  ad_media: { id: string; original_url: string; thumbnail_url: string | null; source_type: string }[] | null
}

/* ---------- helpers ---------- */

const LIMIT = 12

const categoryIcon = (slug: string) => {
  switch (slug) {
    case 'real-estate': return Home
    case 'jobs': return Briefcase
    case 'electronics': return Laptop
    case 'vehicles': return Car
    default: return Grid3X3
  }
}

function getFirstImage(ad: AdRow): string {
  if (ad.ad_media && ad.ad_media.length > 0) {
    const first = ad.ad_media[0]
    return first.thumbnail_url || first.original_url
  }
  return 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800&q=80'
}

function relativeTime(value: string | null): string {
  if (!value) return 'Recently listed'
  const diffMs = Date.now() - new Date(value).getTime()
  const mins = Math.max(1, Math.round(diffMs / 60000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(value).toLocaleDateString()
}

/* ---------- component ---------- */

export default function ExplorePage() {
  /* --- state --- */
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [ads, setAds] = useState<AdRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [cities, setCities] = useState<CityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedCity, setSelectedCity] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState('newest')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => { setSupabase(createClient()) }, [])

  /* --- load categories & cities once --- */
  useEffect(() => {
    if (!supabase) return
    const load = async () => {
      const [catRes, cityRes] = await Promise.all([
        supabase.from('categories').select('id, name, slug, icon').order('name'),
        supabase.from('cities').select('id, name, country, state').order('name'),
      ])
      if (catRes.data) setCategories(catRes.data as CategoryRow[])
      if (cityRes.data) setCities(cityRes.data as CityRow[])
    }
    void load()
  }, [supabase])

  /* --- fetch ads --- */
  const fetchAds = useCallback(async () => {
    if (!supabase) return
    try {
      setLoading(true)
      setError(null)

      const now = new Date().toISOString()

      /* --- count query --- */
      let countQuery = supabase
        .from('ads')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .or(`expires_at.is.null,expires_at.gt.${now}`)

      if (selectedCategory) countQuery = countQuery.eq('category_id', selectedCategory)
      if (selectedCity) countQuery = countQuery.eq('city_id', selectedCity)
      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`
        countQuery = countQuery.or(`title.ilike.${q},description.ilike.${q}`)
      }

      const { count: total, error: countErr } = await countQuery
      if (countErr) throw countErr
      setTotalCount(total ?? 0)

      /* --- data query --- */
      let query = supabase
        .from('ads')
        .select(`
          id, title, slug, description, price, status, is_featured, rank_score,
          created_at, expires_at, published_at,
          categories(name, slug),
          cities(name, country, state),
          packages(name, duration_days, weight, is_featured),
          users(name, seller_profiles(company_name, is_verified)),
          ad_media(id, original_url, thumbnail_url, source_type)
        `)
        .eq('status', 'published')
        .or(`expires_at.is.null,expires_at.gt.${now}`)

      if (selectedCategory) query = query.eq('category_id', selectedCategory)
      if (selectedCity) query = query.eq('city_id', selectedCity)
      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`
        query = query.or(`title.ilike.${q},description.ilike.${q}`)
      }

      // primary sort: rank_score desc, then secondary sort
      query = query.order('rank_score', { ascending: false })
      switch (sortKey) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      const from = (page - 1) * LIMIT
      const to = from + LIMIT - 1
      query = query.range(from, to)

      const { data, error: fetchErr } = await query
      if (fetchErr) throw fetchErr

      setAds((data ?? []) as unknown as AdRow[])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load ads'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [supabase, searchQuery, selectedCategory, selectedCity, sortKey, page])

  useEffect(() => { fetchAds() }, [fetchAds])

  // reset page when filters change
  useEffect(() => { setPage(1) }, [searchQuery, selectedCategory, selectedCity, sortKey])

  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT))

  /* --- handlers --- */
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSortKey(e.target.value)
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setSelectedCity(v === '' ? null : Number(v))
  }
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)

  /* ---------- render ---------- */
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <SiteHeader />
      <ThemeBar />
      <div className="flex min-h-0 flex-1">
        {/* Filter sidebar */}
        <aside className="scrollbar-hide sticky top-28 z-20 hidden h-[calc(100vh-112px)] w-72 shrink-0 overflow-y-auto border-r border-border/30 bg-surface-container-low py-8 pl-6 pr-5 md:block">
          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Discovery</h3>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search ads..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full rounded-lg border-0 bg-[hsl(var(--input))] py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Categories</h3>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                    selectedCategory === null ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:bg-muted/50'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <LayoutGrid className="h-5 w-5 shrink-0" />
                    All Ads
                  </span>
                </button>
                {categories.map((c) => {
                  const Icon = categoryIcon(c.slug)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.id)}
                      className={cn(
                        'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        selectedCategory === c.id ? 'bg-primary/15 font-medium text-primary' : 'text-on-surface-variant hover:bg-muted/50'
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5 shrink-0 opacity-90" />
                        {c.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Location</h3>
              <div className="relative">
                <select
                  value={selectedCity ?? ''}
                  onChange={handleCityChange}
                  className="w-full appearance-none rounded-lg border-0 bg-[hsl(var(--input))] py-2.5 pl-4 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Cities</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}, {c.state ?? c.country}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <Button
              onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedCity(null); setSortKey('newest') }}
              className="w-full bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
            >
              Reset Filters
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="p-6 lg:p-10">
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <h1 className="text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">Explore Ads</h1>
                <p className="mt-2 text-base text-on-surface-variant md:text-lg">
                  Discover premium opportunities in the global marketplace.
                  {!loading && <span className="ml-2 text-sm font-semibold text-primary">({totalCount} results)</span>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/dashboard/create">
                  <Button className="af-gradient rounded-xl px-6 font-bold text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))]/20 hover:opacity-90">
                    <Plus className="mr-2 h-4 w-4" />
                    Post Ad
                  </Button>
                </Link>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sort By</span>
                <div className="relative">
                  <select
                    value={sortKey}
                    onChange={handleSortChange}
                    className="appearance-none rounded-lg border border-border/50 bg-surface-container py-2 pl-4 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="newest">Latest Arrivals</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Loading ads...</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm font-semibold text-red-300">{error}</p>
                <Button variant="outline" onClick={fetchAds} className="mt-2 border-red-500/30 text-red-300 hover:bg-red-500/10">
                  Retry
                </Button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && ads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Search className="mb-4 h-10 w-10 opacity-40" />
                <p className="text-lg font-semibold">No ads found</p>
                <p className="mt-1 text-sm">Try adjusting your filters or search query.</p>
              </div>
            )}

            {/* Ads grid */}
            {!loading && !error && ads.length > 0 && (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
                {ads.map((ad) => {
                  const imgSrc = getFirstImage(ad)
                  const catName = ad.categories?.name ?? 'Uncategorized'
                  const cityLabel = ad.cities ? `${ad.cities.name}, ${ad.cities.state ?? ad.cities.country}` : ''
                  const sellerVerified = ad.users?.seller_profiles?.is_verified ?? false

                  return (
                    <Link href={`/ad/${ad.slug}`} key={ad.id} className="group block h-full">
                      <article
                        className={cn(
                          'flex h-full flex-col overflow-hidden rounded-xl bg-surface-container ring-1 ring-border/40 transition-all duration-300',
                          'hover:-translate-y-1 hover:ring-primary/35'
                        )}
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgSrc}
                            alt={ad.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          {ad.is_featured && (
                            <div className="absolute left-4 top-4">
                              <span className="rounded border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-300 backdrop-blur-md">
                                Premium
                              </span>
                            </div>
                          )}
                          {!ad.is_featured && sellerVerified && (
                            <div className="absolute left-4 top-4">
                              <span className="rounded border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 backdrop-blur-md">
                                Verified
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-6">
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-primary">
                                {catName}
                              </span>
                              <h3 className="text-xl font-bold leading-tight text-on-surface transition-colors group-hover:text-primary/90">
                                {ad.title}
                              </h3>
                            </div>
                            <p className="text-xl font-black text-on-surface">
                              {ad.price !== null ? `$${Number(ad.price).toLocaleString()}` : 'Contact'}
                            </p>
                          </div>
                          <div className="mb-6 flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                            {cityLabel && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 shrink-0" />
                                {cityLabel}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 shrink-0" />
                              {relativeTime(ad.published_at ?? ad.created_at)}
                            </span>
                          </div>
                          <span className="mt-auto block w-full rounded-lg border border-border/50 py-2.5 text-center text-sm font-medium text-on-surface transition-colors group-hover:bg-muted/40">
                            View Details
                          </span>
                        </div>
                      </article>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                        page === pageNum
                          ? 'bg-primary font-bold text-primary-foreground'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-muted'
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {totalPages > 5 && page < totalPages - 2 && <span className="px-2 text-muted-foreground">…</span>}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
