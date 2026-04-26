'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'
import { Bell, Search, Menu, Plus, Bot, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { getDisplayName, getRoleLabel } from '@/lib/auth-display'
import { getDashboardNavItems } from '@/lib/dashboard/navigation'
import { Logo } from '@/components/ui/logo'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button'

export function DashboardTopBar({ 
  isAIActive, 
  onAIToggle 
}: { 
  isAIActive?: boolean
  onAIToggle?: () => void 
}) {
  const pathname = usePathname()
  const { user, profile, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const displayName = getDisplayName(user, profile)
  const roleLabel = getRoleLabel(profile?.role)
  const links = getDashboardNavItems(pathname)

  const PROFILE_IMAGE_URL = 'https://raw.githubusercontent.com/Rayan-Shahbaz-Dev/My-projects-picks/refs/heads/main/personalpicks%20(1).png'

  return (
    <header className="af-glass-header sticky top-0 z-40 w-full border-b border-border/10">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo className="hidden md:flex flex-shrink-0" />
        
        {/* Mobile Logo & Menu Trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="h-10 w-10 text-foreground" />
              }
            >
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-r-border/10 bg-card p-0">
              <SheetHeader className="p-6 text-left border-b border-border/10">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 p-4">
                <button
                  onClick={() => {
                    onAIToggle?.()
                    setMobileOpen(false)
                  }}
                  className={cn(
                    "mb-2 flex items-center gap-3 rounded-xl px-4 py-4 text-sm font-bold transition-all",
                    isAIActive 
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))]/20" 
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  {isAIActive ? <Sparkles className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  {isAIActive ? "Close AI Mode" : "Activate AI Mode"}
                </button>
                
                {links.map((link) => {
                  const Icon = link.icon
                  const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                        active 
                          ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  )
                })}
                {pathname.startsWith('/dashboard') && (
                  <div className="mt-4 pt-4 border-t border-border/10">
                    <Link 
                      href="/dashboard/create" 
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))]/25"
                    >
                      <Plus className="h-5 w-5" />
                      Create Campaign
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Logo showText={false} />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 mx-4 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-all hover:text-foreground",
                  active ? "text-[hsl(var(--primary))] font-bold" : "text-muted-foreground"
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-[-18px] left-0 right-0 h-1 rounded-t-full bg-[hsl(var(--primary))]" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3 px-2">
          <div className="hidden max-w-[200px] flex-1 items-center md:flex lg:max-w-xs">
            <div className="relative w-full group">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[hsl(var(--primary))]" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full rounded-full border border-border/10 bg-muted/50 py-1.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/40 focus:bg-muted"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAIToggle}
              className={cn(
                "relative grid h-10 w-10 place-items-center rounded-full transition-all duration-300",
                isAIActive 
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))]/25" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              title={isAIActive ? "Close AI Assistant" : "Open AI Assistant"}
            >
              {isAIActive ? <Sparkles className="h-5 w-5 animate-pulse" /> : <Bot className="h-5 w-5" />}
              {!isAIActive && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[hsl(var(--primary))] animate-ping" />
              )}
            </button>

            <ThemeToggle />
            
            <button
              type="button"
              className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[hsl(var(--accent))] ring-2 ring-background" />
            </button>

            <div className="hidden pl-2 text-right lg:block">
              {loading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : (
                <>
                  <p className="text-sm font-bold text-foreground leading-tight">{displayName}</p>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    {roleLabel}
                  </p>
                </>
              )}
            </div>

            <Link
              href="/dashboard/profile"
              className="group relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[hsl(var(--primary))]/20 ring-4 ring-[hsl(var(--primary))]/5 transition-all hover:scale-110 active:scale-95"
              title="Open profile"
            >
              <Image
                src={PROFILE_IMAGE_URL}
                alt={displayName}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
