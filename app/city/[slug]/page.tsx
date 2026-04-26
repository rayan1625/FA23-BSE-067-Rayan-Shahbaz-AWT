import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CityPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  
  // Verify city exists
  const { data: city } = await supabase.from('cities').select('*').eq('slug', params.slug).single()
  if (!city) notFound()

  // Fetch ads
  const now = new Date().toISOString()
  const { data: ads } = await supabase
    .from('ads')
    .select('*, categories(name), packages(name)')
    .eq('city_id', city.id)
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('rank_score', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight capitalize mb-2">Ads in {city.name}</h1>
        <p className="text-muted-foreground text-lg">Browse all active listings located in {city.name}, {city.country}.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads && ads.length > 0 ? ads.map((ad) => (
          <Link key={ad.id} href={`/ad/${ad.slug}`}>
            <Card className="hover:shadow-md transition-shadow h-full cursor-pointer overflow-hidden flex flex-col group">
              <div className="aspect-video bg-muted relative">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground group-hover:scale-105 transition-transform">
                  No Image
                </div>
                {ad.is_featured && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
                    Featured
                  </div>
                )}
              </div>
              <CardContent className="p-4 flex flex-col flex-grow">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <div className="text-xs text-primary font-medium mb-1">{(ad.categories as any)?.name}</div>
                <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">{ad.title}</h3>
                <p className="text-xl font-extrabold text-foreground mb-3">${ad.price}</p>
                <div className="mt-auto text-sm text-muted-foreground flex justify-between items-center">
                  <span>{new Date(ad.published_at || ad.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )) : (
          <div className="col-span-full py-12 text-center border rounded-lg bg-muted/20">
            <h3 className="text-lg font-medium text-muted-foreground">No ads found in {city.name}.</h3>
          </div>
        )}
      </div>
    </div>
  )
}
