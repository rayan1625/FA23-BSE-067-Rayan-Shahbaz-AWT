export type ColorThemeId =
  | 'indigo'
  | 'violet'
  | 'fuchsia'
  | 'rose'
  | 'orange'
  | 'amber'
  | 'emerald'
  | 'cyan'
  | 'sky'
  | 'lime'

export type ColorTheme = {
  id: ColorThemeId
  label: string
  /** Tailwind-style HSL triplets (no hsl() wrapper) */
  primary: string
  accent: string
}

export const ACCENT_THEMES: ColorTheme[] = [
  { id: 'indigo', label: 'Indigo', primary: '243 75% 59%', accent: '199 100% 77%' },
  { id: 'violet', label: 'Violet', primary: '262 83% 58%', accent: '291 95% 75%' },
  { id: 'fuchsia', label: 'Fuchsia', primary: '292 84% 61%', accent: '330 81% 72%' },
  { id: 'rose', label: 'Rose', primary: '346 77% 50%', accent: '12 90% 72%' },
  { id: 'orange', label: 'Orange', primary: '24 95% 53%', accent: '38 92% 55%' },
  { id: 'amber', label: 'Amber', primary: '38 92% 50%', accent: '45 100% 51%' },
  { id: 'emerald', label: 'Emerald', primary: '160 84% 39%', accent: '172 66% 50%' },
  { id: 'cyan', label: 'Cyan', primary: '188 94% 43%', accent: '199 89% 55%' },
  { id: 'sky', label: 'Sky', primary: '199 89% 48%', accent: '204 94% 56%' },
  { id: 'lime', label: 'Lime', primary: '84 81% 44%', accent: '142 76% 42%' },
]

export const ACCENT_STORAGE_KEY = 'adflow-accent-theme'

export function isColorThemeId(v: string): v is ColorThemeId {
  return ACCENT_THEMES.some((t) => t.id === v)
}
