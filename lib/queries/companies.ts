import { createClient } from '@/lib/supabase/client'
import type { Company } from '@/types'

function dedup(arr: Company[]): Company[] {
  const seen = new Map<string, Company>()
  arr.forEach(c => { if (!seen.has(c.id)) seen.set(c.id, c) })
  return [...seen.values()]
}

export async function getCompanies(typeFilter?: string) {
  const supabase = createClient()
  let query = supabase.from('companies').select('*').order('name', { ascending: true })
  if (typeFilter && typeFilter !== 'all') {
    query = query.contains('types', [typeFilter])
  }
  const { data, error } = await query
  if (error) throw error
  return dedup(data as Company[])
}

export async function getCompanyById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('companies').select('*').eq('id', id).single()
  if (error) throw error
  return data as Company
}

export async function createCompany(company: Partial<Company>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('companies').insert(company).select().single()
  if (error) throw error
  return data as Company
}

export async function updateCompany(id: string, company: Partial<Company>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('companies').update({ ...company, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return data as Company
}

export async function deleteCompany(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw error
}

// Search companies by name/country/city AND by material name they supply
export async function searchCompanies(query: string): Promise<(Company & { matchedMaterial?: string })[]> {
  const supabase = createClient()

  const [byName, byCountry, byCity, matIds] = await Promise.all([
    supabase.from('companies')
      .select('id, name, types, country, city')
      .ilike('name', `%${query}%`)
      .order('name').limit(30),

    supabase.from('companies')
      .select('id, name, types, country, city')
      .ilike('country', `%${query}%`)
      .order('name').limit(20),

    supabase.from('companies')
      .select('id, name, types, country, city')
      .ilike('city', `%${query}%`)
      .order('name').limit(20),

    // Step 1: find matching material IDs
    supabase.from('materials')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .limit(50),
  ])

  // Step 2: find company_materials rows for those material IDs
  const byMaterialRows: (Company & { matchedMaterial?: string })[] = []
  if (matIds.data && matIds.data.length > 0) {
    const matIdList = matIds.data.map((m: any) => m.id)
    const matNameMap: Record<string, string> = {}
    matIds.data.forEach((m: any) => { matNameMap[m.id] = m.name })

    const { data: cmRows } = await supabase
      .from('company_materials')
      .select('company_id, material_id, companies(id, name, types, country, city)')
      .in('material_id', matIdList)

    ;(cmRows || []).forEach((row: any) => {
      if (!row.companies) return
      byMaterialRows.push({
        ...row.companies,
        matchedMaterial: matNameMap[row.material_id],
      })
    })
  }

  const combined = [
    ...(byName.data || []),
    ...(byCountry.data || []),
    ...(byCity.data || []),
    ...byMaterialRows,
  ]

  // Dedup — prefer rows with matchedMaterial info
  const seen = new Map<string, Company & { matchedMaterial?: string }>()
  combined.forEach(c => {
    if (!seen.has(c.id) || (c as any).matchedMaterial) seen.set(c.id, c as any)
  })
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export async function getCompanyNames() {
  const supabase = createClient()
  const { data, error } = await supabase.from('companies').select('id, name').order('name')
  if (error) throw error
  return data as { id: string; name: string }[]
}
