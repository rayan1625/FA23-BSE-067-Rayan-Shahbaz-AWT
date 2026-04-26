'use client'

import Link from 'next/link'
import { LayoutGrid } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-3 group", className)}>
      <div className="relative">
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-tr from-primary to-accent opacity-20 blur-sm transition group-hover:opacity-40" />
        <div className="relative grid h-10 w-10 place-items-center rounded-lg bg-primary shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
          <LayoutGrid className="h-5.5 w-5.5 text-primary-foreground" />
        </div>
      </div>
      
      {showText && (
        <motion.div 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <span className="text-lg font-black tracking-tight text-on-surface">
            AdFlow <span className="text-primary">Pro</span>
          </span>
          <div className="mt-0.5 flex items-center gap-1.5 leading-none">
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
              Enterprise AI
            </span>
          </div>
        </motion.div>
      )}
    </Link>
  )
}
