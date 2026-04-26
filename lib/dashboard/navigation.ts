import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'

export type DashboardRole = 'client' | 'admin' | 'moderator'

export type DashboardNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const clientNavItems: DashboardNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'My Ads', href: '/dashboard/ads', icon: LayoutDashboard },
  { label: 'AI Generator', href: '/dashboard/ai-generator', icon: Sparkles },
  { label: 'Create Ad', href: '/dashboard/create', icon: Package },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Profile', href: '/dashboard/profile', icon: Users },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const adminNavItems: DashboardNavItem[] = [
  { label: 'Admin Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'User Management', href: '/admin/users', icon: Users },
  { label: 'Payment Verification', href: '/admin/payments', icon: CreditCard },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
]

const moderatorNavItems: DashboardNavItem[] = [
  { label: 'Moderator Dashboard', href: '/moderator', icon: Shield },
  { label: 'Review Queue', href: '/moderator/queue', icon: FileText },
]

export function getDashboardRoleFromPath(pathname: string): DashboardRole {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/moderator')) return 'moderator'
  return 'client'
}

export function getDashboardNavItems(pathname: string, userRole?: string): DashboardNavItem[] {
  // If userRole is provided, use it; otherwise fall back to pathname-based detection
  const role = userRole || getDashboardRoleFromPath(pathname)

  if (role === 'admin') return adminNavItems
  if (role === 'manager' || role === 'moderator') return moderatorNavItems

  return clientNavItems
}
