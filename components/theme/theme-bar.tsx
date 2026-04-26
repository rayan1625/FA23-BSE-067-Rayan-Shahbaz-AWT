'use client'

import { AccentThemeButtons } from './accent-theme-buttons'
import { Sparkles } from 'lucide-react'

export function ThemeBar() {
  return (
    <div className="sticky top-16 z-40 w-full border-b border-border/40 bg-surface-container/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-10">
        <div className="hidden sm:flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Choose Your Theme
          </span>
        </div>
        <div className="flex-1 sm:flex-none">
          <AccentThemeButtons size="compact" />
        </div>
      </div>
    </div>
  )
}
