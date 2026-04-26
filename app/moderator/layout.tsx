import { DashboardShell } from '@/components/layouts/dashboard-shell'

export default function ModeratorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
