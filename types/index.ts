export interface Company {
  id: string
  name: string
  types: string[]
  country: string | null
  city: string | null
  address: string | null
  phones: string[]
  emails: string[]
  website: string | null
  notes: string | null
  matchedMaterial?: string   // populated during search
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  full_name: string
  phones: string[]
  job_title: string | null
  company_id: string | null
  company_name: string | null
  emails: string[]
  city: string | null
  address: string | null
  tags: string[]
  notes: string | null
  company_history: CompanyHistory[]
  created_at: string
  updated_at: string
  company?: Company
}

export interface CompanyHistory {
  name: string
  company_id: string | null
  until: number
}

export interface Material {
  id: string
  name: string
  category: string | null
  created_at: string
}

export interface ContactListItem {
  id: string
  full_name: string
  phones: string[]
  job_title: string | null
  company_name: string | null
  city: string | null
}
