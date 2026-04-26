'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { DashboardTopBar } from './dashboard-top-bar'
import { ThemeBar } from './site-header'
import { AIAssistant, AIToggle } from '@/components/ai/ai-assistant'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'
import { getDisplayName, getUsername } from '@/lib/auth-display'
import { getDashboardNavItems } from '@/lib/dashboard/navigation'
import { 
  LogOut,
  Menu,
  X,
} from 'lucide-react'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const DEFAULT_PROFILE_IMAGE_URL =
    'https://raw.githubusercontent.com/Rayan-Shahbaz-Dev/My-projects-picks/refs/heads/main/personalpicks%20(1).png'

  const [isAIActive, setIsAIActive] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const { user, profile, signOut } = useAuth()
  const displayName = getDisplayName(user, profile)
  const username = getUsername(user)
  const avatarUrl = profile?.avatar_url ?? DEFAULT_PROFILE_IMAGE_URL
  const userRole = profile?.role || 'user'

  const navItems = getDashboardNavItems(pathname, userRole)

  return (
    <div className="af-shell relative flex min-h-screen overflow-hidden bg-background text-on-surface transition-colors duration-500">
      {/* Animated Background Glows */}
      <div className="af-bg-glow -left-[10%] -top-[10%] h-[500px] w-[500px]" />
      <div className="af-bg-glow -right-[5%] top-[20%] h-[400px] w-[400px] [animation-delay:-5s] opacity-20" />
      <div className="af-bg-glow bottom-[10%] left-[20%] h-[600px] w-[600px] [animation-delay:-10s] opacity-15" />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border/10 bg-surface-container transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center border-b border-border/10 px-6">
            <span className="text-lg font-bold tracking-tight">AdFlow Pro</span>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-border/10 p-4">
            <Link
              href="/dashboard/profile"
              onClick={() => setSidebarOpen(false)}
              className="mb-3 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50"
              title="Open profile"
            >
              <motion.div
                whileHover={{ y: -2, rotate: -6, scale: 1.06 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="relative h-10 w-10 shrink-0"
              >
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-primary to-accent opacity-30 blur-sm" />
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="relative h-full w-full rounded-full border border-white/10 object-cover shadow-sm"
                />
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#1a1f2e] bg-green-500" />
              </motion.div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-on-surface">{displayName}</p>
                <p className="truncate text-[11px] text-muted-foreground/60">@{username}</p>
              </div>
            </Link>

            <Button variant="outline" className="w-full gap-2" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-0">
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden flex items-center border-b border-border/10 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <DashboardTopBar isAIActive={isAIActive} onAIToggle={() => setIsAIActive(!isAIActive)} />
        <ThemeBar />

        <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* AI Mode Components */}
      <AIAssistant isOpen={isAIActive} onClose={() => setIsAIActive(false)} />
      <AIToggle isOpen={isAIActive} onClick={() => setIsAIActive(!isAIActive)} />
    </div>
  )
}
