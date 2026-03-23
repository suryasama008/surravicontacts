'use client'
import { useState, useEffect } from 'react'
import { createContact, updateContact } from '@/lib/queries/contacts'
import { getCompanyNames } from '@/lib/queries/companies'
import type { Contact } from '@/types'
import Modal from '@/components/ui/Modal'

export default function ContactForm({ contact, onClose, onSave }: {
  contact: Contact | null
  onClose: () => void
  onSave: () => void
}) {
  const [companies, setCompanies] = useState<{id:string;name:string}[]>([])
  const [saving, setSaving] = useState(false)
  const [companyChanged, setCompanyChanged] = useState(false)
  const [form, setForm] = useState({
    full_name: contact?.full_name || '',
    phone1: contact?.phones?.[0] || '',
    phone2: contact?.phones?.[1] || '',
    email1: contact?.emails?.[0] || '',
    email2: contact?.emails?.[1] || '',
    job_title: contact?.job_title || '',
    company_id: contact?.company_id || '',
    company_name: contact?.company_name || '',
    city: contact?.city || '',
    address: contact?.address || '',
    notes: contact?.notes || '',
    tags: contact?.tags?.join(', ') || '',
  })

  useEffect(() => { getCompanyNames().then(setCompanies).catch(console.error) }, [])

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'company_id' && contact?.company_id && v !== contact.company_id) {
      setCompanyChanged(true)
    } else if (k === 'company_id') {
      setCompanyChanged(false)
    }
  }

  async function handleSave() {
    if (!form.full_name.trim()) { alert('Full name is required'); return }
    setSaving(true)
    try {
      const selectedCompany = companies.find(c => c.id === form.company_id)
      const phones = [form.phone1, form.phone2].filter(Boolean)
      const emails = [form.email1, form.email2].filter(Boolean)
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      const payload: any = {
        full_name: form.full_name.trim(),
        phones, emails, tags,
        job_title: form.job_title || null,
        company_id: form.company_id || null,
        company_name: selectedCompany?.name || null,
        city: form.city || null,
        address: form.address || null,
        notes: form.notes || null,
      }
      if (contact) {
        await updateContact(contact.id, payload)
      } else {
        await createContact(payload)
      }
      onSave()
    } catch (e: any) {
      alert('Error saving: ' + (e?.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={contact ? 'Edit contact' : 'Add contact'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Full name *">
          <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="First and last name" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input className="input" value={form.phone1} onChange={e => set('phone1', e.target.value)} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Phone 2">
            <input className="input" value={form.phone2} onChange={e => set('phone2', e.target.value)} placeholder="Optional" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input className="input" value={form.email1} onChange={e => set('email1', e.target.value)} placeholder="email@company.com" />
          </Field>
          <Field label="Email 2">
            <input className="input" value={form.email2} onChange={e => set('email2', e.target.value)} placeholder="Optional" />
          </Field>
        </div>

        <Field label="Job title">
          <input className="input" value={form.job_title} onChange={e => set('job_title', e.target.value)} placeholder="e.g. Procurement Manager" />
        </Field>

        <Field label="Company">
          <select className="input" value={form.company_id} onChange={e => set('company_id', e.target.value)}>
            <option value="">— No company —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {companyChanged && contact?.company_name && (
            <div className="mt-1.5 text-xs bg-brand-light text-brand-dark rounded-lg px-3 py-2">
              Previous company "{contact.company_name}" will be saved to history automatically.
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Hyderabad" />
          </Field>
          <Field label="Tags">
            <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="supplier, vip" />
          </Field>
        </div>

        <Field label="Address (paste freely)">
          <textarea className="input resize-none" rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Paste full address here" />
        </Field>

        <Field label="Notes / Remarks">
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes…" />
        </Field>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save contact'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}
