'use client'
import { useState, useEffect } from 'react'
import { getContactById, deleteContact } from '@/lib/queries/contacts'
import type { Contact } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

export default function ContactDetail({ id, onBack, onEdit, onDelete }: {
  id: string
  onBack: () => void
  onEdit: (c: Contact) => void
  onDelete: () => void
}) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    getContactById(id).then(setContact).catch(console.error).finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm('Delete this contact?')) return
    setDeleting(true)
    await deleteContact(id)
    onDelete()
  }

  if (loading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="flex gap-4"><div className="w-14 h-14 rounded-full bg-gray-200"/><div className="flex-1 space-y-2 pt-2"><div className="h-4 bg-gray-200 rounded w-1/2"/><div className="h-3 bg-gray-100 rounded w-1/3"/></div></div>
      <div className="space-y-2">{[1,2,3,4].map(i=><div key={i} className="h-3 bg-gray-100 rounded"/>)}</div>
    </div>
  )
  if (!contact) return <div className="p-6 text-gray-400 text-sm">Contact not found</div>

  return (
    <div className="p-5">
      {/* Back button — mobile only */}
      <button onClick={onBack} className="md:hidden flex items-center gap-1 text-sm text-brand mb-4">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back
      </button>

      {/* Header */}
      <div className="flex gap-4 items-start mb-5">
        <Avatar name={contact.full_name} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">{contact.full_name}</h2>
          {contact.job_title && <p className="text-sm text-gray-500">{contact.job_title}</p>}
          {contact.company_name && <p className="text-sm text-brand font-medium mt-0.5">{contact.company_name}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-5">
        {contact.phones[0] && (
          <a href={`tel:${contact.phones[0]}`} className="btn flex items-center gap-1.5 text-sm">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 3a1 1 0 011-1h2.5l1 3-1.5 1.5a9 9 0 004.5 4.5L12 9.5l3 1V13a1 1 0 01-1 1C7 14 2 9 2 4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/></svg>
            Call
          </a>
        )}
        {contact.emails[0] && (
          <a href={`mailto:${contact.emails[0]}`} className="btn flex items-center gap-1.5 text-sm">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M2 5l6 5 6-5" stroke="currentColor" strokeWidth="1.2"/></svg>
            Email
          </a>
        )}
        <button onClick={() => onEdit(contact)} className="btn flex items-center gap-1.5 text-sm">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          Edit
        </button>
        <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-1.5 text-sm ml-auto">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l1 9.5A.5.5 0 004.5 14h7a.5.5 0 00.5-.5L13 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {/* Info sections */}
      <div className="space-y-4">
        <Section title="Contact info">
          {contact.phones.map((p,i) => <Row key={i} label={i===0?'Phone':'Phone 2'} value={<a href={`tel:${p}`} className="text-brand">{p}</a>} />)}
          {contact.emails.map((e,i) => <Row key={i} label={i===0?'Email':'Email 2'} value={<a href={`mailto:${e}`} className="text-brand truncate">{e}</a>} />)}
          {contact.city && <Row label="City" value={contact.city} />}
          {contact.address && <Row label="Address" value={<span className="text-xs leading-relaxed">{contact.address}</span>} />}
        </Section>

        {contact.tags?.length > 0 && (
          <Section title="Tags">
            <div className="flex gap-1.5 flex-wrap pt-1">
              {contact.tags.map(t => <Badge key={t} label={t} />)}
            </div>
          </Section>
        )}

        {contact.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 leading-relaxed">{contact.notes}</p>
          </Section>
        )}

        {contact.company_history?.length > 0 && (
          <Section title="Company history">
            <div className="space-y-2">
              {contact.company_history.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-500 border-l-2 border-gray-200 pl-3 py-0.5">
                  <span>{h.name}</span>
                  <span className="text-xs text-gray-400">until {h.until}</span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-3">{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 flex-shrink-0 w-20">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right flex-1 min-w-0 ml-2">{value}</span>
    </div>
  )
}
