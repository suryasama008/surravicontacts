'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'

const nav = [
  { href: '/contacts', label: 'People', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.8" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  )},
  { href: '/companies', label: 'Companies', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.3"/></svg>
  )},
  { href: '/import', label: 'Import Excel', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M3 12v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()

  return (
    <aside className="hidden md:flex flex-col w-48 border-r border-gray-200 bg-white h-full flex-shrink-0">
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="font-semibold text-gray-900 text-sm">ContactBase</div>
        <div className="text-xs text-gray-400 mt-0.5">Business Directory</div>
      </div>

      {/* Search bar — top priority */}
      <div className="px-3 py-3 border-b border-gray-100">
        <button
          onClick={() => router.push('/search')}
          className={clsx(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors border',
            path.startsWith('/search')
              ? 'bg-brand text-white border-brand'
              : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-brand hover:text-brand'
          )}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span className="text-xs">Search everything…</span>
        </button>
      </div>

      <nav className="flex-1 py-2">
        <div className="px-3 py-2 text-[10px] text-gray-400 uppercase tracking-widest">Directory</div>
        {nav.slice(0, 2).map(item => (
          <Link key={item.href} href={item.href} className={clsx(
            'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors border-l-2',
            path.startsWith(item.href)
              ? 'text-gray-900 bg-brand-light border-brand font-medium'
              : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700'
          )}>
            {item.icon}{item.label}
          </Link>
        ))}
        <div className="px-3 pt-4 pb-2 text-[10px] text-gray-400 uppercase tracking-widest">Tools</div>
        {nav.slice(2).map(item => (
          <Link key={item.href} href={item.href} className={clsx(
            'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors border-l-2',
            path.startsWith(item.href)
              ? 'text-gray-900 bg-brand-light border-brand font-medium'
              : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700'
          )}>
            {item.icon}{item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
