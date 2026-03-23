import { createClient } from '@/lib/supabase/client'
import type { Material } from '@/types'

export async function getMaterials() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('category')
    .order('name')
  if (error) throw error
  return data as Material[]
}

export async function getCompanyMaterials(companyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('company_materials')
    .select('material_id, material:materials(id, name, category)')
    .eq('company_id', companyId)
  if (error) throw error
  return (data || []).map((r: any) => r.material).filter(Boolean) as Material[]
}

export async function setCompanyMaterials(companyId: string, materialIds: string[]) {
  const supabase = createClient()
  await supabase.from('company_materials').delete().eq('company_id', companyId)
  if (materialIds.length === 0) return
  const rows = materialIds.map(id => ({ company_id: companyId, material_id: id }))
  const { error } = await supabase.from('company_materials').insert(rows)
  if (error) throw error
}

export async function createMaterial(name: string, category: string) {
  const supabase = createClient()
  const { data: existing } = await supabase
    .from('materials').select('id, name, category').ilike('name', name.trim()).maybeSingle()
  if (existing) return existing as Material
  const { data, error } = await supabase
    .from('materials').insert({ name: name.trim(), category }).select().single()
  if (error) throw error
  return data as Material
}

export async function searchMaterials(query: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('materials')
    .select('id, name, category')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(50)
  if (error) throw error
  return data as Material[]
}

// Find all companies that supply a given material name
export async function findCompaniesByMaterial(query: string) {
  const supabase = createClient()
  // First find matching material IDs
  const { data: mats, error: mErr } = await supabase
    .from('materials')
    .select('id, name, category')
    .ilike('name', `%${query}%`)
  if (mErr) throw mErr
  if (!mats || mats.length === 0) return []

  const matIds = mats.map((m: any) => m.id)

  // Then find company_materials for those IDs
  const { data, error } = await supabase
    .from('company_materials')
    .select('material_id, company:companies(id, name, country, city, types)')
    .in('material_id', matIds)
  if (error) throw error

  // Join material info back in
  const matMap = Object.fromEntries(mats.map((m: any) => [m.id, m]))
  return (data || [])
    .filter((r: any) => r.company)
    .map((r: any) => ({
      material: matMap[r.material_id],
      company: r.company,
    }))
}
