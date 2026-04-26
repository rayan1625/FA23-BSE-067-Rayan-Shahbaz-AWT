import { DashboardShell } from '@/components/layouts/dashboard-shell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
