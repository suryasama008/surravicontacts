'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'

export function useTabSearch() {
  const [q, setQ] = useState('')
  useEffect(() => {
    function handler(e: Event) { setQ((e as CustomEvent).detail ?? '') }
    window.addEventListener('tabsearch', handler)
    return () => window.removeEventListener('tabsearch', handler)
  }, [])
  return q
}

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const path = usePathname()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Clear search when switching tabs — but do NOT focus the input
  useEffect(() => {
    setQuery('')
    window.dispatchEvent(new CustomEvent('tabsearch', { detail: '' }))
    // intentionally no inputRef.current?.focus() here
  }, [path])

  function handleSearch(v: string) {
    setQuery(v)
    window.dispatchEvent(new CustomEvent('tabsearch', { detail: v }))
  }

  const isContacts = path.startsWith('/contacts')
  const isCompanies = path.startsWith('/companies')
  const placeholder = isContacts
    ? 'Search by name, phone, email, job title…'
    : 'Search companies, materials, country…'

  const menuItems = [
    { href: '/contacts?new=1', label: 'Add contact', icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 13c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M12 7v4M10 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { href: '/companies?new=1', label: 'Add company', icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.3"/><path d="M10 9v3M8 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { href: '/import', label: 'Import Excel', icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M3 12v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ]

  return (
    <div className="flex-shrink-0 bg-white border-b border-gray-200">

      {/* App heading */}
      <div className="px-4 pt-3 pb-1">
        <h1 className="text-base font-bold text-gray-900 tracking-tight">Surravi Contacts</h1>
      </div>

      {/* Tabs row + hamburger */}
      <div className="flex items-center border-b border-gray-100">
        {[{ href: '/companies', label: 'Companies' }, { href: '/contacts', label: 'People' }].map(tab => (
          <Link key={tab.href} href={tab.href}
            className={clsx(
              'flex-1 py-2.5 text-sm font-medium text-center transition-colors border-b-2 -mb-px',
              path.startsWith(tab.href) ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-800'
            )}>
            {tab.label}
          </Link>
        ))}

        <div className="relative px-3" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={clsx('w-8 h-8 flex flex-col items-center justify-center gap-1 rounded-lg transition-colors', menuOpen ? 'bg-brand' : 'bg-gray-100 hover:bg-gray-200')}
            aria-label="Menu"
          >
            <span className={clsx('block w-3.5 h-0.5 rounded transition-all duration-200 origin-center', menuOpen ? 'bg-white rotate-45 translate-y-[6px]' : 'bg-gray-600')} />
            <span className={clsx('block w-3.5 h-0.5 rounded transition-all duration-200', menuOpen ? 'opacity-0' : 'bg-gray-600')} />
            <span className={clsx('block w-3.5 h-0.5 rounded transition-all duration-200 origin-center', menuOpen ? 'bg-white -rotate-45 -translate-y-[6px]' : 'bg-gray-600')} />
          </button>

          {menuOpen && (
            <div className="absolute right-3 top-10 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Actions</p>
              </div>
              {menuItems.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-brand-light hover:text-brand transition-colors">
                  <span className="text-gray-400">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search bar — no autoFocus, keyboard only appears on tap */}
      {(isContacts || isCompanies) && (
        <div className="px-3 py-2.5">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              className="w-full pl-8 pr-8 py-2.5 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:border-brand focus:bg-white transition-colors placeholder-gray-400"
              placeholder={placeholder}
              value={query}
              onChange={e => handleSearch(e.target.value)}
            />
            {query && (
              <button onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
