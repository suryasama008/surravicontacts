'use client'
import { useState, useEffect } from 'react'
import { createCompany, updateCompany } from '@/lib/queries/companies'
import { getMaterials, setCompanyMaterials, getCompanyMaterials, createMaterial } from '@/lib/queries/materials'
import type { Company, Material } from '@/types'
import Modal from '@/components/ui/Modal'

const COMPANY_TYPES = ['Manufacturer', 'Importer', 'Exporter', 'Distributor', 'Supplier', 'Customer']

export default function CompanyForm({ company, onClose, onSave }: {
  company: Company | null
  onClose: () => void
  onSave: () => void
}) {
  const [allMaterials, setAllMaterials] = useState<Material[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [matSearch, setMatSearch] = useState('')
  const [newMatName, setNewMatName] = useState('')
  const [newMatCat, setNewMatCat] = useState('Excipients')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: company?.name || '',
    country: company?.country || '',
    city: company?.city || '',
    address: company?.address || '',
    phone: company?.phones?.[0] || '',
    email: company?.emails?.[0] || '',
    website: company?.website || '',
    notes: company?.notes || '',
    types: company?.types || [] as string[],
  })

  useEffect(() => {
    getMaterials().then(setAllMaterials).catch(console.error)
    if (company?.id) {
      getCompanyMaterials(company.id).then(mats => {
        setSelectedIds(new Set(mats.map(m => m.id)))
      }).catch(console.error)
    }
  }, [company])

  function setField(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }
  function toggleType(t: string) {
    setField('types', form.types.includes(t) ? form.types.filter(x => x !== t) : [...form.types, t])
  }
  function toggleMaterial(id: string) {
    setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  async function addNewMaterial() {
    if (!newMatName.trim()) return
    try {
      const m = await createMaterial(newMatName.trim(), newMatCat)
      setAllMaterials(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m])
      setSelectedIds(prev => new Set([...prev, m.id]))
      setNewMatName('')
    } catch (e: any) { alert('Error: ' + e.message) }
  }

  async function handleSave() {
    if (!form.name.trim()) { alert('Company name is required'); return }
    setSaving(true)
    try {
      const payload: any = {
        name: form.name.trim(), types: form.types,
        country: form.country || null, city: form.city || null,
        address: form.address || null,
        phones: form.phone ? [form.phone] : [],
        emails: form.email ? [form.email] : [],
        website: form.website || null, notes: form.notes || null,
      }
      let id = company?.id
      if (company) { await updateCompany(company.id, payload) }
      else { const c = await createCompany(payload); id = c.id }
      if (id) await setCompanyMaterials(id, [...selectedIds])
      onSave()
    } catch (e: any) { alert('Error saving: ' + e.message) }
    finally { setSaving(false) }
  }

  const uniqueCats = [...new Set(allMaterials.map(m => m.category || 'Other'))].sort()
  const filtered = allMaterials.filter(m =>
    m.name.toLowerCase().includes(matSearch.toLowerCase()) ||
    (m.category || '').toLowerCase().includes(matSearch.toLowerCase())
  )
  const byCategory = filtered.reduce((acc, m) => {
    const cat = m.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {} as Record<string, Material[]>)

  return (
    <Modal title={company ? 'Edit company' : 'Add company'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Company name *">
          <input className="input" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Surravi Phharma" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country"><input className="input" value={form.country} onChange={e => setField('country', e.target.value)} placeholder="e.g. India" /></Field>
          <Field label="City"><input className="input" value={form.city} onChange={e => setField('city', e.target.value)} placeholder="e.g. Hyderabad" /></Field>
        </div>
        <Field label="Address">
          <textarea className="input resize-none" rows={2} value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Paste full address" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone"><input className="input" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+91 98765 43210" /></Field>
          <Field label="Email"><input className="input" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="info@company.com" /></Field>
        </div>
        <Field label="Website">
          <input className="input" value={form.website} onChange={e => setField('website', e.target.value)} placeholder="www.company.com" />
        </Field>
        <Field label="Company type">
          <div className="flex gap-2 flex-wrap mt-1">
            {COMPANY_TYPES.map(t => (
              <button key={t} type="button" onClick={() => toggleType(t)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${form.types.includes(t) ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand'}`}>
                {t}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Notes">
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Any notes…" />
        </Field>

        {/* Materials — checkboxes only */}
        <div>
          <div className="label mb-1">
            Materials supplied
            {selectedIds.size > 0 && <span className="text-brand ml-1 normal-case font-normal">({selectedIds.size} selected)</span>}
          </div>

          {/* Selected pills */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 p-3 bg-brand-light rounded-xl min-h-[40px]">
              {[...selectedIds].map(id => {
                const m = allMaterials.find(x => x.id === id)
                return m ? (
                  <span key={id} className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-xs border border-brand/20 text-gray-700">
                    {m.name}
                    <button onClick={() => toggleMaterial(id)} className="text-gray-400 hover:text-red-500 leading-none ml-0.5">&times;</button>
                  </span>
                ) : null
              })}
            </div>
          )}

          {/* Picker */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0"><circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              <input className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400" placeholder="Search materials…" value={matSearch} onChange={e => setMatSearch(e.target.value)} />
              {matSearch && <button onClick={() => setMatSearch('')} className="text-gray-400 text-base leading-none">&times;</button>}
            </div>
            <div className="max-h-52 overflow-y-auto">
              {Object.entries(byCategory).map(([cat, mats]) => (
                <div key={cat}>
                  <div className="px-3 py-1 text-[10px] font-semibold text-brand uppercase tracking-widest bg-gray-50 border-b border-gray-100 sticky top-0">{cat}</div>
                  <div className="grid grid-cols-2">
                    {mats.map(m => (
                      <label key={m.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                        <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleMaterial(m.id)} className="accent-brand w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs text-gray-700 truncate">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(byCategory).length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400">No materials match "{matSearch}"</div>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 bg-gray-50">
              <input className="flex-1 text-xs input py-1.5" placeholder="Add new material…" value={newMatName}
                onChange={e => setNewMatName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addNewMaterial() }} />
              <select className="text-xs input py-1.5 w-28" value={newMatCat} onChange={e => setNewMatCat(e.target.value)}>
                {uniqueCats.map(c => <option key={c}>{c}</option>)}
                <option>Other</option>
              </select>
              <button onClick={addNewMaterial} className="btn-primary text-xs py-1.5 px-3">+ Add</button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save company'}</button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>
}
