'use client'
import { useState, useRef } from 'react'

export default function ImportClient() {
  const [tab, setTab] = useState<'contacts' | 'companies'>('contacts')
  const [contactPreview, setContactPreview] = useState<any[]>([])
  const [companyPreview, setCompanyPreview] = useState<any[]>([])
  const [materialPreview, setMaterialPreview] = useState<any[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setContactPreview([]); setCompanyPreview([]); setMaterialPreview([])
    setFileName(''); setResult('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult('')
    setContactPreview([]); setCompanyPreview([]); setMaterialPreview([])

    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)

    if (tab === 'contacts') {
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws)
      const prev = rows.map((r, i) => {
        const name = String(r['full_name'] || r['Full Name'] || r['name'] || r['Name'] || '').trim()
        const company = String(r['company_name'] || r['Company'] || r['company'] || '').trim()
        const phone = String(r['phone'] || r['Phone'] || r['Mobile'] || '').trim()
        const email = String(r['email'] || r['Email'] || '').trim()
        const job = String(r['job_title'] || r['Job Title'] || '').trim()
        if (!name) return { row: i + 2, name: '(empty)', company, phone, status: 'skip', message: 'Missing full_name — will skip' }
        return { row: i + 2, name, company, phone, email, job, status: 'ready' }
      })
      setContactPreview(prev)

    } else {
      // Companies tab — read Sheet1 (companies) and Sheet2 (materials)
      const sheet1 = wb.Sheets[wb.SheetNames[0]]
      const sheet2 = wb.SheetNames[1] ? wb.Sheets[wb.SheetNames[1]] : null

      const compRows: any[] = XLSX.utils.sheet_to_json(sheet1)
      const compPrev = compRows.map((r, i) => {
        const name = String(r['company_name'] || r['Company'] || r['name'] || '').trim()
        const types = String(r['types'] || r['Types'] || r['type'] || '').trim()
        const country = String(r['country'] || r['Country'] || '').trim()
        const phone = String(r['phone'] || r['Phone'] || '').trim()
        if (!name) return { row: i + 2, name: '(empty)', types, country, phone, status: 'skip', message: 'Missing company_name — will skip' }
        return { row: i + 2, name, types, country, phone, status: 'ready' }
      })
      setCompanyPreview(compPrev)

      if (sheet2) {
        const matRows: any[] = XLSX.utils.sheet_to_json(sheet2)
        const matPrev = matRows.map((r, i) => {
          const company = String(r['company_name'] || r['Company'] || '').trim()
          const material = String(r['material_name'] || r['Material'] || r['material'] || '').trim()
          const category = String(r['category'] || r['Category'] || '').trim()
          if (!company || !material) return { row: i + 2, company, material, category, status: 'skip', message: 'Missing company_name or material_name' }
          return { row: i + 2, company, material, category, status: 'ready' }
        })
        setMaterialPreview(matPrev)
      }
    }
  }

  async function runImport() {
    if (!fileRef.current?.files?.[0]) return
    setImporting(true)
    setResult('')
    const file = fileRef.current.files[0]
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)
    try {
      const res = await fetch(`/api/import?type=${tab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workbook: wb.SheetNames.map(name => ({
            name,
            data: XLSX.utils.sheet_to_json(wb.Sheets[name])
          }))
        })
      })
      const data = await res.json()
      if (data.error) setResult('❌ Error: ' + data.error)
      else setResult('✓ ' + data.message)
    } catch (e: any) {
      setResult('❌ Error: ' + e.message)
    } finally {
      setImporting(false)
    }
  }

  const hasPreview = tab === 'contacts' ? contactPreview.length > 0 : companyPreview.length > 0
  const readyCount = tab === 'contacts'
    ? contactPreview.filter(r => r.status === 'ready').length
    : companyPreview.filter(r => r.status === 'ready').length
  const skipCount = tab === 'contacts'
    ? contactPreview.filter(r => r.status === 'skip').length
    : companyPreview.filter(r => r.status === 'skip').length

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-900">Import from Excel</h1>
        <p className="text-xs text-gray-400 mt-0.5">Upload your .xlsx file and preview before importing</p>
      </div>

      <div className="p-5 max-w-2xl space-y-5">

        {/* Tab selector */}
        <div className="flex gap-2">
          {(['contacts', 'companies'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); reset() }}
              className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors ${tab === t ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Format guide */}
        <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 font-medium text-gray-700">
            {tab === 'contacts' ? 'Contacts .xlsx — one sheet, one row per person' : 'Companies .xlsx — two sheets in one file'}
          </div>
          <div className="p-4 space-y-2 text-gray-600">
            {tab === 'contacts' ? (
              <table className="w-full">
                <thead><tr className="text-gray-400"><th className="text-left pb-1">Column name</th><th className="text-left pb-1">Required</th><th className="text-left pb-1">Example</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['full_name','✓ required','Ahmed Al-Rashid'],
                    ['phone','','+ 971 50 123 4567'],
                    ['phone_2','','+ 971 55 987 6543'],
                    ['email','','ahmed@company.com'],
                    ['job_title','','CEO'],
                    ['company_name','','Atlas Steel Industries'],
                    ['city','','Dubai'],
                    ['address','','Sheikh Zayed Rd, Dubai'],
                    ['notes','','Key contact for bulk orders'],
                  ].map(([col, req, ex]) => (
                    <tr key={col}>
                      <td className="py-1 font-mono text-brand">{col}</td>
                      <td className="py-1">{req}</td>
                      <td className="py-1 text-gray-400">{ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <>
                <div className="font-medium text-gray-700 mb-1">Sheet 1 — Company info</div>
                <table className="w-full mb-3">
                  <thead><tr className="text-gray-400"><th className="text-left pb-1">Column name</th><th className="text-left pb-1">Required</th><th className="text-left pb-1">Example</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ['company_name','✓ required','Surravi Phharma'],
                      ['types','','importer;distributor  or  manufacturer;supplier'],
                      ['country','','India'],
                      ['city','','Hyderabad'],
                      ['address','','Plot 158, Hayath Nagar, Hyderabad'],
                      ['phone','','+91 80080 02576'],
                      ['email','','info@company.com'],
                      ['website','','www.company.com'],
                      ['notes','','Long term partner'],
                    ].map(([col, req, ex]) => (
                      <tr key={col}>
                        <td className="py-1 font-mono text-brand">{col}</td>
                        <td className="py-1">{req}</td>
                        <td className="py-1 text-gray-400">{ex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="font-medium text-gray-700 mb-1">Sheet 2 — Materials (same file, second sheet)</div>
                <table className="w-full">
                  <thead><tr className="text-gray-400"><th className="text-left pb-1">Column name</th><th className="text-left pb-1">Required</th><th className="text-left pb-1">Example</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ['company_name','✓ required','Surravi Phharma'],
                      ['material_name','✓ required','Vitamin C (Ascorbic Acid)'],
                      ['category','','Vitamins'],
                    ].map(([col, req, ex]) => (
                      <tr key={col}>
                        <td className="py-1 font-mono text-brand">{col}</td>
                        <td className="py-1">{req}</td>
                        <td className="py-1 text-gray-400">{ex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 px-3 py-2 bg-amber-50 rounded-lg text-amber-700">
                  <strong>Important:</strong> The company_name in Sheet 2 must exactly match the company_name in Sheet 1.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Upload zone */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand hover:bg-brand-light transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <svg className="mx-auto mb-2" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 15V4M8 8l4-4 4 4M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm text-gray-500">{fileName || 'Click to select .xlsx file'}</p>
          <p className="text-xs text-gray-400 mt-1">{tab === 'companies' ? 'File must have 2 sheets: companies + materials' : 'One sheet, one row per contact'}</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        </div>

        {/* CONTACTS PREVIEW */}
        {tab === 'contacts' && contactPreview.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-900">{fileName}</p>
                <p className="text-xs text-gray-400">{readyCount} ready · {skipCount} will skip</p>
              </div>
              <button onClick={runImport} disabled={importing || readyCount === 0} className="btn-primary text-sm disabled:opacity-50">
                {importing ? 'Importing…' : `Import ${readyCount} contacts`}
              </button>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Row','Full name','Company','Phone','Job title','Status'].map(h =>
                      <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {contactPreview.map((r, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${r.status === 'skip' ? 'bg-red-50' : ''}`}>
                      <td className="px-3 py-2 text-gray-400">{r.row}</td>
                      <td className={`px-3 py-2 font-medium ${r.status === 'skip' ? 'text-red-500' : 'text-gray-900'}`}>{r.name}</td>
                      <td className="px-3 py-2 text-gray-600">{r.company}</td>
                      <td className="px-3 py-2 text-gray-600">{r.phone}</td>
                      <td className="px-3 py-2 text-gray-600">{r.job}</td>
                      <td className={`px-3 py-2 font-medium ${r.status === 'ready' ? 'text-brand' : 'text-red-500'}`}>
                        {r.message || (r.status === 'ready' ? 'Ready' : r.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMPANIES PREVIEW */}
        {tab === 'companies' && companyPreview.length > 0 && (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Sheet 1 — Companies ({readyCount} ready{skipCount > 0 ? ` · ${skipCount} skip` : ''})</p>
                  {materialPreview.length > 0 && (
                    <p className="text-xs text-gray-400">Sheet 2 — {materialPreview.filter(r => r.status === 'ready').length} material rows detected</p>
                  )}
                </div>
                <button onClick={runImport} disabled={importing || readyCount === 0} className="btn-primary text-sm disabled:opacity-50">
                  {importing ? 'Importing…' : `Import ${readyCount} companies`}
                </button>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Row','Company name','Types','Country','Phone','Status'].map(h =>
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {companyPreview.map((r, i) => (
                      <tr key={i} className={`border-b border-gray-100 ${r.status === 'skip' ? 'bg-red-50' : ''}`}>
                        <td className="px-3 py-2 text-gray-400">{r.row}</td>
                        <td className={`px-3 py-2 font-medium ${r.status === 'skip' ? 'text-red-500' : 'text-gray-900'}`}>{r.name}</td>
                        <td className="px-3 py-2 text-gray-600">{r.types}</td>
                        <td className="px-3 py-2 text-gray-600">{r.country}</td>
                        <td className="px-3 py-2 text-gray-600">{r.phone}</td>
                        <td className={`px-3 py-2 font-medium ${r.status === 'ready' ? 'text-brand' : 'text-red-500'}`}>
                          {r.message || (r.status === 'ready' ? 'Ready' : r.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Materials preview */}
            {materialPreview.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">Sheet 2 — Materials preview</p>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Row','Company','Material name','Category','Status'].map(h =>
                          <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {materialPreview.map((r, i) => (
                        <tr key={i} className={`border-b border-gray-100 ${r.status === 'skip' ? 'bg-red-50' : ''}`}>
                          <td className="px-3 py-2 text-gray-400">{r.row}</td>
                          <td className="px-3 py-2 text-gray-600">{r.company}</td>
                          <td className={`px-3 py-2 font-medium ${r.status === 'skip' ? 'text-red-500' : 'text-gray-900'}`}>{r.material}</td>
                          <td className="px-3 py-2 text-gray-600">{r.category}</td>
                          <td className={`px-3 py-2 font-medium ${r.status === 'ready' ? 'text-brand' : 'text-red-500'}`}>
                            {r.message || (r.status === 'ready' ? 'Ready' : r.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-xl text-sm font-medium ${result.startsWith('❌') ? 'bg-red-50 text-red-700' : 'bg-brand-light text-brand-dark'}`}>
            {result}
          </div>
        )}
      </div>
    </div>
  )
}
