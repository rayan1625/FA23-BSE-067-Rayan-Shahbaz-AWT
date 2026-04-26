import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  
  // Verify category exists
  const { data: category } = await supabase.from('categories').select('*').eq('slug', params.slug).single()
  if (!category) notFound()

  // Fetch ads
  const now = new Date().toISOString()
  const { data: ads } = await supabase
    .from('ads')
    .select('*, cities(name), packages(name)')
    .eq('category_id', category.id)
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('rank_score', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight capitalize mb-2">{category.name} Ads</h1>
        <p className="text-muted-foreground text-lg">Browse all active listings in {category.name}.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads && ads.length > 0 ? ads.map((ad) => (
          <Link key={ad.id} href={`/ad/${ad.slug}`}>
            <Card className="hover:shadow-md transition-shadow h-full cursor-pointer overflow-hidden flex flex-col group">
              <div className="aspect-video bg-muted relative">
                {/* Fallback image block since we are avoiding massive joins for media right now */}
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
                <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">{ad.title}</h3>
                <p className="text-xl font-extrabold text-primary mb-3">${ad.price}</p>
                <div className="mt-auto text-sm text-muted-foreground flex justify-between items-center">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <span>{(ad.cities as any)?.name || 'Anywhere'}</span>
                  <span>{new Date(ad.published_at || ad.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )) : (
          <div className="col-span-full py-12 text-center border rounded-lg bg-muted/20">
            <h3 className="text-lg font-medium text-muted-foreground">No ads found in this category.</h3>
          </div>
        )}
      </div>
    </div>
  )
}
