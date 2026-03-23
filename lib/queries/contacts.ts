import { createClient } from '@/lib/supabase/client'
import type { Contact, ContactListItem } from '@/types'

const PAGE_SIZE = 25

export async function getContactsPage(page: number, letter?: string, limit?: number) {
  const supabase = createClient()
  const size = limit || PAGE_SIZE
  let query = supabase
    .from('contacts')
    .select('id, full_name, phones, job_title, company_name, city', { count: 'estimated' })
    .order('full_name', { ascending: true })
    .range(page * size, (page + 1) * size - 1)
  if (letter && letter !== 'all') query = query.ilike('full_name', `${letter}%`)
  const { data, error, count } = await query
  if (error) throw error
  return { data: data as ContactListItem[], count }
}

export async function getContactById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*, company:companies(id, name, country, city, types)')
    .eq('id', id).single()
  if (error) throw error
  return data as Contact
}

export async function createContact(contact: Partial<Contact>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('contacts').insert(contact).select().single()
  if (error) throw error
  return data
}

export async function updateContact(id: string, contact: Partial<Contact>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts').update({ ...contact, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteContact(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw error
}

export async function searchContacts(query: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('id, full_name, phones, job_title, company_name, city')
    .or(`full_name.ilike.%${query}%,company_name.ilike.%${query}%,city.ilike.%${query}%`)
    .limit(20)
  if (error) throw error
  return data as ContactListItem[]
}

export async function getCompanyContacts(companyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('id, full_name, phones, job_title, company_name')
    .eq('company_id', companyId)
    .order('full_name')
  if (error) throw error
  return data as ContactListItem[]
}

// Find contacts linked to this company: exact company_id OR exact company_name (case-insensitive)
export async function getContactsByCompany(companyId: string, companyName: string) {
  const supabase = createClient()

  // Query 1: contacts where company_id matches exactly (linked via form/import)
  const { data: byId } = await supabase
    .from('contacts')
    .select('id, full_name, phones, job_title, company_name')
    .eq('company_id', companyId)
    .order('full_name')

  // Query 2: contacts where company_name is an exact case-insensitive match
  const { data: byExactName } = await supabase
    .from('contacts')
    .select('id, full_name, phones, job_title, company_name')
    .ilike('company_name', companyName.trim())  // ilike with no wildcards = exact case-insensitive
    .order('full_name')

  // Merge and dedup — no fuzzy, no partial
  const seen = new Map<string, ContactListItem>()
  ;[...(byId || []), ...(byExactName || [])].forEach(c => {
    if (!seen.has(c.id)) seen.set(c.id, c as ContactListItem)
  })
  return [...seen.values()]
}
