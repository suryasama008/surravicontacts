'use client'
import { useState, useEffect } from 'react'
import { searchContacts } from '@/lib/queries/contacts'
import { searchCompanies } from '@/lib/queries/companies'
import { findCompaniesByMaterial } from '@/lib/queries/materials'
import ContactDetail from '@/components/contacts/ContactDetail'
import ContactForm from '@/components/contacts/ContactForm'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import type { Contact } from '@/types'

function useDebounce(v: string, ms = 350) {
  const [dv, setDv] = useState(v)
  useEffect(() => { const t = setTimeout(() => setDv(v), ms); return () => clearTimeout(t) }, [v, ms])
  return dv
}

function SearchBox({ value, onChange, placeholder, autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean
}) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
      <input autoFocus={autoFocus}
        className="w-full pl-8 pr-8 py-2.5 text-sm bg-gray-100 rounded-xl border border-transparent focus:outline-none focus:border-brand focus:bg-white transition-colors placeholder-gray-400"
        placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      />
      {value && <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>}
    </div>
  )
}

// ── People ──────────────────────────────────────
function PeopleSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [showForm, setShowForm] = useState(false)
  const dq = useDebounce(q)

  useEffect(() => {
    if (!dq.trim()) { setResults([]); return }
    setLoading(true)
    searchContacts(dq).then(setResults).catch(console.error).finally(() => setLoading(false))
  }, [dq])

  if (selectedId) return (
    <div>
      <button onClick={() => setSelectedId(null)} className="flex items-center gap-1 text-sm text-brand mb-3">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back
      </button>
      <ContactDetail id={selectedId} onBack={() => setSelectedId(null)}
        onEdit={c => { setEditContact(c); setShowForm(true) }} onDelete={() => setSelectedId(null)} />
      {showForm && <ContactForm contact={editContact} onClose={() => setShowForm(false)} onSave={() => setShowForm(false)} />}
    </div>
  )

  return (
    <div className="space-y-2">
      <SearchBox value={q} onChange={setQ} placeholder="Name, phone, email, company…" autoFocus />
      {loading && <Skeletons />}
      {!loading && dq && results.length === 0 && <Empty q={q} />}
      {results.map(c => (
        <button key={c.id} onClick={() => setSelectedId(c.id)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left">
          <Avatar name={c.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">{c.full_name}</div>
            <div className="text-xs text-gray-400 truncate">{[c.job_title, c.company_name].filter(Boolean).join(' · ')}</div>
          </div>
          {c.phones?.[0] && <span className="text-xs text-brand flex-shrink-0">{c.phones[0]}</span>}
        </button>
      ))}
    </div>
  )
}

// ── Companies ────────────────────────────────────
function CompaniesSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const dq = useDebounce(q)

  useEffect(() => {
    if (!dq.trim()) { setResults([]); return }
    setLoading(true)
    searchCompanies(dq).then(setResults).catch(console.error).finally(() => setLoading(false))
  }, [dq])

  return (
    <div className="space-y-2">
      <SearchBox value={q} onChange={setQ} placeholder="Company name, country, city…" />
      {loading && <Skeletons />}
      {!loading && dq && results.length === 0 && <Empty q={q} />}
      {results.map(c => (
        <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50">
          <Avatar name={c.name} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">{c.name}</div>
            <div className="text-xs text-gray-400">{[c.country, c.city].filter(Boolean).join(', ')}</div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {c.types?.slice(0,2).map((t: string) => <Badge key={t} label={t} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Materials ─────────────────────────────────────
function MaterialsSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const dq = useDebounce(q)

  useEffect(() => {
    if (!dq.trim()) { setResults([]); return }
    setLoading(true)
    findCompaniesByMaterial(dq).then(setResults).catch(console.error).finally(() => setLoading(false))
  }, [dq])

  // Group by material name
  const byMaterial: Record<string, { material: any; companies: any[] }> = {}
  results.forEach(r => {
    const name = r.material?.name || 'Unknown'
    if (!byMaterial[name]) byMaterial[name] = { material: r.material, companies: [] }
    byMaterial[name].companies.push(r.company)
  })

  return (
    <div className="space-y-3">
      <SearchBox value={q} onChange={setQ} placeholder="Material name e.g. Vitamin C, HDPE…" />
      {loading && <Skeletons />}
      {!loading && dq && results.length === 0 && <Empty q={q} />}
      {Object.entries(byMaterial).map(([name, { material, companies }]) => (
        <div key={name} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Material header */}
          <div className="px-4 py-2.5 bg-brand-light flex items-center gap-2">
            <div>
              <span className="text-sm font-semibold text-brand-dark">{name}</span>
              {material?.category && <span className="text-xs text-gray-500 ml-2">{material.category}</span>}
            </div>
            <span className="ml-auto text-xs text-brand">{companies.length} {companies.length === 1 ? 'supplier' : 'suppliers'}</span>
          </div>
          {/* Companies that supply it */}
          {companies.map((co, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100">
              <Avatar name={co.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">{co.name}</div>
                <div className="text-xs text-gray-400">{[co.country, co.city].filter(Boolean).join(', ')}</div>
              </div>
              <div className="flex gap-1">
                {co.types?.slice(0,1).map((t: string) => <Badge key={t} label={t} />)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Shared helpers ────────────────────────────────
function Skeletons() {
  return <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
}
function Empty({ q }: { q: string }) {
  return <p className="text-sm text-gray-400 py-3 text-center">No results for "{q}"</p>
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-gray-500">{icon}</span>
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export default function SearchClient() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-5 max-w-2xl mx-auto pb-12">
        <Section title="People" icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.8" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}>
          <PeopleSearch />
        </Section>
        <Section title="Companies" icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.3"/></svg>}>
          <CompaniesSearch />
        </Section>
        <Section title="Materials — find which companies supply it" icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h6M5 5.5h4M5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}>
          <MaterialsSearch />
        </Section>
      </div>
    </div>
  )
}
