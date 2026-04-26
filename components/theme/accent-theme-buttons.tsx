'use client'

import { cn } from '@/lib/utils'
import { ACCENT_THEMES, type ColorThemeId } from '@/lib/color-themes'
import { useAccentTheme } from '@/components/providers/accent-theme-provider'

const swatch: Record<ColorThemeId, string> = {
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  fuchsia: 'bg-fuchsia-500',
  rose: 'bg-rose-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  lime: 'bg-lime-500',
}

type Props = {
  /** Larger hit targets on profile control panel */
  size?: 'default' | 'compact'
}

export function AccentThemeButtons({ size = 'default' }: Props) {
  const { accent, setAccent } = useAccentTheme()
  const compact = size === 'compact'

  return (
    <div className="flex flex-wrap gap-2">
      {ACCENT_THEMES.map((t) => {
        const active = accent === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setAccent(t.id)}
            title={t.label}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border font-bold transition-all',
              compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs',
              active
                ? 'border-primary bg-primary/15 text-primary ring-2 ring-primary/25'
                : 'border-border/50 bg-muted/15 text-on-surface-variant hover:border-primary/35'
            )}
          >
            <span
              className={cn(
                'shrink-0 rounded-full ring-2 ring-background',
                compact ? 'h-2 w-2' : 'h-2.5 w-2.5',
                swatch[t.id]
              )}
              aria-hidden
            />
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
