'use client'
import { useState, useEffect, useRef } from 'react'
import { getCompanyById, deleteCompany } from '@/lib/queries/companies'
import { getCompanyMaterials } from '@/lib/queries/materials'
import { getContactsByCompany } from '@/lib/queries/contacts'
import type { Company, Material, ContactListItem } from '@/types'
import Avatar from '@/components/ui/Avatar'

type Tab = 'materials' | 'people' | 'notes'

export default function CompanyDetail({ id, onBack, onEdit, onDelete, highlightMaterial = '' }: {
  id: string
  onBack: () => void
  onEdit: (c: Company) => void
  onDelete: () => void
  highlightMaterial?: string
}) {
  const [company, setCompany] = useState<Company | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [contacts, setContacts] = useState<ContactListItem[]>([])
  const [tab, setTab] = useState<Tab>('materials')
  const [loading, setLoading] = useState(true)
  const matchRef = useRef<HTMLDivElement>(null)

  // When opened with a search highlight, stay on materials tab and scroll to first match
  useEffect(() => {
    if (highlightMaterial && !loading) {
      setTab('materials')
      setTimeout(() => {
        matchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [highlightMaterial, loading])

  useEffect(() => {
    setLoading(true)
    setTab('materials')
    getCompanyById(id).then(async co => {
      setCompany(co)
      const [mats, cons] = await Promise.all([
        getCompanyMaterials(id),
        getContactsByCompany(id, co.name),
      ])
      setMaterials(mats || [])
      setContacts(cons || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm('Delete this company?')) return
    await deleteCompany(id)
    onDelete()
  }

  if (loading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2 pt-2"><div className="h-4 bg-gray-200 rounded w-1/2"/><div className="h-3 bg-gray-100 rounded w-1/3"/></div>
      </div>
      <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-3 bg-gray-100 rounded"/>)}</div>
    </div>
  )
  if (!company) return <div className="p-6 text-sm text-gray-400">Company not found</div>

  // Group materials by category for bullet list
  const byCategory = materials.reduce((acc, m) => {
    const cat = m.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {} as Record<string, Material[]>)

  return (
    <div>
      {/* Back — mobile */}
      <div className="px-5 pt-4 md:hidden">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-brand mb-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
      </div>

      {/* Header */}
      <div className="px-5 pt-4 pb-4 border-b border-gray-100">
        <div className="flex gap-4 items-start">
          <Avatar name={company.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{company.name}</h2>
            <p className="text-sm text-gray-500">{[company.country, company.city].filter(Boolean).join(' · ')}</p>
            {company.website && (
              <a href={`https://${company.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer"
                className="text-xs text-brand mt-0.5 block">{company.website}</a>
            )}
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {company.types?.map((t, i) => (
                <span key={t} className="text-xs text-gray-500">
                  {i > 0 && <span className="mr-1">·</span>}{t.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {company.phones?.[0] && <a href={`tel:${company.phones[0]}`} className="btn text-sm">Call</a>}
          {company.emails?.[0] && <a href={`mailto:${company.emails[0]}`} className="btn text-sm">Email</a>}
          <button onClick={() => onEdit(company)} className="btn text-sm">Edit</button>
          <button onClick={handleDelete} className="btn-danger text-sm ml-auto">Delete</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {(['materials','people','notes'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm capitalize border-b-2 transition-colors ${tab === t ? 'border-brand text-brand font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'materials' ? `Materials (${materials.length})` : t === 'people' ? `People (${contacts.length})` : 'Notes'}
          </button>
        ))}
      </div>

      <div className="p-5">

        {/* MATERIALS — 2-column bullet list per category */}
        {tab === 'materials' && (
          materials.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No materials assigned. Edit company to add materials.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(byCategory).map(([cat, mats]) => (
                <div key={cat}>
                  <div className="text-xs font-semibold text-brand uppercase tracking-widest mb-3 flex items-center gap-2">
                    {cat}
                    <span className="text-gray-400 font-normal normal-case tracking-normal">({mats.length})</span>
                  </div>
                  {/* 2-column bullet grid — 10-20 items per column */}
                  <div className="columns-2 gap-x-6">
                    {mats.map((m, mi) => {
                      const isMatch = highlightMaterial.trim().length > 0 &&
                        m.name.toLowerCase().includes(highlightMaterial.toLowerCase())
                      // Attach ref to the very first match across all categories
                      const isFirstMatch = isMatch && !mats.slice(0, mi).some(prev =>
                        prev.name.toLowerCase().includes(highlightMaterial.toLowerCase())
                      )
                      return (
                        <div key={m.id} ref={isFirstMatch ? matchRef : undefined}
                          className={`flex items-start gap-2 mb-1.5 break-inside-avoid ${isMatch ? 'bg-amber-50 -mx-1 px-1 rounded' : ''}`}>
                          <span className={`mt-1.5 flex-shrink-0 ${isMatch ? 'text-amber-500' : 'text-brand'}`}>
                            <svg width="5" height="5" viewBox="0 0 5 5"><circle cx="2.5" cy="2.5" r="2.5" fill="currentColor"/></svg>
                          </span>
                          <span className={`text-sm ${isMatch ? 'font-bold text-amber-800' : 'text-gray-700'}`}>
                            {m.name}
                            {isMatch && <span className="ml-1.5 text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">match</span>}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* PEOPLE — fuzzy matched contacts */}
        {tab === 'people' && (
          contacts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No contacts found linked to this company.</p>
          ) : (
            <div className="space-y-2">
              {contacts.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                  <Avatar name={c.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{c.full_name}</div>
                    <div className="text-xs text-gray-400">{[c.job_title, c.company_name].filter(Boolean).join(' · ')}</div>
                  </div>
                  {c.phones?.[0] && (
                    <a href={`tel:${c.phones[0]}`} className="text-xs text-brand flex-shrink-0">{c.phones[0]}</a>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* NOTES */}
        {tab === 'notes' && (
          <p className="text-sm text-gray-600 leading-relaxed">{company.notes || 'No notes added.'}</p>
        )}

      </div>
    </div>
  )
}
