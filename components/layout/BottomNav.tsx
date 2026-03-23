'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const nav = [
  { href: '/search', label: 'Search', icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { href: '/contacts', label: 'People', icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.8" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { href: '/companies', label: 'Companies', icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { href: '/import', label: 'Import', icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M3 12v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="md:hidden flex border-t border-gray-200 bg-white">
      {nav.map(item => (
        <Link key={item.href} href={item.href} className={clsx(
          'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors',
          path.startsWith(item.href) ? 'text-brand' : 'text-gray-400'
        )}>
          {item.icon}{item.label}
        </Link>
      ))}
    </nav>
  )
}
