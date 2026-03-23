import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'contacts'
  const body = await req.json()
  const supabase = createAdminClient()

  try {
    // ── CONTACTS ──────────────────────────────────────────────────────────
    if (type === 'contacts') {
      const rows: any[] = body.workbook[0]?.data || []

      const mapped = rows
        .map((r: any) => {
          const name = (r['full_name'] || r['Full Name'] || r['name'] || r['Name'] || '').trim()
          if (!name) return null
          const phone1 = String(r['phone'] || r['Phone'] || r['Mobile'] || r['mobile'] || '').trim()
          const phone2 = String(r['phone_2'] || r['Phone 2'] || r['Phone2'] || '').trim()
          const email1 = String(r['email'] || r['Email'] || '').trim()
          const email2 = String(r['email_2'] || r['Email 2'] || r['Email2'] || '').trim()
          const phones = [phone1, phone2].filter(p => p && p !== 'undefined' && p !== 'null')
          const emails = [email1, email2].filter(e => e && e !== 'undefined' && e !== 'null' && e.includes('@'))
          const tagsRaw = String(r['tags'] || r['Tags'] || '')
          const tags = tagsRaw.split(/[,;]/).map((t: string) => t.trim()).filter(Boolean)
          const company_name = String(r['company_name'] || r['Company'] || r['company'] || '').trim() || null
          return {
            full_name: name,
            phones, emails, tags,
            job_title: r['job_title'] || r['Job Title'] || r['Designation'] || null,
            company_name,
            city: r['city'] || r['City'] || null,
            address: r['address'] || r['Address'] || r['Office Address'] || null,
            notes: r['notes'] || r['Notes'] || null,
          }
        })
        .filter(Boolean) as any[]

      const skipped = rows.length - mapped.length

      // Bulk-fetch company IDs in one query
      const companyNames = [...new Set(mapped.map(m => m.company_name).filter(Boolean))] as string[]
      const companyMap: Record<string, string> = {}
      if (companyNames.length > 0) {
        const { data: cos } = await supabase.from('companies').select('id,name').in('name', companyNames)
        cos?.forEach((c: any) => { companyMap[c.name] = c.id })
      }

      const withIds = mapped.map(m => ({
        ...m,
        company_id: m.company_name ? (companyMap[m.company_name] || null) : null,
      }))

      // Batch upsert in chunks of 200 — one DB call per chunk
      let imported = 0
      for (const batch of chunk(withIds, 200)) {
        const { error, data } = await supabase
          .from('contacts')
          .upsert(batch, { onConflict: 'full_name,company_name', ignoreDuplicates: false })
          .select('id')
        if (error) {
          // Fallback: insert individually only if batch fails
          for (const contact of batch) {
            const { error: e2 } = await supabase.from('contacts')
              .upsert(contact, { onConflict: 'full_name,company_name', ignoreDuplicates: true })
            if (!e2) imported++
          }
        } else {
          imported += (data?.length || batch.length)
        }
      }

      return NextResponse.json({ message: `✓ ${imported} of ${rows.length} contacts imported · ${skipped} skipped (missing name)` })
    }

    // ── COMPANIES + MATERIALS ─────────────────────────────────────────────
    if (type === 'companies') {
      const companiesSheet: any[] = body.workbook[0]?.data || []
      const materialsSheet: any[] = body.workbook[1]?.data || []

      // 1. Upsert all companies in one batch
      const compMapped = companiesSheet
        .filter((r: any) => (r['company_name'] || r['Company'] || '').trim())
        .map((r: any) => {
          const typesRaw = String(r['types'] || r['Types'] || r['type'] || r['Type'] || '')
          const types = typesRaw.split(/[,;|]/).map((t: string) => t.trim().toLowerCase()).filter(Boolean)
          return {
            name: (r['company_name'] || r['Company']).trim(),
            types,
            country: r['country'] || r['Country'] || null,
            city: r['city'] || r['City'] || null,
            address: r['address'] || r['Address'] || null,
            phones: [String(r['phone'] || r['Phone'] || '')].filter(p => p && p !== 'undefined'),
            emails: [String(r['email'] || r['Email'] || '')].filter(e => e && e.includes('@')),
            website: r['website'] || r['Website'] || null,
            notes: r['notes'] || r['Notes'] || null,
          }
        })

      let compImported = 0
      if (compMapped.length > 0) {
        for (const batch of chunk(compMapped, 200)) {
          const { error } = await supabase.from('companies').upsert(batch, { onConflict: 'name' })
          if (error) throw new Error('Companies import failed: ' + error.message)
          compImported += batch.length
        }
      }

      let matImported = 0
      let matCreated = 0

      if (materialsSheet.length > 0) {
        // 2. Load all existing materials and companies in 2 queries
        const [matsRes, cosRes] = await Promise.all([
          supabase.from('materials').select('id,name'),
          supabase.from('companies').select('id,name'),
        ])

        const matMap: Record<string, string> = {}
        matsRes.data?.forEach((m: any) => { matMap[m.name.toLowerCase()] = m.id })

        const coMap: Record<string, string> = {}
        cosRes.data?.forEach((c: any) => { coMap[c.name.toLowerCase()] = c.id })

        // 3. Find which materials need to be created
        const validRows = materialsSheet.filter((r: any) => {
          const coName = String(r['company_name'] || r['Company'] || '').trim()
          const matName = String(r['material_name'] || r['Material'] || r['material_name'] || '').trim()
          return coName && matName && coMap[coName.toLowerCase()]
        })

        const newMaterialNames = [...new Set(
          validRows
            .map((r: any) => ({
              name: String(r['material_name'] || r['Material'] || '').trim(),
              category: String(r['category'] || r['Category'] || 'Other').trim(),
            }))
            .filter(m => m.name && !matMap[m.name.toLowerCase()])
            .map(m => JSON.stringify(m))
        )].map(s => JSON.parse(s))

        // 4. Batch-insert all new materials at once
        if (newMaterialNames.length > 0) {
          for (const batch of chunk(newMaterialNames, 200)) {
            const { data: newMats } = await supabase
              .from('materials')
              .upsert(batch, { onConflict: 'name', ignoreDuplicates: true })
              .select('id,name')
            newMats?.forEach((m: any) => { matMap[m.name.toLowerCase()] = m.id })
            matCreated += batch.length
          }
          // Re-fetch to get IDs for any that already existed
          const { data: allMats } = await supabase.from('materials').select('id,name')
          allMats?.forEach((m: any) => { matMap[m.name.toLowerCase()] = m.id })
        }

        // 5. Build all company_materials links and upsert in one batch
        const links = validRows
          .map((r: any) => {
            const coName = String(r['company_name'] || r['Company'] || '').trim().toLowerCase()
            const matName = String(r['material_name'] || r['Material'] || '').trim().toLowerCase()
            const coId = coMap[coName]
            const matId = matMap[matName]
            if (!coId || !matId) return null
            return { company_id: coId, material_id: matId }
          })
          .filter(Boolean) as any[]

        // Deduplicate links
        const uniqueLinks = [...new Map(links.map(l => [`${l.company_id}:${l.material_id}`, l])).values()]

        for (const batch of chunk(uniqueLinks, 200)) {
          const { error } = await supabase
            .from('company_materials')
            .upsert(batch, { onConflict: 'company_id,material_id', ignoreDuplicates: true })
          if (error) throw new Error('Material links failed: ' + error.message)
          matImported += batch.length
        }
      }

      return NextResponse.json({
        message: `✓ ${compImported} companies · ${matImported} materials linked · ${matCreated} new materials created`
      })
    }

    return NextResponse.json({ error: 'Unknown import type' }, { status: 400 })

  } catch (e: any) {
    console.error('Import error:', e)
    return NextResponse.json({ error: e.message || 'Import failed' }, { status: 500 })
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
