"use client"

import * as React from "react"
import { Check, Loader2, MapPin, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface City {
  id: string
  name: string
  display_name: string
  address: {
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
  }
}

interface CityPickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CityPicker({ value, onChange, placeholder = "Search city worldwide..." }: CityPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<City[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Manual Debounce
  React.useEffect(() => {
    if (query.length < 3) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=8&addressdetails=1&featuretype=city`
        )
        const data = await response.json()
        
        type NominatimItem = {
          place_id: number
          display_name: string
          address: City['address']
        }
        const cities = (data as NominatimItem[]).map((item) => ({
          id: item.place_id.toString(),
          name: item.address.city || item.address.town || item.address.village || item.display_name.split(",")[0],
          display_name: item.display_name,
          address: item.address,
        }))
        
        setResults(cities)
      } catch (error) {
        console.error("City search failed:", error)
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full h-14 justify-between bg-muted/30 hover:bg-muted/40 transition-colors text-base font-normal px-4"
          >
            {value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <MapPin className="ml-2 h-5 w-5 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <div className="flex items-center border-b border-border/50 px-3 h-12">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            autoFocus
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Type at least 3 characters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
        </div>
        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
          {results.length === 0 && query.length >= 3 && !isLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">No cities found.</div>
          )}
          {query.length < 3 && (
            <div className="py-6 text-center text-sm text-muted-foreground italic">Start typing to search global cities...</div>
          )}
          {results.map((city) => {
            const cityName = city.name
            const locationDetail = city.address.state || city.address.country || ""
            const fullValue = locationDetail ? `${cityName}, ${locationDetail}` : cityName
            
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => {
                  onChange(fullValue)
                  setOpen(false)
                }}
                className="relative flex w-full cursor-default select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <div className="flex flex-col items-start gap-0.5 overflow-hidden text-left">
                  <span className="font-bold truncate w-full">{cityName}</span>
                  <span className="text-xs text-muted-foreground truncate w-full">{city.display_name}</span>
                </div>
                {value === fullValue && (
                  <Check className="ml-auto h-4 w-4 text-indigo-600" />
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
