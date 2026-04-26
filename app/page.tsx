import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BadgeCheck, Rocket, Sparkles } from 'lucide-react'
import { SiteHeader, ThemeBar } from '@/components/layouts/site-header'
import { SiteFooter } from '@/components/layouts/site-footer'
import { MeetTheCreator } from '@/components/dashboard/meet-the-creator'
import { Button } from '@/components/ui/button'
import { DUMMY_ADS } from '@/lib/dummy-data'

const featuredListings = [
  {
    tier: 'Premium Tier',
    category: 'Analytics Platform',
    title: 'Sidebar Banner - 7M Views',
    price: '$1,200',
    meta: '30 Day Placement',
    image: DUMMY_ADS[0].thumbnail,
  },
  {
    tier: 'Standard Tier',
    category: 'Curated Newsletter',
    title: 'Main Slot - Dev Digest',
    price: '$450',
    meta: 'Per Issue',
    image: DUMMY_ADS[2].thumbnail,
  },
  {
    tier: 'Premium Tier',
    category: 'Product Search',
    title: 'Search Top Result',
    price: '$2,800',
    meta: '14 Day Exclusive',
    image: DUMMY_ADS[1].thumbnail,
  },
  {
    tier: 'Basic Tier',
    category: 'Blog Network',
    title: 'Native Text Placement',
    price: '$150',
    meta: '7 Day Slot',
    image: DUMMY_ADS[2].thumbnail,
  },
]

const packages = [
  {
    name: 'Basic',
    price: '$49',
    period: '/week',
    features: ['Single Listing Placement', 'Standard Analytics', 'Community Support'],
  },
  {
    name: 'Standard',
    price: '$149',
    period: '/month',
    features: ['3 Concurrent Listings', 'Advanced Audience Insights', 'Priority Review', 'Ad Optimization AI'],
    featured: true,
  },
  {
    name: 'Premium',
    price: '$499',
    period: '/quarter',
    features: ['Unlimited Listings', 'Full API Access', 'Custom White-labelling', 'Dedicated Account Lead'],
  },
]

export default function Home() {
  return (
    <div className="af-shell relative flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <ThemeBar />
      <main className="flex-1">
        <section className="af-hero-gradient relative flex min-h-[560px] items-center justify-center overflow-hidden px-4 pb-20 pt-12 sm:px-6 lg:min-h-[640px] lg:px-10 lg:pb-28 lg:pt-16">
          <div className="pointer-events-none absolute inset-0 -z-0 opacity-30">
            <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary/40 blur-[128px]" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent/30 blur-[128px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
            <div className="af-pill mb-8">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>New: AI-Powered Targeting</span>
            </div>
            <h1 className="text-balance text-5xl font-extrabold tracking-tight text-on-surface md:text-6xl lg:text-7xl">
              Launch Your Ads
              <br />
              <span className="af-gradient-text">Like a Pro</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-on-surface-variant sm:text-xl">
              Access high-traffic sponsorship opportunities and premium placements across the digital curator network. Precision data meets editorial excellence.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard/create">
                <Button className="af-gradient flex h-14 items-center gap-2 rounded-xl px-8 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-95">
                  Post Ad <Rocket className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button
                  variant="secondary"
                  className="h-14 rounded-xl border border-border/40 bg-surface-container-high px-8 text-base font-bold text-on-surface hover:bg-muted/50"
                >
                  Explore Ads
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low/40 px-4 py-12 sm:px-6 lg:px-10 shadow-inner shadow-black/5 flex items-center justify-center">
          <div className="mx-auto max-w-[1280px] text-center">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Trusted by Industry Leaders
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-10 opacity-50 grayscale transition-all duration-500 hover:opacity-90 hover:grayscale-0 md:gap-16">
              {['MetaFlow', 'Curio', 'Pulse', 'Apex', 'Signal', 'Arc'].map((name) => (
                <span key={name} className="text-sm font-bold text-on-surface-variant">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">Featured Listings</h2>
                <p className="mt-2 text-on-surface-variant">Top performing placements currently available.</p>
              </div>
              <Link
                href="/explore"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:underline"
              >
                View Marketplace <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredListings.map((listing) => (
                <article
                  key={listing.title}
                  className="group overflow-hidden rounded-xl bg-surface-container transition-colors duration-300 hover:bg-surface-container-high"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={listing.image}
                      alt={listing.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute left-3 top-3 rounded border border-white/10 bg-background/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur-md">
                      {listing.tier}
                    </div>
                  </div>
                  <div className="space-y-3 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{listing.category}</p>
                    <h3 className="text-lg font-bold text-on-surface">{listing.title}</h3>
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-xl font-black text-on-surface">{listing.price}</span>
                      <span className="text-xs text-on-surface-variant">{listing.meta}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-surface-container-low/50 px-4 py-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">Marketplace Packages</h2>
              <p className="mt-3 text-on-surface-variant">
                Flexible plans designed for publishers and advertisers of all sizes.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`relative flex flex-col rounded-2xl p-6 md:p-8 ${pkg.featured ? 'scale-100 border-2 border-primary bg-muted/40 shadow-2xl md:scale-[1.02]' : 'bg-surface-container/60 hover:bg-surface-container transition-all hover:scale-[1.01]'}`}
                >
                  {pkg.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-on-surface">{pkg.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-on-surface">{pkg.price}</span>
                    <span className="text-sm text-on-surface-variant">{pkg.period}</span>
                  </div>
                  <ul className="mt-8 flex flex-1 flex-col gap-4 text-sm text-on-surface-variant">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className={pkg.featured ? 'text-on-surface' : ''}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`mt-10 h-12 w-full rounded-xl text-base font-bold ${pkg.featured ? 'af-gradient text-primary-foreground shadow-lg shadow-primary/20' : ''}`}
                    variant={pkg.featured ? 'default' : 'outline'}
                  >
                    {pkg.featured ? 'Choose Plan' : pkg.name === 'Premium' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="creator"
          aria-labelledby="meet-creator-heading"
          className="bg-background/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-10 shadow-inner shadow-black/10"
        >
          <div className="mx-auto max-w-7xl">
            <MeetTheCreator />
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-12 text-center shadow-2xl md:p-16">
            <div className="relative z-10">
              <h2 className="text-4xl font-black text-primary-foreground md:text-5xl">Ready to Scale Your Reach?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/85">
                Join over 2,500+ advertisers who are already leveraging AdFlow Pro to find premium sponsorship opportunities.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Button className="h-12 rounded-xl bg-background px-10 font-black text-on-surface hover:bg-background/90">
                  Start Posting Now
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-2 border-primary-foreground/25 bg-transparent px-10 font-bold text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Schedule a Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
        </main>
        <SiteFooter />
    </div>
  )
}


