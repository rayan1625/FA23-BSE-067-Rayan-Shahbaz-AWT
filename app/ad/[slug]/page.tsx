'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  ChevronRight,
  Flag,
  Heart,
  Mail,
  MapPin,
  Star,
  Calendar,
  Package,
  Shield,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { SiteHeader, ThemeBar } from '@/components/layouts/site-header'
import { SiteFooter } from '@/components/layouts/site-footer'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { normalizeMedia } from '@/lib/media-normalization'
import type { SupabaseClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

/* ---------- types ---------- */

type MediaRow = {
  id: string
  source_type: string
  original_url: string
  thumbnail_url: string | null
  validation_status: string | null
}

type AdDetail = {
  id: string
  title: string
  slug: string
  description: string
  price: number | null
  status: string
  is_featured: boolean
  rank_score: number
  created_at: string
  published_at: string | null
  expires_at: string | null
  categories: { name: string; slug: string } | null
  cities: { name: string; country: string; state: string | null } | null
  packages: { name: string; duration_days: number; weight: number; price: number; is_featured: boolean } | null
  users: {
    name: string | null
    seller_profiles: { company_name: string | null; phone: string | null; is_verified: boolean } | null
  } | null
}

/* ---------- helpers ---------- */

function formatDate(val: string | null): string {
  if (!val) return ''
  return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/* ---------- component ---------- */

export default function AdDetailPage({ params }: { params: { slug: string } }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [ad, setAd] = useState<AdDetail | null>(null)
  const [media, setMedia] = useState<MediaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => { setSupabase(createClient()) }, [])

  useEffect(() => {
    if (!supabase) return
    const fetchAd = async () => {
      try {
        setLoading(true)
        const now = new Date().toISOString()

        const { data, error } = await supabase
          .from('ads')
          .select(`
            id, title, slug, description, price, status, is_featured, rank_score,
            created_at, published_at, expires_at,
            categories(name, slug),
            cities(name, country, state),
            packages(name, duration_days, weight, price, is_featured),
            users(name, seller_profiles(company_name, phone, is_verified))
          `)
          .eq('slug', params.slug)
          .eq('status', 'published')
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .single()

        if (error || !data) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const adData = data as unknown as AdDetail
        setAd(adData)

        // fetch media separately
        const { data: mediaData } = await supabase
          .from('ad_media')
          .select('id, source_type, original_url, thumbnail_url, validation_status')
          .eq('ad_id', adData.id)
          .order('created_at', { ascending: true })

        setMedia((mediaData ?? []) as MediaRow[])
      } catch (err) {
        console.error('Error fetching ad:', err)
        setNotFound(true)
        toast.error('Failed to load ad details')
      } finally {
        setLoading(false)
      }
    }
    void fetchAd()
  }, [supabase, params.slug])

  /* --- loading --- */
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-on-surface">
        <SiteHeader />
        <ThemeBar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading ad details...</p>
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  /* --- not found --- */
  if (notFound || !ad) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-on-surface">
        <SiteHeader />
        <ThemeBar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-14 w-14 text-red-400" />
            <h1 className="text-2xl font-extrabold">Ad Not Found</h1>
            <p className="text-muted-foreground">This listing may have expired, been removed, or does not exist.</p>
            <Link href="/explore">
              <Button className="mt-2 bg-primary font-bold text-primary-foreground">
                Browse All Ads
              </Button>
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  /* --- build image list from ad_media --- */
  const imageList: { src: string; alt: string }[] = media.length > 0
    ? media.map((m) => {
        const normalized = normalizeMedia(m.original_url)
        return { src: m.thumbnail_url || normalized.thumbnailUrl, alt: ad.title }
      })
    : [{ src: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800&q=80', alt: ad.title }]

  const heroImg = imageList[selectedImage] ?? imageList[0]
  const catName = ad.categories?.name ?? 'Uncategorized'
  const cityLabel = ad.cities ? `${ad.cities.name}, ${ad.cities.state ?? ad.cities.country}` : ''
  const sellerName = ad.users?.seller_profiles?.company_name || ad.users?.name || 'Anonymous Seller'
  const sellerVerified = ad.users?.seller_profiles?.is_verified ?? false
  const packageName = ad.packages?.name ?? 'Standard'
  const packageDuration = ad.packages?.duration_days ?? 0
  const expiresLabel = ad.expires_at ? `Expires on ${formatDate(ad.expires_at)}` : 'No expiry set'

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <SiteHeader />
      <ThemeBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-8 md:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm font-medium text-on-surface-variant">
          <Link href="/explore" className="transition-colors hover:text-on-surface">
            Marketplace
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
          <span>{catName}</span>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
          <span className="text-on-surface">{ad.title}</span>
        </nav>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <section className="space-y-4">
              <div className="group relative aspect-video w-full overflow-hidden rounded-xl bg-surface-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImg.src} alt={heroImg.alt} className="h-full w-full object-cover" />
                {ad.is_featured && (
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                      Premium Package
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/50 text-on-surface backdrop-blur-md transition-colors hover:bg-background/70"
                  aria-label="Save listing"
                >
                  <Heart className="h-5 w-5" />
                </button>
              </div>
              {/* Thumbnail strip */}
              {imageList.length > 1 && (
                <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
                  {imageList.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(i)}
                      className={`relative aspect-square overflow-hidden rounded-lg transition-opacity ${
                        selectedImage === i
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'opacity-90 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-6 rounded-xl bg-surface-container p-8">
              <h2 className="text-xl font-bold text-on-surface">Listing Description</h2>
              <div className="prose prose-invert max-w-none text-on-surface-variant leading-relaxed">
                <p>{ad.description}</p>
                <ul className="mt-6 grid list-none grid-cols-1 gap-2 p-0 md:grid-cols-2">
                  {['Detailed photos & verified seller', 'Secure messaging through AdFlow', 'Location context on map below'].map((line) => (
                    <li key={line} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section className="glass-effect space-y-4 rounded-xl border border-border/30 bg-surface-container-high p-6 shadow-[0px_24px_48px_-12px_rgba(0,0,0,0.5)]">
              <div>
                <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-primary">
                  {catName} • {ad.is_featured ? 'Featured' : packageName}
                </span>
                <h1 className="text-2xl font-black leading-tight text-on-surface">{ad.title}</h1>
              </div>
              {cityLabel && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">{cityLabel}</span>
                </div>
              )}
              <div className="flex items-end justify-between border-y border-border/30 py-4">
                <div>
                  <span className="mb-1 block text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
                    Price
                  </span>
                  <span className="text-3xl font-black text-on-surface">
                    {ad.price !== null ? `$${Number(ad.price).toLocaleString()}` : 'Contact'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="mb-1 block text-xs text-on-surface-variant">Listing</span>
                  <span className="text-sm font-bold text-muted-foreground">
                    {ad.published_at ? `Published ${formatDate(ad.published_at)}` : 'Live now'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <Package className="mx-auto mb-1 h-6 w-6 text-accent" />
                  <span className="block text-xs text-on-surface-variant">Package</span>
                  <span className="block text-sm font-bold">{packageName}</span>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <Calendar className="mx-auto mb-1 h-6 w-6 text-accent" />
                  <span className="block text-xs text-on-surface-variant">Duration</span>
                  <span className="block text-sm font-bold">{packageDuration > 0 ? `${packageDuration} days` : 'Standard'}</span>
                </div>
              </div>
              {/* Expiry / Package badge */}
              <div className="flex items-center gap-2 rounded-lg border border-border/20 bg-muted/20 px-3 py-2 text-xs font-medium text-on-surface-variant">
                <Shield className="h-4 w-4 text-primary" />
                {expiresLabel}
              </div>
            </section>

            <section className="space-y-6 rounded-xl bg-surface-container p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 bg-muted text-lg font-bold text-primary">
                  {sellerName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-on-surface">{sellerName}</h3>
                  <div className="mb-1 flex flex-wrap items-center gap-1 text-primary">
                    {sellerVerified ? (
                      <>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                        <span className="ml-1 text-xs font-bold text-on-surface-variant">Verified</span>
                      </>
                    ) : (
                      <>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                        <Star className="h-4 w-4 text-primary" />
                        <span className="ml-1 text-xs font-bold text-on-surface-variant">Seller</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {sellerVerified ? 'Verified on AdFlow Pro' : 'AdFlow Pro Member'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <Button className="flex h-12 w-full items-center justify-center gap-2 bg-primary font-bold text-primary-foreground hover:opacity-90">
                  <Mail className="h-4 w-4" />
                  Contact Seller
                </Button>
                <Button
                  variant="outline"
                  className="flex h-12 w-full items-center justify-center gap-2 border-border/50 bg-muted/30 font-bold text-on-surface hover:bg-muted/60"
                  onClick={() => { console.log('Report ad', ad.id); toast.info('Ad reported. Thank you for your feedback.') }}
                >
                  <Flag className="h-4 w-4" />
                  Report Ad
                </Button>
              </div>
              <div className="border-t border-border/30 pt-4 text-center">
                <Link href="/explore" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:underline">
                  View All Listings
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </section>

            <section className="relative h-48 overflow-hidden rounded-xl bg-surface-container">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative text-center">
                  <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-primary/25 bg-background px-2 py-1 text-[10px] font-bold shadow-lg">
                    Exact location hidden
                  </div>
                  <MapPin className="mx-auto h-10 w-10 text-primary" />
                </div>
              </div>
              {cityLabel && (
                <div className="absolute bottom-4 left-4 rounded-full border border-border/30 bg-background/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                  {cityLabel}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
