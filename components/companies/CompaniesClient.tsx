'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCompanies, searchCompanies } from '@/lib/queries/companies'
import { useTabSearch } from '@/components/layout/TopBar'
import type { Company } from '@/types'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import CompanyDetail from '@/components/companies/CompanyDetail'
import CompanyForm from '@/components/companies/CompanyForm'

const TYPES = ['All', 'Manufacturer', 'Importer', 'Exporter', 'Distributor', 'Supplier', 'Customer']

function useDebounce(v: string, ms = 300) {
  const [dv, setDv] = useState(v)
  useEffect(() => { const t = setTimeout(() => setDv(v), ms); return () => clearTimeout(t) }, [v, ms])
  return dv
}

function uniq(arr: Company[]): Company[] {
  const seen = new Map<string, Company>()
  arr.forEach(c => { if (!seen.has(c.id)) seen.set(c.id, c) })
  return [...seen.values()]
}

type CompanyResult = Company & { matchedMaterial?: string }

export default function CompaniesClient() {
  const [companyMap, setCompanyMap] = useState<Map<string, Company>>(new Map())
  const [searchResults, setSearchResults] = useState<CompanyResult[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const router = useRouter()
  const searchQuery = useTabSearch()
  const dq = useDebounce(searchQuery)
  const activeFilter = useRef(filter)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('new=1')) {
      setEditCompany(null); setShowForm(true); router.replace('/companies')
    }
  }, [])

  useEffect(() => {
    if (!dq.trim()) { setSearchResults([]); return }
    setSearchLoading(true)
    searchCompanies(dq)
      .then(data => setSearchResults(uniq(data)))
      .catch(console.error)
      .finally(() => setSearchLoading(false))
  }, [dq])

  useEffect(() => { setSelected(null) }, [dq])

  const load = useCallback(async (currentFilter: string) => {
    activeFilter.current = currentFilter
    setLoading(true)
    try {
      const data = await getCompanies(currentFilter === 'All' ? undefined : currentFilter)
      if (activeFilter.current !== currentFilter) return
      const m = new Map<string, Company>()
      data.forEach(c => m.set(c.id, c))
      setCompanyMap(m)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  const isSearching = dq.trim().length > 0
  const companies = [...companyMap.values()].sort((a, b) => a.name.localeCompare(b.name))
  const displayList = isSearching ? searchResults : companies

  return (
    <div className="flex flex-col h-full">
      {/* Type filter — only when not searching */}
      {!isSearching && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white overflow-x-auto flex-shrink-0">
          {TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1 text-xs rounded-full transition-colors flex-shrink-0 ${filter === t ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <div className="px-4 py-1.5 bg-white border-b border-gray-100 flex-shrink-0">
        <span className="text-xs text-gray-400">
          {isSearching
            ? searchLoading ? 'Searching…' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
            : `${companies.length} companies`}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* List — wide */}
        <div className={`w-full md:w-[576px] flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto ${selected ? 'hidden md:block' : 'block'}`}>
          {(loading && !isSearching) || searchLoading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse flex gap-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0"/>
                  <div className="flex-1 space-y-1.5 pt-1.5">
                    <div className="h-3 bg-gray-200 rounded w-3/4"/>
                    <div className="h-2.5 bg-gray-100 rounded w-1/2"/>
                  </div>
                </div>
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <EmptyState
              message={isSearching ? `No results for "${dq}"` : 'No companies yet'}
              sub={isSearching ? 'Try different keywords' : 'Use the menu to add a company'}
            />
          ) : (
            displayList.map(c => (
              <button key={c.id} onClick={() => setSelected(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors ${selected === c.id ? 'bg-brand-light' : ''}`}>
                <Avatar name={c.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {[c.country, c.city].filter(Boolean).join(', ')}
                    {c.types?.length > 0 && (
                      <span className="text-gray-400"> · {c.types.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(' · ')}</span>
                    )}
                  </div>
                  {(c as CompanyResult).matchedMaterial && (
                    <div className="text-xs text-brand mt-1 font-medium truncate">
                      · {(c as CompanyResult).matchedMaterial}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className={`flex-1 overflow-y-auto bg-white ${selected ? 'block' : 'hidden md:flex md:items-center md:justify-center'}`}>
          {selected ? (
            <CompanyDetail id={selected} onBack={() => setSelected(null)}
              highlightMaterial={isSearching ? dq : ''}
              onEdit={c => { setEditCompany(c); setShowForm(true) }}
              onDelete={() => { setSelected(null); load(filter) }} />
          ) : (
            <EmptyState message="Select a company" sub="Click any company to see materials and contacts" />
          )}
        </div>
      </div>

      {showForm && (
        <CompanyForm company={editCompany}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); load(filter) }} />
      )}
    </div>
  )
}
