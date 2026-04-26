import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function AdCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60 hover:shadow-md transition-shadow">
      <Skeleton className="h-48 w-full rounded-none" />
      <CardHeader className="p-5 pb-2">
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent className="p-5 pt-2 pb-3">
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0 flex justify-between items-center border-t border-border/40 mt-3 bg-muted/20">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </CardFooter>
    </Card>
  )
}

export function AdListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AdCardSkeleton key={i} />
      ))}
    </div>
  )
}
