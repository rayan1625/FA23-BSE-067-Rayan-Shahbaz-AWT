import Link from 'next/link'

const links = [
  { label: 'Meet the Creator', href: '/#creator' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Cookie Policy', href: '#' },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border/40 bg-[#0b1326]/90">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-8 py-12 md:flex-row">
        <div className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">
          <span className="text-sm font-black tracking-tight text-on-surface">AdFlow Pro</span>
          <span className="text-xs uppercase tracking-wide text-on-surface-variant">
            © {new Date().getFullYear()} AdFlow Pro. The Digital Curator.
          </span>
        </div>
        <nav className="flex flex-wrap justify-center gap-8">
          {links.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-xs font-medium uppercase tracking-wide text-on-surface-variant transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
