import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AccentThemeProvider } from '@/components/providers/accent-theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/providers/auth-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AdFlow Pro - Sponsored Listing Marketplace',
  description: 'Premium placements, verified sellers, and role-based dashboards for a modern ad marketplace.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-accent="indigo">
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans antialiased selection:bg-primary/30 selection:text-primary-foreground flex flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AccentThemeProvider>
            <QueryProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
              <Toaster position="top-right" richColors />
            </QueryProvider>
          </AccentThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
