import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Pricing Packages - AdFlow Pro',
  description: 'Choose the right package to boost your ad visibility.',
}

export default async function PackagesPage() {
  const supabase = createClient()
  const { data: packages } = await supabase.from('packages').select('*').order('price', { ascending: true })

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground">Choose the perfect package to maximize your ad&apos;s reach.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {packages?.map((pkg) => (
          <Card key={pkg.id} className={`relative flex flex-col ${pkg.is_featured ? 'border-primary shadow-lg scale-105 z-10' : ''}`}>
            {pkg.is_featured && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">{pkg.name}</CardTitle>
              <div className="mt-4 flex items-baseline justify-center text-5xl font-extrabold">
                ${pkg.price}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4">
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
                  <span>Duration: <strong>{pkg.duration_days} days</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
                  <span>Visibility Weight: <strong>+{pkg.weight} points</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
                  <span>{pkg.is_featured ? 'Featured Placement' : 'Standard Placement'}</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link 
                href="/dashboard/create" 
                className={cn(buttonVariants({ variant: pkg.is_featured ? 'default' : 'outline' }), "w-full")}
              >
                Get Started
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
