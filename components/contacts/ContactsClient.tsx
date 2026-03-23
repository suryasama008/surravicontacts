'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getContactsPage, searchContacts } from '@/lib/queries/contacts'
import { useTabSearch } from '@/components/layout/TopBar'
import type { ContactListItem, Contact } from '@/types'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import ContactDetail from '@/components/contacts/ContactDetail'
import ContactForm from '@/components/contacts/ContactForm'

function useDebounce(v: string, ms = 300) {
  const [dv, setDv] = useState(v)
  useEffect(() => { const t = setTimeout(() => setDv(v), ms); return () => clearTimeout(t) }, [v, ms])
  return dv
}

export default function ContactsClient() {
  const [contactMap, setContactMap] = useState<Map<string, ContactListItem>>(new Map())
  const [searchResults, setSearchResults] = useState<ContactListItem[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchQuery = useTabSearch()
  const dq = useDebounce(searchQuery)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('new=1')) {
      setEditContact(null); setShowForm(true); router.replace('/contacts')
    }
  }, [])

  // Search via TopBar query
  useEffect(() => {
    if (!dq.trim()) { setSearchResults([]); return }
    setSearchLoading(true)
    searchContacts(dq).then(data => {
      const seen = new Map<string, ContactListItem>()
      data?.forEach(c => { if (!seen.has(c.id)) seen.set(c.id, c) })
      setSearchResults([...seen.values()])
    }).catch(console.error).finally(() => setSearchLoading(false))
  }, [dq])

  const load = useCallback(async (pg: number, reset: boolean) => {
    setLoading(true)
    try {
      const { data, count } = await getContactsPage(pg)
      if (reset) {
        const m = new Map<string, ContactListItem>()
        data?.forEach(c => m.set(c.id, c))
        setContactMap(m)
      } else {
        setContactMap(prev => {
          const m = new Map(prev)
          data?.forEach(c => m.set(c.id, c))
          return m
        })
      }
      setTotal(count || 0)
      setHasMore((data || []).length === 25)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(0, true) }, [load])

  // Reset selection when search changes
  useEffect(() => { setSelected(null) }, [dq])

  // Infinite scroll — only when not searching
  useEffect(() => {
    if (dq || !loaderRef.current || !hasMore || loading) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { const next = page + 1; setPage(next); load(next, false) }
    }, { rootMargin: '80px' })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasMore, loading, page, load, dq])

  const isSearching = dq.trim().length > 0
  const contacts = [...contactMap.values()].sort((a, b) => a.full_name.localeCompare(b.full_name))
  const displayList = isSearching ? searchResults : contacts

  const grouped = displayList.reduce((acc, c) => {
    const k = c.full_name[0]?.toUpperCase() || '#'
    if (!acc[k]) acc[k] = []
    acc[k].push(c)
    return acc
  }, {} as Record<string, ContactListItem[]>)

  return (
    <div className="flex flex-col h-full">
      {/* Count bar */}
      <div className="px-4 py-1.5 bg-white border-b border-gray-100 flex-shrink-0">
        <span className="text-xs text-gray-400">
          {isSearching
            ? searchLoading ? 'Searching…' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
            : `${total.toLocaleString()} contacts`}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* List — wide */}
        <div className={`w-full md:w-[576px] flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto ${selected ? 'hidden md:block' : 'block'}`}>
          {(loading || searchLoading) && displayList.length === 0 && (
            <div className="p-4 space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0"/>
                  <div className="flex-1 space-y-1.5 pt-1.5">
                    <div className="h-3 bg-gray-200 rounded w-2/3"/>
                    <div className="h-2.5 bg-gray-100 rounded w-1/2"/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !searchLoading && displayList.length === 0 && (
            <EmptyState
              message={isSearching ? `No results for "${dq}"` : 'No contacts yet'}
              sub={isSearching ? 'Try different keywords' : 'Use the menu to add a contact'}
            />
          )}

          {Object.keys(grouped).sort().map(grp => (
            <div key={grp}>
              <div className="sticky top-0 px-4 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100 z-10">{grp}</div>
              {grouped[grp].map(c => (
                <button key={c.id} onClick={() => setSelected(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors ${selected === c.id ? 'bg-brand-light' : ''}`}>
                  <Avatar name={c.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{c.full_name}</div>
                    <div className="text-xs text-gray-400 truncate">{[c.job_title, c.company_name].filter(Boolean).join(' · ')}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}

          {loading && displayList.length > 0 && (
            <div className="p-4 space-y-3">
              {[1,2].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0"/>
                  <div className="flex-1 space-y-1.5 pt-1.5">
                    <div className="h-3 bg-gray-200 rounded w-2/3"/>
                    <div className="h-2.5 bg-gray-100 rounded w-1/2"/>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={loaderRef} className="h-4" />
          {!isSearching && !hasMore && contacts.length > 0 && (
            <div className="text-center py-3 text-xs text-gray-400">All {contacts.length} contacts loaded</div>
          )}
        </div>

        {/* Detail panel */}
        <div className={`flex-1 overflow-y-auto bg-white ${selected ? 'block' : 'hidden md:flex md:items-center md:justify-center'}`}>
          {selected ? (
            <ContactDetail id={selected} onBack={() => setSelected(null)}
              onEdit={c => { setEditContact(c); setShowForm(true) }}
              onDelete={() => { setSelected(null); load(0, true) }} />
          ) : (
            <EmptyState message="Select a contact" sub="Click any name to view details" />
          )}
        </div>
      </div>

      {showForm && (
        <ContactForm contact={editContact}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); load(0, true) }} />
      )}
    </div>
  )
}
